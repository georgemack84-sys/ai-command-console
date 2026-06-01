import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type OperationalGovernanceIntegrationStatus =
  | "INTEGRATED"
  | "PARTIALLY_INTEGRATED"
  | "DISPUTED_INTEGRATION"
  | "FAILED_INTEGRATION";

export type OperationalGovernanceVisibilityState = Readonly<{
  source: string;
  status: string;
  hash?: string | null;
  present: boolean;
  required: boolean;
}>;

export type OperationalGovernanceReplayReadiness = Readonly<{
  replayable: boolean;
  sealLineageVisible: boolean;
  verificationLineageVisible: boolean;
  certificationLineageVisible: boolean;
  artifactContinuityVisible: boolean;
}>;

export type OperationalGovernanceIntegrationInput = Readonly<{
  governanceStates: readonly OperationalGovernanceVisibilityState[];
  certificationStates: readonly OperationalGovernanceVisibilityState[];
  sustainabilityStates: readonly OperationalGovernanceVisibilityState[];
  maintenanceStates: readonly OperationalGovernanceVisibilityState[];
  replayReadiness: OperationalGovernanceReplayReadiness;
  reasons?: readonly string[];
  evidence?: unknown;
}>;

export type OperationalGovernanceIntegration = Readonly<{
  integrationStatus: OperationalGovernanceIntegrationStatus;
  integrationHash: string;
  governanceStates: readonly OperationalGovernanceVisibilityState[];
  certificationStates: readonly OperationalGovernanceVisibilityState[];
  sustainabilityStates: readonly OperationalGovernanceVisibilityState[];
  maintenanceStates: readonly OperationalGovernanceVisibilityState[];
  replayReadiness: OperationalGovernanceReplayReadiness;
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

function normalizeStates(states: readonly OperationalGovernanceVisibilityState[]) {
  return Object.freeze([...states]
    .map((state) => Object.freeze({
      source: state.source,
      status: state.status,
      hash: state.hash ?? null,
      present: state.present,
      required: state.required,
    }))
    .sort((left, right) => left.source.localeCompare(right.source)));
}

function scanAuthorityLeaks(value: unknown, path = "operationalGovernanceEvidence"): string[] {
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

function stateReasons(category: string, states: readonly OperationalGovernanceVisibilityState[]) {
  return states.flatMap((state) => {
    const reasons: string[] = [];
    if (state.required && !state.present) reasons.push(`REQUIRED_${category}_STATE_MISSING:${state.source}`);
    if (!state.required && !state.present) reasons.push(`OPTIONAL_${category}_STATE_MISSING:${state.source}`);
    if (state.present && state.required && !state.status) reasons.push(`REQUIRED_${category}_STATUS_MISSING:${state.source}`);
    return reasons;
  });
}

function replayReasons(replayReadiness: OperationalGovernanceReplayReadiness) {
  const reasons: string[] = [];
  if (!replayReadiness.replayable) reasons.push("REPLAY_VISIBILITY_GAP:replayable");
  if (!replayReadiness.sealLineageVisible) reasons.push("REPLAY_VISIBILITY_GAP:sealLineageVisible");
  if (!replayReadiness.verificationLineageVisible) reasons.push("REPLAY_VISIBILITY_GAP:verificationLineageVisible");
  if (!replayReadiness.certificationLineageVisible) reasons.push("REPLAY_VISIBILITY_GAP:certificationLineageVisible");
  if (!replayReadiness.artifactContinuityVisible) reasons.push("REPLAY_VISIBILITY_GAP:artifactContinuityVisible");
  return reasons;
}

function statusFor(reasons: readonly string[]) {
  if (reasons.some((reason) => (
    reason.startsWith("REQUIRED_GOVERNANCE_STATE_MISSING:")
    || reason.startsWith("REQUIRED_CERTIFICATION_STATE_MISSING:")
    || reason.startsWith("REQUIRED_SUSTAINABILITY_STATE_MISSING:")
    || reason.startsWith("REQUIRED_MAINTENANCE_STATE_MISSING:")
    || reason.startsWith("REQUIRED_GOVERNANCE_STATUS_MISSING:")
    || reason.startsWith("REQUIRED_CERTIFICATION_STATUS_MISSING:")
    || reason.startsWith("REQUIRED_SUSTAINABILITY_STATUS_MISSING:")
    || reason.startsWith("REQUIRED_MAINTENANCE_STATUS_MISSING:")
  ))) {
    return "FAILED_INTEGRATION" as const;
  }
  if (reasons.some((reason) => (
    reason.startsWith("CONTROL_AUTHORITY_LEAK:")
    || reason.startsWith("TRUSTED_STATE_LEAK:")
    || reason.startsWith("LIVE_IMPORT_LEAK:")
  ))) {
    return "DISPUTED_INTEGRATION" as const;
  }
  if (reasons.some((reason) => (
    reason.startsWith("OPTIONAL_")
    || reason.startsWith("REPLAY_VISIBILITY_GAP:")
  ))) {
    return "PARTIALLY_INTEGRATED" as const;
  }
  return "INTEGRATED" as const;
}

function hashMaterial(input: {
  integrationStatus: OperationalGovernanceIntegrationStatus;
  governanceStates: readonly OperationalGovernanceVisibilityState[];
  certificationStates: readonly OperationalGovernanceVisibilityState[];
  sustainabilityStates: readonly OperationalGovernanceVisibilityState[];
  maintenanceStates: readonly OperationalGovernanceVisibilityState[];
  replayReadiness: OperationalGovernanceReplayReadiness;
  reasons: readonly string[];
}) {
  return {
    integrationStatus: input.integrationStatus,
    governanceStates: input.governanceStates,
    certificationStates: input.certificationStates,
    sustainabilityStates: input.sustainabilityStates,
    maintenanceStates: input.maintenanceStates,
    replayReadiness: input.replayReadiness,
    ...SAFE_AUTHORITY,
    reasons: input.reasons,
  };
}

export function integrateOperationalGovernanceVisibility(
  input: OperationalGovernanceIntegrationInput,
): OperationalGovernanceIntegration {
  const governanceStates = normalizeStates(input.governanceStates);
  const certificationStates = normalizeStates(input.certificationStates);
  const sustainabilityStates = normalizeStates(input.sustainabilityStates);
  const maintenanceStates = normalizeStates(input.maintenanceStates);
  const replayReadiness = Object.freeze({ ...input.replayReadiness });
  const reasons = normalizeReasons([
    ...stateReasons("GOVERNANCE", governanceStates),
    ...stateReasons("CERTIFICATION", certificationStates),
    ...stateReasons("SUSTAINABILITY", sustainabilityStates),
    ...stateReasons("MAINTENANCE", maintenanceStates),
    ...replayReasons(replayReadiness),
    ...scanAuthorityLeaks(input.evidence),
    ...(input.reasons || []),
  ]);
  const integrationStatus = statusFor(reasons);
  const integrationHash = sha256(hashMaterial({
    integrationStatus,
    governanceStates,
    certificationStates,
    sustainabilityStates,
    maintenanceStates,
    replayReadiness,
    reasons,
  }));

  return Object.freeze({
    integrationStatus,
    integrationHash,
    governanceStates,
    certificationStates,
    sustainabilityStates,
    maintenanceStates,
    replayReadiness,
    ...SAFE_AUTHORITY,
    reasons,
  });
}
