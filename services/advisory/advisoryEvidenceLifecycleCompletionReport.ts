import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type AdvisoryEvidenceLifecycleCompletionStatus =
  | "COMPLETE"
  | "CONDITIONALLY_COMPLETE"
  | "DISPUTED_COMPLETION"
  | "FAILED_COMPLETION";

export type AdvisoryEvidenceLifecycleSeal = Readonly<{
  phase: string;
  commit: string | null;
  required: boolean;
  present: boolean;
}>;

export type AdvisoryEvidenceLifecycleGuarantees = Readonly<{
  deterministic: boolean;
  readOnly: boolean;
  replayable: boolean;
  operatorVisible: boolean;
  authorityContained: boolean;
  nonAuthoritative: boolean;
  nonMutating: boolean;
  trustedStateAbsent: boolean;
  liveImportAbsent: boolean;
  workflowControlAbsent: boolean;
}>;

export type AdvisoryEvidenceLifecycleCertificationSummary = Readonly<{
  certificationStatus: string;
  certificationHash: string | null;
  certificationCommit: string | null;
  reviewUiCommit: string | null;
  finalSealCommit: string | null;
}>;

export type AdvisoryEvidenceLifecycleOperatorVisibilitySummary = Readonly<{
  dashboardAvailable: boolean;
  reviewUiAvailable: boolean;
  certificationReviewUiAvailable: boolean;
  archiveUiAvailable: boolean;
}>;

export type AdvisoryEvidenceLifecycleOptionalExtension = Readonly<{
  extension: string;
  optional: boolean;
  blocking: boolean;
  authoritative: boolean;
  present?: boolean;
}>;

export type AdvisoryEvidenceLifecycleCompletionReportInput = Readonly<{
  generatedAt?: string;
  sealedCommits: readonly AdvisoryEvidenceLifecycleSeal[];
  completedLifecycleStages: readonly string[];
  guarantees: AdvisoryEvidenceLifecycleGuarantees;
  certificationSummary: AdvisoryEvidenceLifecycleCertificationSummary;
  operatorVisibilitySummary: AdvisoryEvidenceLifecycleOperatorVisibilitySummary;
  remainingOptionalExtensions: readonly AdvisoryEvidenceLifecycleOptionalExtension[];
  reasons?: readonly string[];
  evidence?: unknown;
}>;

export type AdvisoryEvidenceLifecycleCompletionReport = Readonly<{
  completionStatus: AdvisoryEvidenceLifecycleCompletionStatus;
  completionHash: string;
  generatedAt: string;
  sealedCommits: readonly AdvisoryEvidenceLifecycleSeal[];
  completedLifecycleStages: readonly string[];
  guarantees: AdvisoryEvidenceLifecycleGuarantees;
  certificationSummary: AdvisoryEvidenceLifecycleCertificationSummary;
  operatorVisibilitySummary: AdvisoryEvidenceLifecycleOperatorVisibilitySummary;
  remainingOptionalExtensions: readonly AdvisoryEvidenceLifecycleOptionalExtension[];
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

export const REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_SEALS = Object.freeze([
  { phase: "Bundle Final Seal", commit: "04a52f1", required: true },
  { phase: "Certification Gate", commit: "d8d93d2", required: true },
  { phase: "Certification Review UI", commit: "bb27912", required: true },
  { phase: "Certification Final Seal", commit: "70a9d05", required: true },
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

function normalizeSeals(seals: readonly AdvisoryEvidenceLifecycleSeal[]) {
  return Object.freeze([...seals]
    .map((seal) => Object.freeze({
      phase: seal.phase,
      commit: seal.commit,
      required: seal.required,
      present: seal.present,
    }))
    .sort((left, right) => left.phase.localeCompare(right.phase)));
}

function normalizeStages(stages: readonly string[]) {
  return Object.freeze([...new Set(stages)].sort());
}

function normalizeExtensions(extensions: readonly AdvisoryEvidenceLifecycleOptionalExtension[]) {
  return Object.freeze([...extensions]
    .map((extension) => Object.freeze({
      extension: extension.extension,
      optional: extension.optional,
      blocking: extension.blocking,
      authoritative: extension.authoritative,
      present: extension.present ?? true,
    }))
    .sort((left, right) => left.extension.localeCompare(right.extension)));
}

function scanAuthorityLeaks(value: unknown, path = "completionInput"): string[] {
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

function sealReasons(sealedCommits: readonly AdvisoryEvidenceLifecycleSeal[]) {
  const reasons: string[] = [];
  const byPhase = new Map(sealedCommits.map((seal) => [seal.phase, seal]));

  for (const requiredSeal of REQUIRED_ADVISORY_EVIDENCE_LIFECYCLE_SEALS) {
    const seal = byPhase.get(requiredSeal.phase);
    if (!seal || !seal.present || !seal.commit) {
      reasons.push(`REQUIRED_SEAL_MISSING:${requiredSeal.phase}`);
    }
  }

  for (const seal of sealedCommits) {
    if (seal.required && (!seal.present || !seal.commit)) reasons.push(`REQUIRED_SEAL_MISSING:${seal.phase}`);
  }
  return reasons;
}

function guaranteeReasons(guarantees: AdvisoryEvidenceLifecycleGuarantees) {
  const reasons: string[] = [];
  for (const [key, value] of Object.entries(guarantees)) {
    if (!value) reasons.push(`GUARANTEE_MISSING:${key}`);
  }
  return reasons;
}

function optionalExtensionReasons(extensions: readonly AdvisoryEvidenceLifecycleOptionalExtension[]) {
  return extensions.flatMap((extension) => {
    const reasons: string[] = [];
    if (extension.optional && extension.present === false) reasons.push(`OPTIONAL_EXTENSION_PENDING:${extension.extension}`);
    if (extension.blocking) reasons.push(`OPTIONAL_EXTENSION_BLOCKING:${extension.extension}`);
    if (extension.authoritative) reasons.push(`OPTIONAL_EXTENSION_AUTHORITY_LEAK:${extension.extension}`);
    return reasons;
  });
}

function statusFor(reasons: readonly string[]) {
  if (reasons.some((reason) => reason.startsWith("REQUIRED_SEAL_MISSING:"))) return "FAILED_COMPLETION" as const;
  if (reasons.some((reason) => (
    reason.startsWith("CONTROL_AUTHORITY_LEAK:")
    || reason.startsWith("TRUSTED_STATE_LEAK:")
    || reason.startsWith("LIVE_IMPORT_LEAK:")
    || reason.startsWith("OPTIONAL_EXTENSION_AUTHORITY_LEAK:")
    || reason.startsWith("OPTIONAL_EXTENSION_BLOCKING:")
    || reason.startsWith("GUARANTEE_MISSING:")
  ))) {
    return "DISPUTED_COMPLETION" as const;
  }
  if (reasons.some((reason) => reason.startsWith("OPTIONAL_EXTENSION_PENDING:"))) {
    return "CONDITIONALLY_COMPLETE" as const;
  }
  return "COMPLETE" as const;
}

function hashMaterial(input: {
  completionStatus: AdvisoryEvidenceLifecycleCompletionStatus;
  sealedCommits: readonly AdvisoryEvidenceLifecycleSeal[];
  completedLifecycleStages: readonly string[];
  guarantees: AdvisoryEvidenceLifecycleGuarantees;
  certificationSummary: AdvisoryEvidenceLifecycleCertificationSummary;
  operatorVisibilitySummary: AdvisoryEvidenceLifecycleOperatorVisibilitySummary;
  remainingOptionalExtensions: readonly AdvisoryEvidenceLifecycleOptionalExtension[];
  reasons: readonly string[];
}) {
  return {
    completionStatus: input.completionStatus,
    sealedCommits: input.sealedCommits,
    completedLifecycleStages: input.completedLifecycleStages,
    guarantees: input.guarantees,
    certificationSummary: input.certificationSummary,
    operatorVisibilitySummary: input.operatorVisibilitySummary,
    remainingOptionalExtensions: input.remainingOptionalExtensions,
    ...SAFE_AUTHORITY,
    reasons: input.reasons,
  };
}

export function buildAdvisoryEvidenceLifecycleCompletionReport(
  input: AdvisoryEvidenceLifecycleCompletionReportInput,
): AdvisoryEvidenceLifecycleCompletionReport {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const sealedCommits = normalizeSeals(input.sealedCommits);
  const completedLifecycleStages = normalizeStages(input.completedLifecycleStages);
  const remainingOptionalExtensions = normalizeExtensions(input.remainingOptionalExtensions);
  const guarantees = Object.freeze({ ...input.guarantees });
  const certificationSummary = Object.freeze({ ...input.certificationSummary });
  const operatorVisibilitySummary = Object.freeze({ ...input.operatorVisibilitySummary });
  const reasons = normalizeReasons([
    ...sealReasons(sealedCommits),
    ...guaranteeReasons(guarantees),
    ...optionalExtensionReasons(remainingOptionalExtensions),
    ...scanAuthorityLeaks(input.evidence),
    ...(input.reasons || []),
  ]);
  const completionStatus = statusFor(reasons);
  const completionHash = sha256(hashMaterial({
    completionStatus,
    sealedCommits,
    completedLifecycleStages,
    guarantees,
    certificationSummary,
    operatorVisibilitySummary,
    remainingOptionalExtensions,
    reasons,
  }));

  return Object.freeze({
    completionStatus,
    completionHash,
    generatedAt,
    sealedCommits,
    completedLifecycleStages,
    guarantees,
    certificationSummary,
    operatorVisibilitySummary,
    remainingOptionalExtensions,
    ...SAFE_AUTHORITY,
    reasons,
  });
}
