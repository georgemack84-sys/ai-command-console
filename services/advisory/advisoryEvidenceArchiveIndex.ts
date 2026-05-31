import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { AdvisorySnapshotOfflineReview } from "./advisorySnapshotOfflineReview";

export type AdvisoryEvidenceArchiveStatus = "INDEXED" | "DISPUTED_REFERENCE" | "FAILED_REFERENCE";

export type AdvisoryEvidenceArchiveSource = "EXPORTED_SNAPSHOT" | "OFFLINE_REVIEW" | "MANUAL_REFERENCE";

export type AdvisoryEvidenceArchiveEntry = Readonly<{
  archiveStatus: AdvisoryEvidenceArchiveStatus;
  referenceHash: string;
  snapshotId: string | null;
  snapshotHash: string | null;
  reviewStatus: string | null;
  verificationStatus: string | null;
  policyVersion: string | null;
  evidenceRef: string;
  indexedAt: string;
  source: AdvisoryEvidenceArchiveSource;
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
  reasons: readonly string[];
}>;

export type IndexAdvisoryEvidenceReferenceOptions = Readonly<{
  evidenceRef: string;
  indexedAt?: string;
  source?: AdvisoryEvidenceArchiveSource;
}>;

const CONTROL_FIELDS = [
  "mayDeploy",
  "mayRetry",
  "mayRollback",
  "mayCancel",
  "mayResume",
  "mayApprove",
  "mayOverride",
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

function buildReferenceHash(input: {
  evidenceRef: string;
  policyVersion: string | null;
  reviewStatus: string | null;
  snapshotHash: string | null;
  snapshotId: string | null;
  source: AdvisoryEvidenceArchiveSource;
  verificationStatus: string | null;
}) {
  return sha256({
    evidenceRef: input.evidenceRef,
    policyVersion: input.policyVersion,
    reviewStatus: input.reviewStatus,
    snapshotHash: input.snapshotHash,
    snapshotId: input.snapshotId,
    source: input.source,
    verificationStatus: input.verificationStatus,
  });
}

function hasRequiredFields(input: {
  policyVersion: string | null;
  reviewStatus: string | null;
  snapshotHash: string | null;
  snapshotId: string | null;
  verificationStatus: string | null;
}) {
  return Boolean(
    input.snapshotId &&
    input.snapshotHash &&
    input.reviewStatus &&
    input.verificationStatus &&
    input.policyVersion,
  );
}

function classifyArchiveStatus(reasons: readonly string[]) {
  if (
    reasons.includes("REFERENCE_MISSING") ||
    reasons.includes("REFERENCE_MALFORMED") ||
    reasons.includes("REVIEW_FAILED") ||
    reasons.includes("VERIFICATION_FAILED") ||
    reasons.includes("REQUIRED_FIELDS_ABSENT")
  ) {
    return "FAILED_REFERENCE" as const;
  }
  if (reasons.length > 0) return "DISPUTED_REFERENCE" as const;
  return "INDEXED" as const;
}

export function indexAdvisoryEvidenceReference(
  review: unknown,
  options: IndexAdvisoryEvidenceReferenceOptions,
): AdvisoryEvidenceArchiveEntry {
  const reasons: string[] = [];
  const reviewRecord = isRecord(review) ? review : null;
  const source = options.source || "OFFLINE_REVIEW";
  const evidenceRef = asString(options.evidenceRef) || "missing-evidence-reference";

  if (review === undefined || review === null) {
    reasons.push("REFERENCE_MISSING");
  } else if (!reviewRecord) {
    reasons.push("REFERENCE_MALFORMED");
  }

  if (reviewRecord?.authority !== undefined && reviewRecord.authority !== "READ_ONLY") {
    reasons.push("AUTHORITY_NOT_READ_ONLY");
  }

  for (const field of CONTROL_FIELDS) {
    if (reviewRecord?.[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${field}`);
  }

  const snapshotId = asString(reviewRecord?.snapshotId);
  const snapshotHash = asString(reviewRecord?.snapshotHash);
  const reviewStatus = asString(reviewRecord?.reviewStatus);
  const verificationStatus = asString(reviewRecord?.verificationStatus);
  const policyVersion = asString(reviewRecord?.policyVersion);

  if (reviewStatus === "FAILED_REVIEW") reasons.push("REVIEW_FAILED");
  if (verificationStatus === "FAILED") reasons.push("VERIFICATION_FAILED");
  if (reviewStatus === "DISPUTED_REVIEW") reasons.push("REVIEW_DISPUTED");
  if (verificationStatus === "DISPUTED") reasons.push("VERIFICATION_DISPUTED");
  if (!policyVersion && reviewRecord) reasons.push("POLICY_VERSION_UNKNOWN");

  if (reviewRecord && !hasRequiredFields({ policyVersion, reviewStatus, snapshotHash, snapshotId, verificationStatus })) {
    reasons.push("REQUIRED_FIELDS_ABSENT");
  }

  const normalizedReasons = normalizeReasons(reasons);

  return Object.freeze({
    archiveStatus: classifyArchiveStatus(normalizedReasons),
    referenceHash: buildReferenceHash({
      evidenceRef,
      policyVersion,
      reviewStatus,
      snapshotHash,
      snapshotId,
      source,
      verificationStatus,
    }),
    snapshotId,
    snapshotHash,
    reviewStatus,
    verificationStatus,
    policyVersion,
    evidenceRef,
    indexedAt: options.indexedAt || new Date().toISOString(),
    source,
    authority: "READ_ONLY",
    trusted: false,
    importedToLiveState: false,
    mayDeploy: false,
    mayRetry: false,
    mayRollback: false,
    mayCancel: false,
    mayResume: false,
    mayApprove: false,
    mayOverride: false,
    reasons: normalizedReasons,
  });
}
