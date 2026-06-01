import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type CompletionBundleVerificationStatus =
  | "VALID_COMPLETION_BUNDLE"
  | "DISPUTED_COMPLETION_BUNDLE"
  | "FAILED_COMPLETION_BUNDLE";

export type CompletionBundleVerificationResult = Readonly<{
  verificationStatus: CompletionBundleVerificationStatus;
  exportId: string | null;
  exportHash: string | null;
  expectedExportHash: string | null;
  expectedExportId: string | null;
  hashMatches: boolean;
  idMatches: boolean;
  policyVersion: string | null;
  completionSummaryVerified: boolean;
  certificationSummaryVerified: boolean;
  sealedCommitsVerified: boolean;
  guaranteesVerified: boolean;
  replayable: boolean;
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

export type VerifyAdvisoryEvidenceLifecycleCompletionBundleInput = Readonly<{
  bundle?: unknown;
}>;

const EXPORT_POLICY_VERSION = "advisory-evidence-lifecycle-completion-export/v1";

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

const GUARANTEE_FIELDS = [
  "deterministic",
  "readOnly",
  "replayable",
  "operatorVisible",
  "authorityContained",
  "nonAuthoritative",
  "nonMutating",
  "trustedStateAbsent",
  "liveImportAbsent",
  "workflowControlAbsent",
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

function stringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0);
}

function requiredFieldReasons(bundle: Record<string, unknown> | null) {
  if (!bundle) return ["COMPLETION_BUNDLE_MISSING"];

  const reasons: string[] = [];
  if (!asString(bundle.exportStatus)) reasons.push("BUNDLE_FIELD_MISSING:exportStatus");
  if (!asString(bundle.exportId)) reasons.push("BUNDLE_FIELD_MISSING:exportId");
  if (!asString(bundle.exportHash)) reasons.push("BUNDLE_FIELD_MISSING:exportHash");
  if (!isRecord(bundle.completionSummary)) reasons.push("BUNDLE_FIELD_MISSING:completionSummary");
  if (!isRecord(bundle.certificationSummary)) reasons.push("BUNDLE_FIELD_MISSING:certificationSummary");
  if (!Array.isArray(bundle.sealedCommits)) reasons.push("BUNDLE_FIELD_MISSING:sealedCommits");
  if (!Array.isArray(bundle.completedLifecycleStages)) reasons.push("BUNDLE_FIELD_MISSING:completedLifecycleStages");
  if (!isRecord(bundle.guarantees)) reasons.push("BUNDLE_FIELD_MISSING:guarantees");
  if (!isRecord(bundle.operatorVisibilitySummary)) reasons.push("BUNDLE_FIELD_MISSING:operatorVisibilitySummary");
  if (!Array.isArray(bundle.optionalExtensions)) reasons.push("BUNDLE_FIELD_MISSING:optionalExtensions");
  if (!asString(bundle.exportPolicyVersion)) reasons.push("BUNDLE_FIELD_MISSING:exportPolicyVersion");
  if (!Array.isArray(bundle.reasons)) reasons.push("BUNDLE_FIELD_MISSING:reasons");
  return reasons;
}

function authorityLeakReasons(bundle: Record<string, unknown> | null) {
  if (!bundle) return [];
  const reasons: string[] = [];
  if (bundle.authority !== "READ_ONLY") reasons.push("AUTHORITY_NOT_READ_ONLY");
  if (bundle.trusted === true) reasons.push("TRUSTED_STATE_LEAK:trusted");
  if (bundle.importedToLiveState === true) reasons.push("LIVE_IMPORT_LEAK:importedToLiveState");
  for (const field of CONTROL_FIELDS) {
    if (bundle[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${field}`);
  }
  return reasons;
}

function completionSummaryVerified(bundle: Record<string, unknown> | null) {
  if (!isRecord(bundle?.completionSummary)) return false;
  return Boolean(asString(bundle.completionSummary.completionStatus) && asString(bundle.completionSummary.completionHash));
}

function certificationSummaryVerified(bundle: Record<string, unknown> | null) {
  if (!isRecord(bundle?.certificationSummary)) return false;
  return Boolean(asString(bundle.certificationSummary.certificationStatus));
}

function sealedCommitsVerified(bundle: Record<string, unknown> | null) {
  if (!Array.isArray(bundle?.sealedCommits) || bundle.sealedCommits.length === 0) return false;
  return bundle.sealedCommits.every((seal) => isRecord(seal) && Boolean(asString(seal.phase)));
}

function guaranteesVerified(bundle: Record<string, unknown> | null) {
  const guarantees = bundle?.guarantees;
  if (!isRecord(guarantees)) return false;
  return GUARANTEE_FIELDS.every((field) => typeof guarantees[field] === "boolean");
}

function expectedHashMaterial(bundle: Record<string, unknown>) {
  return {
    authority: bundle.authority,
    certificationSummary: normalizeHashValue(bundle.certificationSummary),
    completedLifecycleStages: normalizeHashValue(bundle.completedLifecycleStages),
    completionSummary: normalizeHashValue(bundle.completionSummary),
    exportPolicyVersion: bundle.exportPolicyVersion,
    exportStatus: bundle.exportStatus,
    guarantees: normalizeHashValue(bundle.guarantees),
    importedToLiveState: bundle.importedToLiveState,
    mayApprove: bundle.mayApprove,
    mayArchiveMutate: bundle.mayArchiveMutate,
    mayCancel: bundle.mayCancel,
    mayCompact: bundle.mayCompact,
    mayDelete: bundle.mayDelete,
    mayDeploy: bundle.mayDeploy,
    mayImportToLiveState: bundle.mayImportToLiveState,
    mayOverride: bundle.mayOverride,
    mayResume: bundle.mayResume,
    mayRetry: bundle.mayRetry,
    mayRollback: bundle.mayRollback,
    operatorVisibilitySummary: normalizeHashValue(bundle.operatorVisibilitySummary),
    optionalExtensions: normalizeHashValue(bundle.optionalExtensions),
    reasons: normalizeReasons(stringArray(bundle.reasons)),
    sealedCommits: normalizeHashValue(bundle.sealedCommits),
    trusted: bundle.trusted,
  };
}

function hasMissingRequired(reasons: readonly string[]) {
  return reasons.some((reason) => (
    reason === "COMPLETION_BUNDLE_MISSING"
    || reason.startsWith("BUNDLE_FIELD_MISSING:")
  ));
}

function classifyVerification(reasons: readonly string[]) {
  if (hasMissingRequired(reasons)) return "FAILED_COMPLETION_BUNDLE" as const;
  if (reasons.length > 0) return "DISPUTED_COMPLETION_BUNDLE" as const;
  return "VALID_COMPLETION_BUNDLE" as const;
}

export function verifyAdvisoryEvidenceLifecycleCompletionBundle(
  input: VerifyAdvisoryEvidenceLifecycleCompletionBundleInput,
): CompletionBundleVerificationResult {
  const bundle = isRecord(input.bundle) ? input.bundle : null;
  const initialReasons = [
    ...requiredFieldReasons(bundle),
    ...authorityLeakReasons(bundle),
  ];
  const canVerifyHash = Boolean(bundle && !hasMissingRequired(initialReasons));
  const expectedExportHash = canVerifyHash ? sha256(expectedHashMaterial(bundle as Record<string, unknown>)) : null;
  const expectedExportId = expectedExportHash
    ? sha256({
      exportHash: expectedExportHash,
      exportPolicyVersion: bundle?.exportPolicyVersion,
    })
    : null;
  const exportHash = asString(bundle?.exportHash);
  const exportId = asString(bundle?.exportId);
  const policyVersion = asString(bundle?.exportPolicyVersion);
  const hashMatches = Boolean(exportHash && expectedExportHash && exportHash === expectedExportHash);
  const idMatches = Boolean(exportId && expectedExportId && exportId === expectedExportId);
  const reasons = normalizeReasons([
    ...initialReasons,
    ...(bundle && policyVersion !== EXPORT_POLICY_VERSION ? [`UNKNOWN_POLICY_VERSION:${policyVersion ?? "null"}`] : []),
    ...(canVerifyHash && !hashMatches ? ["EXPORT_HASH_MISMATCH"] : []),
    ...(canVerifyHash && !idMatches ? ["EXPORT_ID_MISMATCH"] : []),
    ...(bundle && !completionSummaryVerified(bundle) ? ["COMPLETION_SUMMARY_INVALID"] : []),
    ...(bundle && !certificationSummaryVerified(bundle) ? ["CERTIFICATION_SUMMARY_INVALID"] : []),
    ...(bundle && !sealedCommitsVerified(bundle) ? ["SEALED_COMMITS_INVALID"] : []),
    ...(bundle && !guaranteesVerified(bundle) ? ["GUARANTEES_INVALID"] : []),
  ]);
  const verificationStatus = classifyVerification(reasons);

  return Object.freeze({
    verificationStatus,
    exportId,
    exportHash,
    expectedExportHash,
    expectedExportId,
    hashMatches,
    idMatches,
    policyVersion,
    completionSummaryVerified: completionSummaryVerified(bundle),
    certificationSummaryVerified: certificationSummaryVerified(bundle),
    sealedCommitsVerified: sealedCommitsVerified(bundle),
    guaranteesVerified: guaranteesVerified(bundle),
    replayable: verificationStatus === "VALID_COMPLETION_BUNDLE",
    ...SAFE_AUTHORITY,
    reasons,
  });
}
