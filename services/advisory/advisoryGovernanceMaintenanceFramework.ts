import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type GovernanceMaintenanceStatus =
  | "MAINTENANCE_READY"
  | "MAINTENANCE_CONDITIONAL"
  | "MAINTENANCE_DISPUTED"
  | "MAINTENANCE_FAILED";

export type SealMaintenancePolicy = Readonly<{
  sealVerificationRequired: boolean;
  regressionVerificationRequired: boolean;
  dependencyValidationRequired: boolean;
  driftDetectionGuidanceOnly: boolean;
}>;

export type DocumentationMaintenancePolicy = Readonly<{
  reviewCadenceGuidance: boolean;
  coverageExpectations: boolean;
  linkValidationExpectations: boolean;
  sealReferenceValidation: boolean;
}>;

export type AdrMaintenancePolicy = Readonly<{
  appendOnly: boolean;
  supersedeInsteadOfEdit: boolean;
  preserveRationale: boolean;
  preserveLineage: boolean;
}>;

export type RegressionMaintenancePolicy = Readonly<{
  requiredRegressionBundles: boolean;
  sealBlockingRegressions: boolean;
  validationRequirements: boolean;
  buildExpectations: boolean;
}>;

export type ArtifactDeprecationPolicy = Readonly<{
  neverDeleteSealedArtifacts: boolean;
  markDeprecated: boolean;
  retainLineage: boolean;
  retainReferences: boolean;
}>;

export type AuditCadencePolicy = Readonly<{
  documentationOnly: boolean;
  optionalGuidance: boolean;
  nonRuntime: boolean;
  nonEnforced: boolean;
}>;

export type GovernanceMaintenanceTrack = Readonly<{
  track: string;
  optional: boolean;
  authoritative: boolean;
  runtime: boolean;
  present?: boolean;
}>;

export type GovernanceMaintenanceFrameworkInput = Readonly<{
  generatedAt?: string;
  sealMaintenancePolicy: SealMaintenancePolicy;
  documentationMaintenancePolicy: DocumentationMaintenancePolicy;
  adrMaintenancePolicy: AdrMaintenancePolicy;
  regressionMaintenancePolicy: RegressionMaintenancePolicy;
  artifactDeprecationPolicy: ArtifactDeprecationPolicy;
  auditCadencePolicy: AuditCadencePolicy;
  maintenanceTracks: readonly GovernanceMaintenanceTrack[];
  reasons?: readonly string[];
  evidence?: unknown;
}>;

export type GovernanceMaintenanceFramework = Readonly<{
  maintenanceStatus: GovernanceMaintenanceStatus;
  maintenanceHash: string;
  generatedAt: string;
  sealMaintenancePolicy: SealMaintenancePolicy;
  documentationMaintenancePolicy: DocumentationMaintenancePolicy;
  adrMaintenancePolicy: AdrMaintenancePolicy;
  regressionMaintenancePolicy: RegressionMaintenancePolicy;
  artifactDeprecationPolicy: ArtifactDeprecationPolicy;
  auditCadencePolicy: AuditCadencePolicy;
  maintenanceTracks: readonly GovernanceMaintenanceTrack[];
  authority: "READ_ONLY";
  trusted: false;
  importedToLiveState: false;
  mayDeploy: false;
  mayRetry: false;
  mayRollback: false;
  mayCancel: false;
  mayResume: false;
  mayApprove: false;
  mayOverride: false;
  mayDelete: false;
  mayCompact: false;
  mayArchiveMutate: false;
  mayImportToLiveState: false;
  reasons: readonly string[];
}>;

export const RECOMMENDED_GOVERNANCE_MAINTENANCE_FRAMEWORK_TRACKS = Object.freeze([
  { track: "Documentation maintenance", optional: true, authoritative: false, runtime: false },
  { track: "ADR maintenance", optional: true, authoritative: false, runtime: false },
  { track: "Seal maintenance", optional: true, authoritative: false, runtime: false },
  { track: "Regression maintenance", optional: true, authoritative: false, runtime: false },
  { track: "Governance audit cadence", optional: true, authoritative: false, runtime: false },
  { track: "Operator handbook maintenance", optional: true, authoritative: false, runtime: false },
] as const);

const SAFE_AUTHORITY = Object.freeze({
  authority: "READ_ONLY" as const,
  trusted: false as const,
  importedToLiveState: false as const,
  mayDeploy: false as const,
  mayRetry: false as const,
  mayRollback: false as const,
  mayCancel: false as const,
  mayResume: false as const,
  mayApprove: false as const,
  mayOverride: false as const,
  mayDelete: false as const,
  mayCompact: false as const,
  mayArchiveMutate: false as const,
  mayImportToLiveState: false as const,
});

const CONTROL_FIELDS = [
  "mayDeploy",
  "mayRetry",
  "mayRollback",
  "mayCancel",
  "mayResume",
  "mayApprove",
  "mayOverride",
  "mayDelete",
  "mayCompact",
  "mayArchiveMutate",
  "mayImportToLiveState",
  "mayMutateArchive",
  "mayTriggerWorkflow",
] as const;

function sha256(value: unknown) {
  return `sha256:${hashPayloadDeterministically(value)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeReasons(reasons: readonly string[]) {
  return Object.freeze([...new Set(reasons)].sort());
}

function normalizeTracks(tracks: readonly GovernanceMaintenanceTrack[]) {
  return Object.freeze([...tracks]
    .map((track) => Object.freeze({
      track: track.track,
      optional: track.optional,
      authoritative: track.authoritative,
      runtime: track.runtime,
      present: track.present ?? true,
    }))
    .sort((left, right) => left.track.localeCompare(right.track)));
}

function scanAuthorityLeaks(value: unknown, path = "governanceMaintenanceEvidence"): string[] {
  const reasons: string[] = [];
  if (Array.isArray(value)) {
    value.forEach((entry, index) => reasons.push(...scanAuthorityLeaks(entry, `${path}[${index}]`)));
    return reasons;
  }
  if (!isRecord(value)) return reasons;

  if (value.trusted === true) reasons.push(`TRUSTED_STATE_LEAK:${path}.trusted`);
  if (value.importedToLiveState === true) reasons.push(`LIVE_IMPORT_LEAK:${path}.importedToLiveState`);

  for (const field of CONTROL_FIELDS) {
    if (value[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${path}.${field}`);
  }

  for (const [key, entry] of Object.entries(value)) {
    reasons.push(...scanAuthorityLeaks(entry, `${path}.${key}`));
  }
  return reasons;
}

function policyReasons(policyName: string, policy: Record<string, boolean>) {
  const reasons: string[] = [];
  for (const [key, value] of Object.entries(policy)) {
    if (!value) reasons.push(`REQUIRED_POLICY_MISSING:${policyName}.${key}`);
  }
  return reasons;
}

function maintenanceTrackReasons(tracks: readonly GovernanceMaintenanceTrack[]) {
  return tracks.flatMap((track) => {
    const reasons: string[] = [];
    if (track.optional && track.present === false) reasons.push(`OPTIONAL_MAINTENANCE_TRACK_PENDING:${track.track}`);
    if (track.authoritative) reasons.push(`MAINTENANCE_TRACK_AUTHORITY_LEAK:${track.track}`);
    if (track.runtime) reasons.push(`MAINTENANCE_TRACK_RUNTIME_LEAK:${track.track}`);
    return reasons;
  });
}

function statusFor(reasons: readonly string[]) {
  if (reasons.some((reason) => reason.startsWith("REQUIRED_POLICY_MISSING:"))) {
    return "MAINTENANCE_FAILED" as const;
  }
  if (reasons.some((reason) => (
    reason.startsWith("CONTROL_AUTHORITY_LEAK:")
    || reason.startsWith("TRUSTED_STATE_LEAK:")
    || reason.startsWith("LIVE_IMPORT_LEAK:")
    || reason.startsWith("MAINTENANCE_TRACK_AUTHORITY_LEAK:")
    || reason.startsWith("MAINTENANCE_TRACK_RUNTIME_LEAK:")
  ))) {
    return "MAINTENANCE_DISPUTED" as const;
  }
  if (reasons.some((reason) => reason.startsWith("OPTIONAL_MAINTENANCE_TRACK_PENDING:"))) {
    return "MAINTENANCE_CONDITIONAL" as const;
  }
  return "MAINTENANCE_READY" as const;
}

function hashMaterial(input: {
  maintenanceStatus: GovernanceMaintenanceStatus;
  sealMaintenancePolicy: SealMaintenancePolicy;
  documentationMaintenancePolicy: DocumentationMaintenancePolicy;
  adrMaintenancePolicy: AdrMaintenancePolicy;
  regressionMaintenancePolicy: RegressionMaintenancePolicy;
  artifactDeprecationPolicy: ArtifactDeprecationPolicy;
  auditCadencePolicy: AuditCadencePolicy;
  maintenanceTracks: readonly GovernanceMaintenanceTrack[];
  reasons: readonly string[];
}) {
  return {
    maintenanceStatus: input.maintenanceStatus,
    sealMaintenancePolicy: input.sealMaintenancePolicy,
    documentationMaintenancePolicy: input.documentationMaintenancePolicy,
    adrMaintenancePolicy: input.adrMaintenancePolicy,
    regressionMaintenancePolicy: input.regressionMaintenancePolicy,
    artifactDeprecationPolicy: input.artifactDeprecationPolicy,
    auditCadencePolicy: input.auditCadencePolicy,
    maintenanceTracks: input.maintenanceTracks,
    ...SAFE_AUTHORITY,
    reasons: input.reasons,
  };
}

export function buildGovernanceMaintenanceFramework(
  input: GovernanceMaintenanceFrameworkInput,
): GovernanceMaintenanceFramework {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const sealMaintenancePolicy = Object.freeze({ ...input.sealMaintenancePolicy });
  const documentationMaintenancePolicy = Object.freeze({ ...input.documentationMaintenancePolicy });
  const adrMaintenancePolicy = Object.freeze({ ...input.adrMaintenancePolicy });
  const regressionMaintenancePolicy = Object.freeze({ ...input.regressionMaintenancePolicy });
  const artifactDeprecationPolicy = Object.freeze({ ...input.artifactDeprecationPolicy });
  const auditCadencePolicy = Object.freeze({ ...input.auditCadencePolicy });
  const maintenanceTracks = normalizeTracks(input.maintenanceTracks);
  const reasons = normalizeReasons([
    ...policyReasons("sealMaintenancePolicy", sealMaintenancePolicy),
    ...policyReasons("documentationMaintenancePolicy", documentationMaintenancePolicy),
    ...policyReasons("adrMaintenancePolicy", adrMaintenancePolicy),
    ...policyReasons("regressionMaintenancePolicy", regressionMaintenancePolicy),
    ...policyReasons("artifactDeprecationPolicy", artifactDeprecationPolicy),
    ...policyReasons("auditCadencePolicy", auditCadencePolicy),
    ...maintenanceTrackReasons(maintenanceTracks),
    ...scanAuthorityLeaks(input.evidence),
    ...(input.reasons || []),
  ]);
  const maintenanceStatus = statusFor(reasons);
  const maintenanceHash = sha256(hashMaterial({
    maintenanceStatus,
    sealMaintenancePolicy,
    documentationMaintenancePolicy,
    adrMaintenancePolicy,
    regressionMaintenancePolicy,
    artifactDeprecationPolicy,
    auditCadencePolicy,
    maintenanceTracks,
    reasons,
  }));

  return Object.freeze({
    maintenanceStatus,
    maintenanceHash,
    generatedAt,
    sealMaintenancePolicy,
    documentationMaintenancePolicy,
    adrMaintenancePolicy,
    regressionMaintenancePolicy,
    artifactDeprecationPolicy,
    auditCadencePolicy,
    maintenanceTracks,
    ...SAFE_AUTHORITY,
    reasons,
  });
}
