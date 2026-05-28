import type { CanonicalToolRegistryEntry, RuntimeCapability } from "@/schemas/toolRegistrySchema";
import type { RegistrySnapshot } from "@/services/registry-snapshots";
import type { RegistryTrustAdmissionResult } from "@/services/registry-trust";
import type { ImmutableExecutionBinding } from "@/services/resolution-engine";
import type { RuntimeValidationResult } from "@/services/runtime-validation";
import type { GovernanceSnapshot } from "@/services/resolution-engine";

export const ISOLATION_FAILURE_CODES = {
  TOOL_SELF_REGISTRATION_FORBIDDEN: "TOOL_SELF_REGISTRATION_FORBIDDEN",
  TOOL_PRIVILEGE_ESCALATION_ATTEMPT: "TOOL_PRIVILEGE_ESCALATION_ATTEMPT",
  TOOL_GOVERNANCE_BYPASS_ATTEMPT: "TOOL_GOVERNANCE_BYPASS_ATTEMPT",
  TOOL_REGISTRY_MUTATION_FORBIDDEN: "TOOL_REGISTRY_MUTATION_FORBIDDEN",
  TOOL_NETWORK_POLICY_VIOLATION: "TOOL_NETWORK_POLICY_VIOLATION",
  TOOL_FILESYSTEM_BOUNDARY_VIOLATION: "TOOL_FILESYSTEM_BOUNDARY_VIOLATION",
  TOOL_CREDENTIAL_SCOPE_VIOLATION: "TOOL_CREDENTIAL_SCOPE_VIOLATION",
  TOOL_RUNTIME_POLICY_MUTATION: "TOOL_RUNTIME_POLICY_MUTATION",
  TOOL_PROCESS_BOUNDARY_VIOLATION: "TOOL_PROCESS_BOUNDARY_VIOLATION",
  TRUST_ZONE_CROSSING_FORBIDDEN: "TRUST_ZONE_CROSSING_FORBIDDEN",
  AUTHORITY_INHERITANCE_FORBIDDEN: "AUTHORITY_INHERITANCE_FORBIDDEN",
  ZONE_ESCALATION_ATTEMPT: "ZONE_ESCALATION_ATTEMPT",
  SOVEREIGNTY_BOUNDARY_VIOLATION: "SOVEREIGNTY_BOUNDARY_VIOLATION",
  ZONE_TRUST_SCOPE_VIOLATION: "ZONE_TRUST_SCOPE_VIOLATION",
  ZONE_PROMOTION_STAGE_FORBIDDEN: "ZONE_PROMOTION_STAGE_FORBIDDEN",
  ZONE_UNTRUSTED_RUNTIME_ADMISSION: "ZONE_UNTRUSTED_RUNTIME_ADMISSION",
  ZONE_PROVENANCE_INVALID: "ZONE_PROVENANCE_INVALID",
  DYNAMIC_TRUST_ESCALATION_FORBIDDEN: "DYNAMIC_TRUST_ESCALATION_FORBIDDEN",
} as const;

export type IsolationFailureCode =
  typeof ISOLATION_FAILURE_CODES[keyof typeof ISOLATION_FAILURE_CODES];

export type TrustZone =
  | "public"
  | "tenant"
  | "simulation"
  | "governance"
  | "recovery"
  | "autonomy"
  | "privileged"
  | "infrastructure"
  | "forensic"
  | "airgapped";

export type IsolationLevel =
  | "none"
  | "restricted"
  | "sandboxed"
  | "hardened"
  | "airgapped"
  | "forensic";

export type IsolationViolation = Readonly<{
  code: IsolationFailureCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type ZoneAuthorityProfile = Readonly<{
  toolId: string;
  version: string;
  trustZone: TrustZone;
  isolationLevel: IsolationLevel;
  capabilities: readonly RuntimeCapability[];
  crossZoneAccess: boolean;
  allowedZoneInteractions: readonly TrustZone[];
  zoneAuthorityHash: string;
}>;

export type FilesystemBoundaryPolicy = Readonly<{
  mode: "default-deny";
  allowedScopes: readonly string[];
  forbiddenPrefixes: readonly string[];
  policyHash: string;
}>;

export type NetworkBoundaryPolicy = Readonly<{
  mode: "default-deny";
  allowedDomains: readonly string[];
  allowPrivateNetworks: boolean;
  allowLocalhost: boolean;
  policyHash: string;
}>;

export type CredentialScopePolicy = Readonly<{
  temporary: true;
  revocable: true;
  rootCredentialsAllowed: false;
  governanceAuthorityTokensAllowed: false;
  orchestrationAuthorityAllowed: false;
  capabilityBoundSecrets: readonly string[];
  scopeHash: string;
}>;

export type SandboxRuntimeProfile = Readonly<{
  sandboxId: string;
  sandboxHash: string;
  runtimeConstraintsHash: string;
  zoneAuthorityHash: string;
  filesystemPolicyHash: string;
  networkPolicyHash: string;
  credentialScopeHash: string;
  subprocessPolicy: Readonly<{
    hiddenSubprocessesBlocked: boolean;
    allowedCommands: readonly string[];
  }>;
}>;

export type SandboxAttestationRecord = Readonly<{
  sandboxId: string;
  sandboxHash: string;
  runtimeConstraintsHash: string;
  zoneAuthorityHash: string;
  attestationHash: string;
}>;

export type IsolationAuditEvidence = Readonly<{
  toolId: string;
  toolVersion: string;
  trustZone: TrustZone;
  sandboxId: string;
  isolationLevel: IsolationLevel;
  filesystemPolicyHash: string;
  networkPolicyHash: string;
  credentialScopeHash: string;
  governanceHash: string;
  zoneAuthorityHash: string;
  auditHash: string;
}>;

export type IsolationProvenanceRecord = Readonly<{
  bindingHash: string;
  registrySnapshotHash: string;
  zoneAuthorityHash: string;
  attestationHash: string;
  provenanceHash: string;
}>;

export type TrustGraphEdge = Readonly<{
  from: TrustZone;
  to: TrustZone;
  requiresGovernanceApproval: boolean;
  replayCompatible: boolean;
}>;

export type ZoneAdmissionRequest = Readonly<{
  snapshot: RegistrySnapshot;
  trustedSnapshotAdmission: RegistryTrustAdmissionResult;
  binding: ImmutableExecutionBinding;
  runtimeValidation: RuntimeValidationResult;
  governance: GovernanceSnapshot;
  tenantId: string;
  sourceZone?: TrustZone;
  requestedZone?: TrustZone;
  crossZoneTarget?: TrustZone;
  requestedFilesystemPath?: string;
  requestedDomain?: string;
  requestedCredential?: string;
  requestedCommand?: string;
  hiddenSubprocess?: boolean;
  selfRegistrationAttempted?: boolean;
  registryMutationAttempted?: boolean;
  governanceBypassAttempted?: boolean;
  privilegeEscalationAttempted?: boolean;
  authorityInheritanceAttempted?: boolean;
  runtimePolicyMutationAttempted?: boolean;
  targetTenantId?: string;
  autonomousPeerAccess?: boolean;
  peerSharedMemory?: boolean;
  peerSharedCredentials?: boolean;
  replayRequest?: Readonly<{
    originalZoneAuthorityHash: string;
    originalSandboxHash: string;
    originalFilesystemPolicyHash: string;
    originalNetworkPolicyHash: string;
    originalCredentialScopeHash: string;
    originalGovernanceHash: string;
  }>;
}>;

export type ZoneAdmissionResult = Readonly<{
  allowed: boolean;
  profile?: ZoneAuthorityProfile;
  filesystemPolicy?: FilesystemBoundaryPolicy;
  networkPolicy?: NetworkBoundaryPolicy;
  credentialScope?: CredentialScopePolicy;
  sandbox?: SandboxRuntimeProfile;
  sandboxAttestation?: SandboxAttestationRecord;
  auditEvidence?: IsolationAuditEvidence;
  provenance?: IsolationProvenanceRecord;
  violations: readonly IsolationViolation[];
  decisionHash: string;
}>;

export type IsolationEvaluationArtifacts = Readonly<{
  entry: CanonicalToolRegistryEntry;
  profile: ZoneAuthorityProfile;
  filesystemPolicy: FilesystemBoundaryPolicy;
  networkPolicy: NetworkBoundaryPolicy;
  credentialScope: CredentialScopePolicy;
  sandbox: SandboxRuntimeProfile;
  sandboxAttestation: SandboxAttestationRecord;
  auditEvidence: IsolationAuditEvidence;
  provenance: IsolationProvenanceRecord;
}>;
