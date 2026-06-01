import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type {
  AdvisoryEvidenceLifecycleCertificationSummary,
  AdvisoryEvidenceLifecycleGuarantees,
  AdvisoryEvidenceLifecycleOperatorVisibilitySummary,
  AdvisoryEvidenceLifecycleOptionalExtension,
  AdvisoryEvidenceLifecycleSeal,
} from "./advisoryEvidenceLifecycleCompletionReport";

export type AdvisoryEvidenceLifecycleCompletionExportStatus =
  | "EXPORTED"
  | "DISPUTED_EXPORT"
  | "FAILED_EXPORT";

export type AdvisoryEvidenceLifecycleCompletionExportSummary = Readonly<{
  completionStatus: string;
  completionHash: string | null;
}>;

export type AdvisoryEvidenceLifecycleCompletionExportBundle = Readonly<{
  exportStatus: AdvisoryEvidenceLifecycleCompletionExportStatus;
  exportId: string;
  exportHash: string;
  generatedAt: string;
  completionSummary: AdvisoryEvidenceLifecycleCompletionExportSummary;
  certificationSummary: AdvisoryEvidenceLifecycleCertificationSummary;
  sealedCommits: readonly AdvisoryEvidenceLifecycleSeal[];
  completedLifecycleStages: readonly string[];
  guarantees: AdvisoryEvidenceLifecycleGuarantees;
  operatorVisibilitySummary: AdvisoryEvidenceLifecycleOperatorVisibilitySummary;
  optionalExtensions: readonly AdvisoryEvidenceLifecycleOptionalExtension[];
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
  exportPolicyVersion: "advisory-evidence-lifecycle-completion-export/v1";
  reasons: readonly string[];
}>;

export type BuildAdvisoryEvidenceLifecycleCompletionExportBundleInput = Readonly<{
  completionReport?: unknown;
  generatedAt?: string;
  reasons?: readonly string[];
}>;

const EXPORT_POLICY_VERSION = "advisory-evidence-lifecycle-completion-export/v1" as const;

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

function normalizeHashValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    const normalized = value.map((entry) => normalizeHashValue(entry));
    if (normalized.every((entry) => typeof entry === "string")) {
      return Object.freeze([...new Set(normalized as string[])].sort());
    }
    return Object.freeze([...normalized].sort((left, right) => (
      hashPayloadDeterministically(left).localeCompare(hashPayloadDeterministically(right))
    )));
  }

  if (!isRecord(value)) return value;

  return Object.freeze(Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key !== "generatedAt")
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, normalizeHashValue(entry)]),
  ));
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function normalizeSeal(value: unknown): AdvisoryEvidenceLifecycleSeal | null {
  if (!isRecord(value) || typeof value.phase !== "string") return null;
  return Object.freeze({
    phase: value.phase,
    commit: typeof value.commit === "string" ? value.commit : null,
    required: value.required === true,
    present: value.present === true,
  });
}

function normalizeSeals(value: unknown) {
  if (!Array.isArray(value)) return Object.freeze([]) as readonly AdvisoryEvidenceLifecycleSeal[];
  return Object.freeze(value
    .map(normalizeSeal)
    .filter((seal): seal is AdvisoryEvidenceLifecycleSeal => Boolean(seal))
    .sort((left, right) => left.phase.localeCompare(right.phase)));
}

function normalizeStages(value: unknown) {
  return Object.freeze([...new Set(asStringArray(value))].sort());
}

function normalizeGuarantees(value: unknown): AdvisoryEvidenceLifecycleGuarantees {
  const record = isRecord(value) ? value : {};
  return Object.freeze({
    deterministic: record.deterministic === true,
    readOnly: record.readOnly === true,
    replayable: record.replayable === true,
    operatorVisible: record.operatorVisible === true,
    authorityContained: record.authorityContained === true,
    nonAuthoritative: record.nonAuthoritative === true,
    nonMutating: record.nonMutating === true,
    trustedStateAbsent: record.trustedStateAbsent === true,
    liveImportAbsent: record.liveImportAbsent === true,
    workflowControlAbsent: record.workflowControlAbsent === true,
  });
}

function normalizeCertificationSummary(value: unknown): AdvisoryEvidenceLifecycleCertificationSummary {
  const record = isRecord(value) ? value : {};
  return Object.freeze({
    certificationStatus: asString(record.certificationStatus) || "UNKNOWN",
    certificationHash: asString(record.certificationHash),
    certificationCommit: asString(record.certificationCommit),
    reviewUiCommit: asString(record.reviewUiCommit),
    finalSealCommit: asString(record.finalSealCommit),
  });
}

function normalizeOperatorVisibilitySummary(value: unknown): AdvisoryEvidenceLifecycleOperatorVisibilitySummary {
  const record = isRecord(value) ? value : {};
  return Object.freeze({
    dashboardAvailable: record.dashboardAvailable === true,
    reviewUiAvailable: record.reviewUiAvailable === true,
    certificationReviewUiAvailable: record.certificationReviewUiAvailable === true,
    archiveUiAvailable: record.archiveUiAvailable === true,
  });
}

function normalizeOptionalExtension(value: unknown): AdvisoryEvidenceLifecycleOptionalExtension | null {
  if (!isRecord(value) || typeof value.extension !== "string") return null;
  return Object.freeze({
    extension: value.extension,
    optional: value.optional === true,
    blocking: value.blocking === true,
    authoritative: value.authoritative === true,
    present: value.present === undefined ? undefined : value.present === true,
  });
}

function normalizeOptionalExtensions(value: unknown) {
  if (!Array.isArray(value)) return Object.freeze([]) as readonly AdvisoryEvidenceLifecycleOptionalExtension[];
  return Object.freeze(value
    .map(normalizeOptionalExtension)
    .filter((extension): extension is AdvisoryEvidenceLifecycleOptionalExtension => Boolean(extension))
    .sort((left, right) => left.extension.localeCompare(right.extension)));
}

function requiredFieldReasons(report: Record<string, unknown> | null) {
  if (!report) return ["COMPLETION_REPORT_MISSING"];

  const reasons: string[] = [];
  if (!asString(report.completionStatus)) reasons.push("COMPLETION_FIELD_MISSING:completionStatus");
  if (!asString(report.completionHash)) reasons.push("COMPLETION_FIELD_MISSING:completionHash");
  if (!Array.isArray(report.sealedCommits)) reasons.push("COMPLETION_FIELD_MISSING:sealedCommits");
  if (!Array.isArray(report.completedLifecycleStages)) reasons.push("COMPLETION_FIELD_MISSING:completedLifecycleStages");
  if (!isRecord(report.guarantees)) reasons.push("COMPLETION_FIELD_MISSING:guarantees");
  if (!isRecord(report.certificationSummary)) reasons.push("COMPLETION_FIELD_MISSING:certificationSummary");
  if (!isRecord(report.operatorVisibilitySummary)) reasons.push("COMPLETION_FIELD_MISSING:operatorVisibilitySummary");
  if (!Array.isArray(report.remainingOptionalExtensions)) reasons.push("COMPLETION_FIELD_MISSING:remainingOptionalExtensions");
  if (report.authority !== "READ_ONLY") reasons.push("AUTHORITY_NOT_READ_ONLY");
  return reasons;
}

function authorityLeakReasons(report: Record<string, unknown> | null) {
  if (!report) return [];
  const reasons: string[] = [];
  if (report.trusted === true) reasons.push("TRUSTED_STATE_LEAK:trusted");
  if (report.importedToLiveState === true) reasons.push("LIVE_IMPORT_LEAK:importedToLiveState");
  for (const field of CONTROL_FIELDS) {
    if (report[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${field}`);
  }
  return reasons;
}

function classifyExport(reasons: readonly string[]): AdvisoryEvidenceLifecycleCompletionExportStatus {
  if (reasons.some((reason) => (
    reason === "COMPLETION_REPORT_MISSING"
    || reason.startsWith("COMPLETION_FIELD_MISSING:")
  ))) {
    return "FAILED_EXPORT";
  }
  if (reasons.some((reason) => (
    reason === "AUTHORITY_NOT_READ_ONLY"
    || reason.startsWith("TRUSTED_STATE_LEAK:")
    || reason.startsWith("LIVE_IMPORT_LEAK:")
    || reason.startsWith("CONTROL_AUTHORITY_LEAK:")
  ))) {
    return "DISPUTED_EXPORT";
  }
  return "EXPORTED";
}

function buildHashMaterial(input: Omit<AdvisoryEvidenceLifecycleCompletionExportBundle, "exportId" | "exportHash" | "generatedAt">) {
  return {
    authority: input.authority,
    certificationSummary: normalizeHashValue(input.certificationSummary),
    completedLifecycleStages: input.completedLifecycleStages,
    completionSummary: normalizeHashValue(input.completionSummary),
    exportPolicyVersion: input.exportPolicyVersion,
    exportStatus: input.exportStatus,
    guarantees: normalizeHashValue(input.guarantees),
    importedToLiveState: input.importedToLiveState,
    mayApprove: input.mayApprove,
    mayArchiveMutate: input.mayArchiveMutate,
    mayCancel: input.mayCancel,
    mayCompact: input.mayCompact,
    mayDelete: input.mayDelete,
    mayDeploy: input.mayDeploy,
    mayImportToLiveState: input.mayImportToLiveState,
    mayOverride: input.mayOverride,
    mayResume: input.mayResume,
    mayRetry: input.mayRetry,
    mayRollback: input.mayRollback,
    operatorVisibilitySummary: normalizeHashValue(input.operatorVisibilitySummary),
    optionalExtensions: normalizeHashValue(input.optionalExtensions),
    reasons: input.reasons,
    sealedCommits: normalizeHashValue(input.sealedCommits),
    trusted: input.trusted,
  };
}

export function buildAdvisoryEvidenceLifecycleCompletionExportBundle(
  input: BuildAdvisoryEvidenceLifecycleCompletionExportBundleInput,
): AdvisoryEvidenceLifecycleCompletionExportBundle {
  const generatedAt = input.generatedAt || new Date().toISOString();
  const report = isRecord(input.completionReport) ? input.completionReport : null;
  const reasons = normalizeReasons([
    ...requiredFieldReasons(report),
    ...authorityLeakReasons(report),
    ...asStringArray(report?.reasons),
    ...(input.reasons || []),
  ]);
  const exportStatus = classifyExport(reasons);
  const bundleWithoutHashes = Object.freeze({
    exportStatus,
    completionSummary: Object.freeze({
      completionStatus: asString(report?.completionStatus) || "UNKNOWN",
      completionHash: asString(report?.completionHash),
    }),
    certificationSummary: normalizeCertificationSummary(report?.certificationSummary),
    sealedCommits: normalizeSeals(report?.sealedCommits),
    completedLifecycleStages: normalizeStages(report?.completedLifecycleStages),
    guarantees: normalizeGuarantees(report?.guarantees),
    operatorVisibilitySummary: normalizeOperatorVisibilitySummary(report?.operatorVisibilitySummary),
    optionalExtensions: normalizeOptionalExtensions(report?.remainingOptionalExtensions),
    ...SAFE_AUTHORITY,
    exportPolicyVersion: EXPORT_POLICY_VERSION,
    reasons,
  });
  const exportHash = sha256(buildHashMaterial(bundleWithoutHashes));
  const exportId = sha256({
    exportHash,
    exportPolicyVersion: EXPORT_POLICY_VERSION,
  });

  return Object.freeze({
    ...bundleWithoutHashes,
    exportId,
    exportHash,
    generatedAt,
  });
}
