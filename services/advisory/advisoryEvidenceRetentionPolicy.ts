import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type AdvisoryRetentionStatus =
  | "RETAIN"
  | "REVIEW_RETENTION"
  | "RETENTION_DISPUTED"
  | "RETENTION_FAILED";

export type AdvisoryEvidenceRetentionResult = Readonly<{
  retentionStatus: AdvisoryRetentionStatus;
  retentionHash: string;
  referenceHash: string | null;
  snapshotHash: string | null;
  retentionClass: string;
  retentionReason: readonly string[];
  source: string | null;
  policyVersion: string;
  indexedAt: string | null;
  retentionUntil: string | null;
  reviewRequired: boolean;
  evaluatedAt: string;
  authority: "READ_ONLY";
  trusted: false;
  importedToLiveState: false;
  mayDelete: false;
  mayCompact: false;
  mayArchiveMutate: false;
  mayImportToLiveState: false;
  reasons: readonly string[];
}>;

export type ClassifyAdvisoryEvidenceRetentionOptions = Readonly<{
  retentionClass?: string | null;
  retentionUntil?: string | null;
  evaluatedAt?: string;
  retentionPolicyVersion?: string;
}>;

const RETENTION_POLICY_VERSION = "advisory-evidence-retention/v1";
const KNOWN_SOURCE_POLICIES = new Set([
  "advisory-snapshot-export/v1",
  "advisory-snapshot-verification/v1",
  "advisory-snapshot-offline-review/v1",
]);
const KNOWN_RETENTION_CLASSES = new Set([
  "SHORT_TERM",
  "STANDARD",
  "LONG_TERM",
  "PERMANENT_REFERENCE",
  "REVIEW_REQUIRED",
]);
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

function asString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function normalizeReasons(reasons: readonly string[]) {
  return Object.freeze([...new Set(reasons)].sort());
}

function normalizeRetentionClass(value: unknown) {
  const retentionClass = asString(value) || "STANDARD";
  return retentionClass.toUpperCase();
}

function retentionReasonFor(retentionClass: string) {
  if (retentionClass === "REVIEW_REQUIRED") return "RETENTION_REVIEW_REQUIRED";
  if (KNOWN_RETENTION_CLASSES.has(retentionClass)) return `RETENTION_CLASS_${retentionClass}`;
  return "RETENTION_CLASS_UNKNOWN";
}

function classifyRetentionStatus(reasons: readonly string[]) {
  if (
    reasons.includes("ARCHIVE_REFERENCE_MISSING") ||
    reasons.includes("ARCHIVE_REFERENCE_MALFORMED") ||
    reasons.includes("REFERENCE_HASH_MISSING") ||
    reasons.includes("SOURCE_POLICY_VERSION_MISSING")
  ) {
    return "RETENTION_FAILED" as const;
  }
  if (
    reasons.some((reason) => (
      reason === "AUTHORITY_NOT_READ_ONLY" ||
      reason === "TRUSTED_STATE_LEAK" ||
      reason === "LIVE_IMPORT_LEAK" ||
      reason === "SOURCE_POLICY_VERSION_UNRECOGNIZED" ||
      reason === "RETENTION_CLASS_CONFLICT" ||
      reason.startsWith("CONTROL_AUTHORITY_LEAK:")
    ))
  ) {
    return "RETENTION_DISPUTED" as const;
  }
  if (
    reasons.includes("RETENTION_REVIEW_REQUIRED") ||
    reasons.includes("RETENTION_UNTIL_MISSING") ||
    reasons.includes("RETENTION_CLASS_UNKNOWN") ||
    reasons.includes("ARCHIVE_STATUS_REQUIRES_REVIEW")
  ) {
    return "REVIEW_RETENTION" as const;
  }
  return "RETAIN" as const;
}

function buildRetentionHash(input: {
  authority: "READ_ONLY";
  importedToLiveState: false;
  mayArchiveMutate: false;
  mayCompact: false;
  mayDelete: false;
  mayImportToLiveState: false;
  policyVersion: string;
  referenceHash: string | null;
  retentionClass: string;
  retentionStatus: AdvisoryRetentionStatus;
  retentionUntil: string | null;
  reviewRequired: boolean;
  snapshotHash: string | null;
  trusted: false;
}) {
  return sha256(input);
}

export function classifyAdvisoryEvidenceRetention(
  archiveReference: unknown,
  options: ClassifyAdvisoryEvidenceRetentionOptions = {},
): AdvisoryEvidenceRetentionResult {
  const reasons: string[] = [];
  const record = isRecord(archiveReference) ? { ...archiveReference } : null;
  const retentionClass = normalizeRetentionClass(options.retentionClass ?? record?.retentionClass);
  const retentionUntil = options.retentionUntil === undefined
    ? asString(record?.retentionUntil)
    : asString(options.retentionUntil);
  const policyVersion = options.retentionPolicyVersion || RETENTION_POLICY_VERSION;
  const evaluatedAt = options.evaluatedAt || new Date().toISOString();

  if (archiveReference === undefined || archiveReference === null) {
    reasons.push("ARCHIVE_REFERENCE_MISSING");
  } else if (!record) {
    reasons.push("ARCHIVE_REFERENCE_MALFORMED");
  }

  const referenceHash = asString(record?.referenceHash);
  const snapshotHash = asString(record?.snapshotHash);
  const sourcePolicyVersion = asString(record?.policyVersion);
  const source = asString(record?.source);
  const indexedAt = asString(record?.indexedAt);
  const archiveStatus = asString(record?.archiveStatus);

  if (record && !referenceHash) reasons.push("REFERENCE_HASH_MISSING");
  if (record && !sourcePolicyVersion) reasons.push("SOURCE_POLICY_VERSION_MISSING");
  if (sourcePolicyVersion && !KNOWN_SOURCE_POLICIES.has(sourcePolicyVersion)) {
    reasons.push("SOURCE_POLICY_VERSION_UNRECOGNIZED");
  }
  if (record?.authority !== undefined && record.authority !== "READ_ONLY") {
    reasons.push("AUTHORITY_NOT_READ_ONLY");
  }
  if (record?.trusted === true) reasons.push("TRUSTED_STATE_LEAK");
  if (record?.importedToLiveState === true) reasons.push("LIVE_IMPORT_LEAK");
  if (archiveStatus && archiveStatus !== "INDEXED") reasons.push("ARCHIVE_STATUS_REQUIRES_REVIEW");

  for (const field of CONTROL_FIELDS) {
    if (record?.[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${field}`);
  }

  if (!KNOWN_RETENTION_CLASSES.has(retentionClass)) reasons.push("RETENTION_CLASS_UNKNOWN");
  if (retentionClass === "REVIEW_REQUIRED") reasons.push("RETENTION_REVIEW_REQUIRED");
  if (!retentionUntil && retentionClass !== "PERMANENT_REFERENCE") reasons.push("RETENTION_UNTIL_MISSING");

  const retentionReason = normalizeReasons([
    retentionReasonFor(retentionClass),
    ...(retentionUntil ? [`RETENTION_UNTIL:${retentionUntil}`] : []),
  ]);
  const normalizedReasons = normalizeReasons(reasons);
  const retentionStatus = classifyRetentionStatus(normalizedReasons);
  const reviewRequired = retentionStatus === "REVIEW_RETENTION" || retentionStatus === "RETENTION_DISPUTED";
  const authorityFields = {
    authority: "READ_ONLY" as const,
    trusted: false as const,
    importedToLiveState: false as const,
    mayDelete: false as const,
    mayCompact: false as const,
    mayArchiveMutate: false as const,
    mayImportToLiveState: false as const,
  };

  return Object.freeze({
    retentionStatus,
    retentionHash: buildRetentionHash({
      ...authorityFields,
      policyVersion,
      referenceHash,
      retentionClass,
      retentionStatus,
      retentionUntil,
      reviewRequired,
      snapshotHash,
    }),
    referenceHash,
    snapshotHash,
    retentionClass,
    retentionReason,
    source,
    policyVersion,
    indexedAt,
    retentionUntil,
    reviewRequired,
    evaluatedAt,
    ...authorityFields,
    reasons: normalizedReasons,
  });
}
