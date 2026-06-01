import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type AdvisoryEvidenceLifecycleCertificationStatus =
  | "CERTIFIED"
  | "CONDITIONAL_CERTIFICATION"
  | "CERTIFICATION_DISPUTED"
  | "CERTIFICATION_FAILED";

export type AdvisoryEvidenceLifecyclePhaseCertification = Readonly<{
  phase: string;
  commit: string | null;
  required: boolean;
  present: boolean;
}>;

export type AdvisoryEvidenceLifecycleCertificationChecks = Readonly<{
  deterministic: boolean;
  readOnly: boolean;
  replayable: boolean;
  operatorVisible: boolean;
  authorityContained: boolean;
  trustedStateAbsent: boolean;
  liveImportAbsent: boolean;
  lifecycleActionsAbsent: boolean;
  workflowControlAbsent: boolean;
  buildClean: boolean;
}>;

export type AdvisoryEvidenceLifecycleCertificationInput = Readonly<{
  certifiedAt?: string;
  certifiedChain: readonly AdvisoryEvidenceLifecyclePhaseCertification[];
  checks: AdvisoryEvidenceLifecycleCertificationChecks;
  reasons?: readonly string[];
  evidence?: unknown;
}>;

export type AdvisoryEvidenceLifecycleCertification = Readonly<{
  certificationStatus: AdvisoryEvidenceLifecycleCertificationStatus;
  certificationHash: string;
  certifiedAt: string;
  certifiedChain: readonly AdvisoryEvidenceLifecyclePhaseCertification[];
  checks: AdvisoryEvidenceLifecycleCertificationChecks;
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

export const REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_PHASES = Object.freeze([
  { phase: "Unified Advisory Aggregation", commit: "532138e", required: true },
  { phase: "Advisory Read Model / Dashboard", commit: "ede2959", required: true },
  { phase: "Snapshot Export", commit: "0fa6b88", required: true },
  { phase: "Snapshot Verification", commit: "10a3012", required: true },
  { phase: "Offline Review", commit: "627c3f8", required: true },
  { phase: "Snapshot Review UI", commit: "f406ae4", required: true },
  { phase: "Archive Index", commit: "6496bb7", required: true },
  { phase: "Archive UI", commit: "8ff809b", required: true },
  { phase: "Archive Summary", commit: "51fe40a", required: true },
  { phase: "Archive Summary UI", commit: "a06393f", required: true },
  { phase: "Retention Policy", commit: "ee4ee86", required: true },
  { phase: "Retention Policy UI", commit: "0369700", required: true },
  { phase: "Lifecycle Rollup UI", commit: "a677389", required: true },
  { phase: "Lifecycle Export Bundle", commit: "bcbaae1", required: true },
  { phase: "Lifecycle Bundle Verification", commit: "eb9125a", required: true },
  { phase: "Lifecycle Bundle Review UI", commit: "0749f4d", required: true },
  { phase: "Lifecycle Bundle Final Seal", commit: "04a52f1", required: true },
] as const);

const SAFE_CHECKS: AdvisoryEvidenceLifecycleCertificationChecks = Object.freeze({
  deterministic: false,
  readOnly: false,
  replayable: false,
  operatorVisible: false,
  authorityContained: false,
  trustedStateAbsent: false,
  liveImportAbsent: false,
  lifecycleActionsAbsent: false,
  workflowControlAbsent: false,
  buildClean: false,
});

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

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeReasons(reasons: readonly string[]) {
  return Object.freeze([...new Set(reasons)].sort());
}

function normalizeChain(chain: readonly AdvisoryEvidenceLifecyclePhaseCertification[]) {
  return Object.freeze([...chain]
    .map((entry) => Object.freeze({
      phase: entry.phase,
      commit: entry.commit,
      required: entry.required,
      present: entry.present,
    }))
    .sort((left, right) => left.phase.localeCompare(right.phase)));
}

function defaultChain() {
  return normalizeChain(REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_PHASES.map((phase) => ({
    phase: phase.phase,
    commit: phase.commit,
    required: phase.required,
    present: false,
  })));
}

function validChecks(value: unknown): value is AdvisoryEvidenceLifecycleCertificationChecks {
  if (!isRecord(value)) return false;
  return Object.keys(SAFE_CHECKS).every((key) => typeof value[key] === "boolean");
}

function validChain(value: unknown): value is readonly AdvisoryEvidenceLifecyclePhaseCertification[] {
  return Array.isArray(value) && value.every((entry) => (
    isRecord(entry)
    && typeof entry.phase === "string"
    && (typeof entry.commit === "string" || entry.commit === null)
    && typeof entry.required === "boolean"
    && typeof entry.present === "boolean"
  ));
}

function scanAuthorityLeaks(value: unknown, path = "certificationInput"): string[] {
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

function chainReasons(chain: readonly AdvisoryEvidenceLifecyclePhaseCertification[]) {
  const reasons: string[] = [];
  const byPhase = new Map(chain.map((phase) => [phase.phase, phase]));

  for (const required of REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_PHASES) {
    const phase = byPhase.get(required.phase);
    if (!phase || !phase.present || !phase.commit) {
      reasons.push(`REQUIRED_PHASE_MISSING:${required.phase}`);
    }
  }

  for (const phase of chain) {
    if (!phase.required && !phase.present) reasons.push(`OPTIONAL_PHASE_MISSING:${phase.phase}`);
    if (phase.required && (!phase.present || !phase.commit)) reasons.push(`REQUIRED_PHASE_MISSING:${phase.phase}`);
  }

  return reasons;
}

function checkReasons(checks: AdvisoryEvidenceLifecycleCertificationChecks) {
  const reasons: string[] = [];
  if (!checks.deterministic) reasons.push("DETERMINISM_CHECK_FAILED");
  if (!checks.readOnly) reasons.push("READ_ONLY_CHECK_FAILED");
  if (!checks.replayable) reasons.push("REPLAYABILITY_CHECK_FAILED");
  if (!checks.operatorVisible) reasons.push("OPERATOR_VISIBILITY_CHECK_FAILED");
  if (!checks.authorityContained) reasons.push("AUTHORITY_CONTAINMENT_CHECK_FAILED");
  if (!checks.trustedStateAbsent) reasons.push("TRUSTED_STATE_PRESENT");
  if (!checks.liveImportAbsent) reasons.push("LIVE_IMPORT_PRESENT");
  if (!checks.lifecycleActionsAbsent) reasons.push("LIFECYCLE_ACTION_PRESENT");
  if (!checks.workflowControlAbsent) reasons.push("WORKFLOW_CONTROL_PRESENT");
  if (!checks.buildClean) reasons.push("BUILD_CLEAN_CHECK_FAILED");
  return reasons;
}

function statusFor(reasons: readonly string[]) {
  if (reasons.includes("CERTIFICATION_INPUT_MALFORMED") || reasons.some((reason) => (
    reason.startsWith("REQUIRED_PHASE_MISSING:")
    || reason === "BUILD_CLEAN_CHECK_FAILED"
  ))) {
    return "CERTIFICATION_FAILED" as const;
  }
  if (reasons.some((reason) => (
    reason.startsWith("CONTROL_AUTHORITY_LEAK:")
    || reason.startsWith("TRUSTED_STATE_LEAK:")
    || reason.startsWith("LIVE_IMPORT_LEAK:")
    || reason === "TRUSTED_STATE_PRESENT"
    || reason === "LIVE_IMPORT_PRESENT"
    || reason === "LIFECYCLE_ACTION_PRESENT"
    || reason === "WORKFLOW_CONTROL_PRESENT"
    || reason === "AUTHORITY_CONTAINMENT_CHECK_FAILED"
    || reason === "READ_ONLY_CHECK_FAILED"
    || reason === "DETERMINISM_CHECK_FAILED"
    || reason === "REPLAYABILITY_CHECK_FAILED"
    || reason === "OPERATOR_VISIBILITY_CHECK_FAILED"
  ))) {
    return "CERTIFICATION_DISPUTED" as const;
  }
  if (reasons.some((reason) => reason.startsWith("OPTIONAL_PHASE_MISSING:"))) {
    return "CONDITIONAL_CERTIFICATION" as const;
  }
  return "CERTIFIED" as const;
}

function certificationHashMaterial(input: {
  certificationStatus: AdvisoryEvidenceLifecycleCertificationStatus;
  certifiedChain: readonly AdvisoryEvidenceLifecyclePhaseCertification[];
  checks: AdvisoryEvidenceLifecycleCertificationChecks;
  reasons: readonly string[];
}) {
  return {
    certificationStatus: input.certificationStatus,
    certifiedChain: input.certifiedChain,
    checks: input.checks,
    ...SAFE_AUTHORITY,
    reasons: input.reasons,
  };
}

function buildResult(input: {
  certificationStatus: AdvisoryEvidenceLifecycleCertificationStatus;
  certifiedAt: string;
  certifiedChain: readonly AdvisoryEvidenceLifecyclePhaseCertification[];
  checks: AdvisoryEvidenceLifecycleCertificationChecks;
  reasons: readonly string[];
}): AdvisoryEvidenceLifecycleCertification {
  const reasons = normalizeReasons(input.reasons);
  const certificationHash = sha256(certificationHashMaterial({
    certificationStatus: input.certificationStatus,
    certifiedChain: input.certifiedChain,
    checks: input.checks,
    reasons,
  }));

  return Object.freeze({
    certificationStatus: input.certificationStatus,
    certificationHash,
    certifiedAt: input.certifiedAt,
    certifiedChain: input.certifiedChain,
    checks: input.checks,
    ...SAFE_AUTHORITY,
    reasons,
  });
}

export function certifyAdvisoryEvidenceLifecycle(
  input: unknown,
): AdvisoryEvidenceLifecycleCertification {
  const certifiedAt = isRecord(input) ? asString(input.certifiedAt) || new Date().toISOString() : new Date().toISOString();

  if (!isRecord(input) || !validChain(input.certifiedChain) || !validChecks(input.checks)) {
    const reasons = ["CERTIFICATION_INPUT_MALFORMED"];
    return buildResult({
      certificationStatus: "CERTIFICATION_FAILED",
      certifiedAt,
      certifiedChain: defaultChain(),
      checks: SAFE_CHECKS,
      reasons,
    });
  }

  const certifiedChain = normalizeChain(input.certifiedChain);
  const checks = Object.freeze({ ...input.checks });
  const reasons = normalizeReasons([
    ...chainReasons(certifiedChain),
    ...checkReasons(checks),
    ...scanAuthorityLeaks(input.evidence),
    ...(Array.isArray(input.reasons) ? input.reasons.filter((reason): reason is string => typeof reason === "string") : []),
  ]);
  const certificationStatus = statusFor(reasons);

  return buildResult({
    certificationStatus,
    certifiedAt,
    certifiedChain,
    checks,
    reasons,
  });
}
