import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { CanonicalToolRegistryEntry, RuntimeCapability } from "@/schemas/toolRegistrySchema";
import type {
  CredentialScopePolicy,
  FilesystemBoundaryPolicy,
  IsolationEvaluationArtifacts,
  IsolationLevel,
  IsolationViolation,
  NetworkBoundaryPolicy,
  SandboxAttestationRecord,
  SandboxRuntimeProfile,
  TrustGraphEdge,
  TrustZone,
  ZoneAdmissionRequest,
  ZoneAdmissionResult,
  ZoneAuthorityProfile,
  IsolationAuditEvidence,
  IsolationProvenanceRecord,
} from "./isolationTypes";
import { ISOLATION_FAILURE_CODES } from "./isolationTypes";

const FORBIDDEN_FILESYSTEM_PREFIXES = [
  "tool-registry",
  "services/registry",
  "services/registry-snapshots",
  "services/registry-trust",
  "services/registry-signatures",
  "services/registry-provenance",
  "services/orchestration",
  "services/controlPlane",
  "data",
  "/",
  "\\",
] as const;

const DEFAULT_TRUST_GRAPH: readonly TrustGraphEdge[] = [
  { from: "tenant", to: "simulation", requiresGovernanceApproval: false, replayCompatible: true },
  { from: "recovery", to: "governance", requiresGovernanceApproval: true, replayCompatible: true },
  { from: "governance", to: "forensic", requiresGovernanceApproval: true, replayCompatible: true },
  { from: "autonomy", to: "simulation", requiresGovernanceApproval: true, replayCompatible: true },
] as const;

function sortStrings(values: readonly string[]): string[] {
  return [...values].sort((left, right) => left.localeCompare(right));
}

function normalizePathLike(pathValue: string): string {
  return pathValue.replace(/\\/g, "/").replace(/\/+/g, "/").replace(/^\.\//, "").toLowerCase();
}

function violation(
  code: IsolationViolation["code"],
  message: string,
  path?: string,
  expected?: unknown,
  actual?: unknown,
): IsolationViolation {
  return Object.fromEntries(
    Object.entries({ code, message, path, expected, actual }).filter(([, value]) => value !== undefined),
  ) as IsolationViolation;
}

function getEntryFromSnapshot(input: ZoneAdmissionRequest): CanonicalToolRegistryEntry | undefined {
  return input.snapshot.content.tools.find(
    (candidate) =>
      candidate.toolId === input.binding.toolId &&
      candidate.version === input.binding.toolVersion &&
      candidate.registryHash === input.binding.registryHash,
  );
}

export function deriveTrustZone(entry: CanonicalToolRegistryEntry): TrustZone {
  const capabilities = new Set(entry.runtimeCapabilities);
  if (entry.trustZoneRestrictions?.allowedZones.includes("airgapped")) {
    return "airgapped";
  }
  if (
    entry.trustZoneRestrictions?.allowedZones.includes("forensic") &&
    (capabilities.has("governance") || capabilities.has("recovery"))
  ) {
    return "forensic";
  }
  if (capabilities.has("governance")) {
    return "governance";
  }
  if (capabilities.has("privileged")) {
    return "privileged";
  }
  if (capabilities.has("autonomous")) {
    return "autonomy";
  }
  if (capabilities.has("recovery")) {
    return "recovery";
  }
  if (entry.governanceMetadata.dataSensitivity === "public" && capabilities.size === 1 && capabilities.has("read")) {
    return "public";
  }
  if (
    entry.governanceMetadata.dataSensitivity === "internal" &&
    capabilities.size === 1 &&
    capabilities.has("read") &&
    entry.trustZoneRestrictions?.allowedZones.includes("simulation")
  ) {
    return "simulation";
  }
  if (entry.governanceMetadata.dataSensitivity === "regulated" && capabilities.has("network")) {
    return "infrastructure";
  }
  return "tenant";
}

export function deriveIsolationLevel(entry: CanonicalToolRegistryEntry, trustZone: TrustZone): IsolationLevel {
  if (trustZone === "airgapped") {
    return "airgapped";
  }
  if (trustZone === "forensic") {
    return "forensic";
  }
  if (trustZone === "privileged" || trustZone === "governance" || trustZone === "autonomy" || trustZone === "infrastructure") {
    return "hardened";
  }
  if (trustZone === "tenant" || trustZone === "recovery" || entry.runtimeCapabilities.includes("write") || entry.runtimeCapabilities.includes("network")) {
    return "sandboxed";
  }
  if (trustZone === "public" || trustZone === "simulation") {
    return "restricted";
  }
  return "none";
}

export function deriveAllowedZoneInteractions(entry: CanonicalToolRegistryEntry, trustZone: TrustZone): readonly TrustZone[] {
  const declared = entry.trustZoneRestrictions?.allowedZones
    .filter((zone): zone is TrustZone => [
      "public",
      "tenant",
      "simulation",
      "governance",
      "recovery",
      "autonomy",
      "privileged",
      "infrastructure",
      "forensic",
      "airgapped",
    ].includes(zone))
    ?? [];

  if (declared.length > 0) {
    return sortStrings(declared) as TrustZone[];
  }

  switch (trustZone) {
    case "tenant":
    case "public":
      return ["simulation"];
    case "recovery":
      return ["governance"];
    case "governance":
      return ["forensic"];
    default:
      return [];
  }
}

export function buildZoneAuthorityProfile(entry: CanonicalToolRegistryEntry): ZoneAuthorityProfile {
  const trustZone = deriveTrustZone(entry);
  const allowedZoneInteractions = deriveAllowedZoneInteractions(entry, trustZone);
  const crossZoneAccess = allowedZoneInteractions.length > 0 && entry.runtimeCapabilities.includes("governance");
  const profile = {
    toolId: entry.toolId,
    version: entry.version,
    trustZone,
    isolationLevel: deriveIsolationLevel(entry, trustZone),
    capabilities: entry.runtimeCapabilities,
    crossZoneAccess,
    allowedZoneInteractions,
  } as const;

  return {
    ...profile,
    zoneAuthorityHash: hashStableContent("GOVERNANCE", profile),
  };
}

export function buildFilesystemBoundaryPolicy(entry: CanonicalToolRegistryEntry): FilesystemBoundaryPolicy {
  const policy = {
    mode: "default-deny" as const,
    allowedScopes: sortStrings(entry.capabilityMetadata.write?.scope ?? entry.capabilityMetadata.read?.scope ?? []),
    forbiddenPrefixes: [...FORBIDDEN_FILESYSTEM_PREFIXES],
  };
  return {
    ...policy,
    policyHash: hashStableContent("TOOL_REGISTRY", policy),
  };
}

export function buildNetworkBoundaryPolicy(entry: CanonicalToolRegistryEntry): NetworkBoundaryPolicy {
  const policy = {
    mode: "default-deny" as const,
    allowedDomains: sortStrings(entry.capabilityMetadata.network?.allowedDomains ?? []),
    allowPrivateNetworks: entry.capabilityMetadata.network?.allowPrivateNetworks ?? false,
    allowLocalhost: entry.capabilityMetadata.network?.allowLocalhost ?? false,
  };
  return {
    ...policy,
    policyHash: hashStableContent("REPLAY_BINDING", policy),
  };
}

export function buildCredentialScopePolicy(entry: CanonicalToolRegistryEntry): CredentialScopePolicy {
  const capabilityBoundSecrets = sortStrings(entry.runtimeCapabilities.map((capability) => `capability:${capability}`));
  const policy = {
    temporary: true as const,
    revocable: true as const,
    rootCredentialsAllowed: false as const,
    governanceAuthorityTokensAllowed: false as const,
    orchestrationAuthorityAllowed: false as const,
    capabilityBoundSecrets,
  };
  return {
    ...policy,
    scopeHash: hashStableContent("GOVERNANCE", policy),
  };
}

export function buildSandboxRuntimeProfile(
  entry: CanonicalToolRegistryEntry,
  profile: ZoneAuthorityProfile,
  filesystemPolicy: FilesystemBoundaryPolicy,
  networkPolicy: NetworkBoundaryPolicy,
  credentialScope: CredentialScopePolicy,
): SandboxRuntimeProfile {
  const runtimeConstraints = {
    trustZone: profile.trustZone,
    isolationLevel: profile.isolationLevel,
    filesystemPolicyHash: filesystemPolicy.policyHash,
    networkPolicyHash: networkPolicy.policyHash,
    credentialScopeHash: credentialScope.scopeHash,
    allowedCommands: sortStrings(entry.capabilityMetadata.execute?.allowedCommands ?? []),
  };
  const sandboxId = hashStableContent("REPLAY_CONTEXT", {
    toolId: entry.toolId,
    version: entry.version,
    zoneAuthorityHash: profile.zoneAuthorityHash,
  });
  return {
    sandboxId,
    sandboxHash: hashStableContent("REPLAY_CONTEXT", { sandboxId, runtimeConstraints }),
    runtimeConstraintsHash: hashStableContent("REPLAY_CONTEXT", runtimeConstraints),
    zoneAuthorityHash: profile.zoneAuthorityHash,
    filesystemPolicyHash: filesystemPolicy.policyHash,
    networkPolicyHash: networkPolicy.policyHash,
    credentialScopeHash: credentialScope.scopeHash,
    subprocessPolicy: {
      hiddenSubprocessesBlocked: true,
      allowedCommands: sortStrings(entry.capabilityMetadata.execute?.allowedCommands ?? []),
    },
  };
}

export function buildSandboxAttestation(sandbox: SandboxRuntimeProfile): SandboxAttestationRecord {
  const attestation = {
    sandboxId: sandbox.sandboxId,
    sandboxHash: sandbox.sandboxHash,
    runtimeConstraintsHash: sandbox.runtimeConstraintsHash,
    zoneAuthorityHash: sandbox.zoneAuthorityHash,
  };
  return {
    ...attestation,
    attestationHash: hashStableContent("EVIDENCE_BUNDLE", attestation),
  };
}

export function buildIsolationAuditEvidence(
  input: ZoneAdmissionRequest,
  profile: ZoneAuthorityProfile,
  filesystemPolicy: FilesystemBoundaryPolicy,
  networkPolicy: NetworkBoundaryPolicy,
  credentialScope: CredentialScopePolicy,
  sandbox: SandboxRuntimeProfile,
): IsolationAuditEvidence {
  const audit = {
    toolId: input.binding.toolId,
    toolVersion: input.binding.toolVersion,
    trustZone: profile.trustZone,
    sandboxId: sandbox.sandboxId,
    isolationLevel: profile.isolationLevel,
    filesystemPolicyHash: filesystemPolicy.policyHash,
    networkPolicyHash: networkPolicy.policyHash,
    credentialScopeHash: credentialScope.scopeHash,
    governanceHash: input.binding.governanceHash,
    zoneAuthorityHash: profile.zoneAuthorityHash,
  };
  return {
    ...audit,
    auditHash: hashStableContent("EVIDENCE_BUNDLE", audit),
  };
}

export function buildIsolationProvenance(
  input: ZoneAdmissionRequest,
  profile: ZoneAuthorityProfile,
  sandboxAttestation: SandboxAttestationRecord,
): IsolationProvenanceRecord {
  const payload = {
    bindingHash: input.binding.bindingHash,
    registrySnapshotHash: input.snapshot.manifest.registrySnapshotHash,
    zoneAuthorityHash: profile.zoneAuthorityHash,
    attestationHash: sandboxAttestation.attestationHash,
  };
  return {
    ...payload,
    provenanceHash: hashStableContent("EVIDENCE_BUNDLE", payload),
  };
}

export function getTrustGraph(): readonly TrustGraphEdge[] {
  return DEFAULT_TRUST_GRAPH;
}

function hasGovernanceCapability(entry: CanonicalToolRegistryEntry): boolean {
  return entry.runtimeCapabilities.includes("governance");
}

function isZoneInteractionAllowed(source: TrustZone, target: TrustZone, profile: ZoneAuthorityProfile): boolean {
  if (source === target) {
    return true;
  }
  if (profile.allowedZoneInteractions.includes(target)) {
    return true;
  }
  return DEFAULT_TRUST_GRAPH.some((edge) => edge.from === source && edge.to === target);
}

export function validateCrossZoneAccess(
  input: ZoneAdmissionRequest,
  profile: ZoneAuthorityProfile,
): readonly IsolationViolation[] {
  const violations: IsolationViolation[] = [];
  const source = input.sourceZone ?? profile.trustZone;
  const target = input.crossZoneTarget ?? input.requestedZone ?? profile.trustZone;

  if (!isZoneInteractionAllowed(source, target, profile)) {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.TRUST_ZONE_CROSSING_FORBIDDEN,
        "cross-zone invocation is not allowed for this tool authority profile",
        "crossZoneTarget",
        profile.allowedZoneInteractions,
        target,
      ),
    );
  }

  if (source !== profile.trustZone && !profile.crossZoneAccess) {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.ZONE_TRUST_SCOPE_VIOLATION,
        "tool trust zone scope does not allow inherited cross-zone execution",
        "sourceZone",
        profile.trustZone,
        source,
      ),
    );
  }

  return violations;
}

export function validateFilesystemBoundary(
  pathValue: string | undefined,
  policy: FilesystemBoundaryPolicy,
): readonly IsolationViolation[] {
  if (!pathValue) {
    return [];
  }

  const normalized = normalizePathLike(pathValue);
  if (normalized.includes("../") || normalized.startsWith("..")) {
    return [
      violation(
        ISOLATION_FAILURE_CODES.TOOL_FILESYSTEM_BOUNDARY_VIOLATION,
        "filesystem traversal outside the sandbox is forbidden",
        "requestedFilesystemPath",
        policy.allowedScopes,
        pathValue,
      ),
    ];
  }

  if (policy.forbiddenPrefixes.some((prefix) => normalized.startsWith(normalizePathLike(prefix)))) {
    return [
      violation(
        ISOLATION_FAILURE_CODES.TOOL_FILESYSTEM_BOUNDARY_VIOLATION,
        "filesystem access to protected registry or orchestration state is forbidden",
        "requestedFilesystemPath",
        policy.allowedScopes,
        pathValue,
      ),
    ];
  }

  if (policy.allowedScopes.length > 0 && !policy.allowedScopes.some((scope) => normalized.startsWith(normalizePathLike(scope)))) {
    return [
      violation(
        ISOLATION_FAILURE_CODES.TOOL_FILESYSTEM_BOUNDARY_VIOLATION,
        "filesystem request falls outside the declared capability scope",
        "requestedFilesystemPath",
        policy.allowedScopes,
        pathValue,
      ),
    ];
  }

  return [];
}

function isPrivateLikeDomain(domain: string): boolean {
  const lower = domain.toLowerCase();
  return lower === "localhost" || lower.endsWith(".local") || /^(\d{1,3}\.){3}\d{1,3}$/.test(lower);
}

export function validateNetworkBoundary(
  domain: string | undefined,
  policy: NetworkBoundaryPolicy,
): readonly IsolationViolation[] {
  if (!domain) {
    return [];
  }

  const normalized = domain.toLowerCase();
  if (!policy.allowedDomains.includes(normalized)) {
    if (normalized === "localhost" && policy.allowLocalhost) {
      return [];
    }
    if (isPrivateLikeDomain(normalized) && policy.allowPrivateNetworks) {
      return [];
    }
    return [
      violation(
        ISOLATION_FAILURE_CODES.TOOL_NETWORK_POLICY_VIOLATION,
        "network access is forbidden outside the declared allowlist",
        "requestedDomain",
        policy.allowedDomains,
        domain,
      ),
    ];
  }

  return [];
}

export function validateCredentialScope(
  credential: string | undefined,
  policy: CredentialScopePolicy,
): readonly IsolationViolation[] {
  if (!credential) {
    return [];
  }
  if (!policy.capabilityBoundSecrets.includes(credential)) {
    return [
      violation(
        ISOLATION_FAILURE_CODES.TOOL_CREDENTIAL_SCOPE_VIOLATION,
        "credential access is outside the scoped capability-bound secret set",
        "requestedCredential",
        policy.capabilityBoundSecrets,
        credential,
      ),
    ];
  }
  return [];
}

export function validateProcessBoundary(
  command: string | undefined,
  hiddenSubprocess: boolean | undefined,
  sandbox: SandboxRuntimeProfile,
): readonly IsolationViolation[] {
  const violations: IsolationViolation[] = [];
  if (hiddenSubprocess) {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.TOOL_PROCESS_BOUNDARY_VIOLATION,
        "hidden subprocess spawning is forbidden",
        "hiddenSubprocess",
        false,
        true,
      ),
    );
  }
  if (command && !sandbox.subprocessPolicy.allowedCommands.includes(command)) {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.TOOL_PROCESS_BOUNDARY_VIOLATION,
        "subprocess command is outside the declared allowlist",
        "requestedCommand",
        sandbox.subprocessPolicy.allowedCommands,
        command,
      ),
    );
  }
  return violations;
}

export function validateExecutionSovereignty(
  input: ZoneAdmissionRequest,
): readonly IsolationViolation[] {
  const violations: IsolationViolation[] = [];
  if (input.selfRegistrationAttempted) {
    violations.push(violation(ISOLATION_FAILURE_CODES.TOOL_SELF_REGISTRATION_FORBIDDEN, "tool self-registration is forbidden", "selfRegistrationAttempted"));
  }
  if (input.registryMutationAttempted) {
    violations.push(violation(ISOLATION_FAILURE_CODES.TOOL_REGISTRY_MUTATION_FORBIDDEN, "registry mutation is forbidden", "registryMutationAttempted"));
  }
  if (input.governanceBypassAttempted) {
    violations.push(violation(ISOLATION_FAILURE_CODES.TOOL_GOVERNANCE_BYPASS_ATTEMPT, "governance bypass is forbidden", "governanceBypassAttempted"));
  }
  if (input.privilegeEscalationAttempted) {
    violations.push(violation(ISOLATION_FAILURE_CODES.TOOL_PRIVILEGE_ESCALATION_ATTEMPT, "privilege escalation is forbidden", "privilegeEscalationAttempted"));
  }
  return violations;
}

export function validateRuntimeAuthorityIsolation(input: ZoneAdmissionRequest): readonly IsolationViolation[] {
  const violations: IsolationViolation[] = [];
  if (input.authorityInheritanceAttempted) {
    violations.push(violation(ISOLATION_FAILURE_CODES.AUTHORITY_INHERITANCE_FORBIDDEN, "runtime authority inheritance is forbidden", "authorityInheritanceAttempted"));
  }
  if (input.runtimePolicyMutationAttempted) {
    violations.push(violation(ISOLATION_FAILURE_CODES.TOOL_RUNTIME_POLICY_MUTATION, "runtime isolation policy mutation is forbidden", "runtimePolicyMutationAttempted"));
  }
  return violations;
}

export function validateAgentSovereignty(
  input: ZoneAdmissionRequest,
  profile: ZoneAuthorityProfile,
): readonly IsolationViolation[] {
  const violations: IsolationViolation[] = [];
  const autonomous = profile.capabilities.includes("autonomous");
  if (!autonomous) {
    return violations;
  }
  if (input.peerSharedMemory || input.peerSharedCredentials || input.autonomousPeerAccess) {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.SOVEREIGNTY_BOUNDARY_VIOLATION,
        "autonomous tools may not share unrestricted peer memory, credentials, or supervisory access",
        "autonomousPeerAccess",
      ),
    );
  }
  return violations;
}

export function validateTenantIsolation(
  input: ZoneAdmissionRequest,
): readonly IsolationViolation[] {
  if (!input.targetTenantId || input.targetTenantId === input.tenantId) {
    return [];
  }
  return [
    violation(
      ISOLATION_FAILURE_CODES.SOVEREIGNTY_BOUNDARY_VIOLATION,
      "cross-tenant execution is forbidden",
      "targetTenantId",
      input.tenantId,
      input.targetTenantId,
    ),
  ];
}

export function restoreReplayIsolation(
  input: ZoneAdmissionRequest,
  artifacts: IsolationEvaluationArtifacts,
): readonly IsolationViolation[] {
  if (!input.replayRequest) {
    return [];
  }

  const failures: IsolationViolation[] = [];
  if (input.replayRequest.originalZoneAuthorityHash !== artifacts.profile.zoneAuthorityHash) {
    failures.push(violation(ISOLATION_FAILURE_CODES.DYNAMIC_TRUST_ESCALATION_FORBIDDEN, "replay zone authority hash does not match historical isolation authority", "replayRequest.originalZoneAuthorityHash", artifacts.profile.zoneAuthorityHash, input.replayRequest.originalZoneAuthorityHash));
  }
  if (input.replayRequest.originalSandboxHash !== artifacts.sandbox.sandboxHash) {
    failures.push(violation(ISOLATION_FAILURE_CODES.DYNAMIC_TRUST_ESCALATION_FORBIDDEN, "replay sandbox hash does not match historical isolation sandbox", "replayRequest.originalSandboxHash", artifacts.sandbox.sandboxHash, input.replayRequest.originalSandboxHash));
  }
  if (input.replayRequest.originalFilesystemPolicyHash !== artifacts.filesystemPolicy.policyHash) {
    failures.push(violation(ISOLATION_FAILURE_CODES.TOOL_FILESYSTEM_BOUNDARY_VIOLATION, "replay filesystem policy differs from historical isolation policy", "replayRequest.originalFilesystemPolicyHash", artifacts.filesystemPolicy.policyHash, input.replayRequest.originalFilesystemPolicyHash));
  }
  if (input.replayRequest.originalNetworkPolicyHash !== artifacts.networkPolicy.policyHash) {
    failures.push(violation(ISOLATION_FAILURE_CODES.TOOL_NETWORK_POLICY_VIOLATION, "replay network policy differs from historical isolation policy", "replayRequest.originalNetworkPolicyHash", artifacts.networkPolicy.policyHash, input.replayRequest.originalNetworkPolicyHash));
  }
  if (input.replayRequest.originalCredentialScopeHash !== artifacts.credentialScope.scopeHash) {
    failures.push(violation(ISOLATION_FAILURE_CODES.TOOL_CREDENTIAL_SCOPE_VIOLATION, "replay credential scope differs from historical isolation policy", "replayRequest.originalCredentialScopeHash", artifacts.credentialScope.scopeHash, input.replayRequest.originalCredentialScopeHash));
  }
  if (input.replayRequest.originalGovernanceHash !== input.binding.governanceHash) {
    failures.push(violation(ISOLATION_FAILURE_CODES.ZONE_PROVENANCE_INVALID, "replay governance hash differs from the historical governance state", "replayRequest.originalGovernanceHash", input.binding.governanceHash, input.replayRequest.originalGovernanceHash));
  }
  return failures;
}

export function buildIsolationArtifacts(input: ZoneAdmissionRequest): {
  artifacts?: IsolationEvaluationArtifacts;
  violations: readonly IsolationViolation[];
} {
  const entry = getEntryFromSnapshot(input);
  if (!entry) {
    return {
      violations: [
        violation(
          ISOLATION_FAILURE_CODES.ZONE_PROVENANCE_INVALID,
          "trusted snapshot does not contain the requested immutable tool binding",
          "snapshot.content.tools",
        ),
      ],
    };
  }

  const profile = buildZoneAuthorityProfile(entry);
  const filesystemPolicy = buildFilesystemBoundaryPolicy(entry);
  const networkPolicy = buildNetworkBoundaryPolicy(entry);
  const credentialScope = buildCredentialScopePolicy(entry);
  const sandbox = buildSandboxRuntimeProfile(entry, profile, filesystemPolicy, networkPolicy, credentialScope);
  const sandboxAttestation = buildSandboxAttestation(sandbox);
  const auditEvidence = buildIsolationAuditEvidence(input, profile, filesystemPolicy, networkPolicy, credentialScope, sandbox);
  const provenance = buildIsolationProvenance(input, profile, sandboxAttestation);

  return {
    artifacts: {
      entry,
      profile,
      filesystemPolicy,
      networkPolicy,
      credentialScope,
      sandbox,
      sandboxAttestation,
      auditEvidence,
      provenance,
    },
    violations: [],
  };
}

export function admitZoneExecution(input: ZoneAdmissionRequest): ZoneAdmissionResult {
  const violations: IsolationViolation[] = [];
  if (!input.trustedSnapshotAdmission.ok) {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.ZONE_UNTRUSTED_RUNTIME_ADMISSION,
        "zone admission requires a trusted registry snapshot admission from 4.3J",
        "trustedSnapshotAdmission",
      ),
    );
  }

  if (!input.runtimeValidation.allowed || input.runtimeValidation.trustState !== "certified") {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.ZONE_UNTRUSTED_RUNTIME_ADMISSION,
        "runtime validation must be certified before isolation admission",
        "runtimeValidation.trustState",
        "certified",
        input.runtimeValidation.trustState,
      ),
    );
  }

  const built = buildIsolationArtifacts(input);
  violations.push(...built.violations);
  if (!built.artifacts) {
    return {
      allowed: false,
      violations,
      decisionHash: hashStableContent("EVIDENCE_BUNDLE", { violations }),
    };
  }

  const { profile, filesystemPolicy, networkPolicy, credentialScope, sandbox, sandboxAttestation, auditEvidence, provenance } = built.artifacts;

  if (input.requestedZone && input.requestedZone !== profile.trustZone) {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.ZONE_ESCALATION_ATTEMPT,
        "requested trust zone does not match the immutable derived tool trust zone",
        "requestedZone",
        profile.trustZone,
        input.requestedZone,
      ),
    );
  }

  if (profile.trustZone === "governance" && !profile.capabilities.includes("governance")) {
    violations.push(violation(ISOLATION_FAILURE_CODES.TOOL_GOVERNANCE_BYPASS_ATTEMPT, "governance zone requires explicit governance capability", "profile.capabilities"));
  }

  if (input.trustedSnapshotAdmission.ok && input.trustedSnapshotAdmission.provenance.promotionStage === "production" && input.requestedZone === "simulation") {
    violations.push(
      violation(
        ISOLATION_FAILURE_CODES.ZONE_PROMOTION_STAGE_FORBIDDEN,
        "production-trusted registry snapshots may not be admitted into simulation as a downgraded sovereign zone",
        "trustedSnapshotAdmission.provenance.promotionStage",
      ),
    );
  }

  violations.push(...validateCrossZoneAccess(input, profile));
  violations.push(...validateFilesystemBoundary(input.requestedFilesystemPath, filesystemPolicy));
  violations.push(...validateNetworkBoundary(input.requestedDomain, networkPolicy));
  violations.push(...validateCredentialScope(input.requestedCredential, credentialScope));
  violations.push(...validateProcessBoundary(input.requestedCommand, input.hiddenSubprocess, sandbox));
  violations.push(...validateExecutionSovereignty(input));
  violations.push(...validateRuntimeAuthorityIsolation(input));
  violations.push(...validateAgentSovereignty(input, profile));
  violations.push(...validateTenantIsolation(input));
  violations.push(...restoreReplayIsolation(input, built.artifacts));

  const allowed = violations.length === 0;
  return {
    allowed,
    profile,
    filesystemPolicy,
    networkPolicy,
    credentialScope,
    sandbox,
    sandboxAttestation,
    auditEvidence,
    provenance,
    violations,
    decisionHash: hashStableContent("EVIDENCE_BUNDLE", {
      allowed,
      profile,
      filesystemPolicyHash: filesystemPolicy.policyHash,
      networkPolicyHash: networkPolicy.policyHash,
      credentialScopeHash: credentialScope.scopeHash,
      sandboxHash: sandbox.sandboxHash,
      attestationHash: sandboxAttestation.attestationHash,
      auditHash: auditEvidence.auditHash,
      provenanceHash: provenance.provenanceHash,
      violations,
    }),
  };
}
