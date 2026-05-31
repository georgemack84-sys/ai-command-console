import { hashPayloadDeterministically } from "../contracts/payloadHasher";

export type AdvisorySnapshotVerificationStatus = "VALID" | "DISPUTED" | "FAILED";

export type AdvisorySnapshotVerificationResult = Readonly<{
  verificationStatus: AdvisorySnapshotVerificationStatus;
  snapshotId: string | null;
  snapshotHash: string | null;
  expectedSnapshotHash: string | null;
  expectedSnapshotId: string | null;
  hashMatches: boolean;
  idMatches: boolean;
  policyVersion: string | null;
  replayable: boolean;
  authority: "READ_ONLY";
  mayDeploy: false;
  mayRetry: false;
  mayRollback: false;
  mayCancel: false;
  mayResume: false;
  mayApprove: false;
  mayOverride: false;
  reasons: readonly string[];
}>;

const EXPORT_POLICY_VERSION = "advisory-snapshot-export/v1";
const CONTROL_FIELDS = [
  "mayDeploy",
  "mayRetry",
  "mayRollback",
  "mayCancel",
  "mayResume",
  "mayApprove",
  "mayOverride",
] as const;
const REQUIRED_FIELDS = [
  "unifiedStatus",
  "unifiedRisk",
  "sourceBreakdown",
  "conflicts",
  "evidenceCompleteness",
  "replayability",
  "snapshotHash",
  "snapshotId",
  "exportPolicyVersion",
] as const;

function sha256(value: unknown) {
  return `sha256:${hashPayloadDeterministically(value)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeReasonList(reasons: readonly string[]) {
  return Object.freeze([...new Set(reasons)].sort());
}

function normalizeSourceBreakdown(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) return Object.freeze([]);

  return Object.freeze([...value]
    .map((source) => (isRecord(source) ? { ...source } : source))
    .sort((left, right) => {
      const leftRecord = isRecord(left) ? left : {};
      const rightRecord = isRecord(right) ? right : {};
      return `${String(leftRecord.source ?? "")}:${String(leftRecord.status ?? "")}`.localeCompare(
        `${String(rightRecord.source ?? "")}:${String(rightRecord.status ?? "")}`,
      );
    }));
}

function normalizeConflicts(value: unknown): readonly unknown[] {
  if (!Array.isArray(value)) return Object.freeze([]);

  return Object.freeze([...value]
    .map((conflict) => (isRecord(conflict) ? { ...conflict } : conflict))
    .sort((left, right) => {
      const leftRecord = isRecord(left) ? left : {};
      const rightRecord = isRecord(right) ? right : {};
      return `${String(leftRecord.source ?? "")}:${String(leftRecord.reason ?? "")}`.localeCompare(
        `${String(rightRecord.source ?? "")}:${String(rightRecord.reason ?? "")}`,
      );
    }));
}

function normalizeCounts(value: unknown) {
  if (!isRecord(value)) return null;
  if (typeof value.available !== "number" || !Number.isFinite(value.available)) return null;
  if (typeof value.missing !== "number" || !Number.isFinite(value.missing)) return null;
  return Object.freeze({ available: value.available, missing: value.missing });
}

function normalizeReplayability(value: unknown) {
  if (!isRecord(value)) return null;
  if (typeof value.replayableSources !== "number" || !Number.isFinite(value.replayableSources)) return null;
  if (typeof value.nonReplayableSources !== "number" || !Number.isFinite(value.nonReplayableSources)) return null;
  return Object.freeze({
    replayableSources: value.replayableSources,
    nonReplayableSources: value.nonReplayableSources,
  });
}

function hasRequiredFields(snapshot: Record<string, unknown>) {
  return REQUIRED_FIELDS.every((field) => snapshot[field] !== undefined);
}

function buildHashInput(snapshot: Record<string, unknown>) {
  const evidenceCompleteness = normalizeCounts(snapshot.evidenceCompleteness);
  const replayability = normalizeReplayability(snapshot.replayability);

  if (!evidenceCompleteness || !replayability) return null;

  return {
    authority: snapshot.authority,
    conflicts: normalizeConflicts(snapshot.conflicts),
    evidenceCompleteness,
    exportPolicyVersion: snapshot.exportPolicyVersion,
    mayApprove: snapshot.mayApprove,
    mayCancel: snapshot.mayCancel,
    mayDeploy: snapshot.mayDeploy,
    mayOverride: snapshot.mayOverride,
    mayResume: snapshot.mayResume,
    mayRetry: snapshot.mayRetry,
    mayRollback: snapshot.mayRollback,
    replayability,
    sourceBreakdown: normalizeSourceBreakdown(snapshot.sourceBreakdown),
    unifiedRisk: snapshot.unifiedRisk,
    unifiedStatus: snapshot.unifiedStatus,
  };
}

function classifyVerification(reasons: readonly string[]) {
  if (
    reasons.includes("SNAPSHOT_MISSING") ||
    reasons.includes("SNAPSHOT_MALFORMED") ||
    reasons.includes("REQUIRED_FIELDS_MISSING") ||
    reasons.includes("PAYLOAD_CANNOT_NORMALIZE")
  ) {
    return "FAILED" as const;
  }
  if (reasons.length > 0) return "DISPUTED" as const;
  return "VALID" as const;
}

export function verifyAdvisorySnapshot(snapshot: unknown): AdvisorySnapshotVerificationResult {
  const reasons: string[] = [];
  const snapshotRecord = isRecord(snapshot) ? snapshot : null;

  if (snapshot === undefined || snapshot === null) {
    reasons.push("SNAPSHOT_MISSING");
  } else if (!snapshotRecord) {
    reasons.push("SNAPSHOT_MALFORMED");
  } else if (!hasRequiredFields(snapshotRecord)) {
    reasons.push("REQUIRED_FIELDS_MISSING");
  }

  if (snapshotRecord?.authority !== undefined && snapshotRecord.authority !== "READ_ONLY") {
    reasons.push("AUTHORITY_NOT_READ_ONLY");
  }

  for (const field of CONTROL_FIELDS) {
    if (snapshotRecord?.[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${field}`);
  }

  const policyVersion = typeof snapshotRecord?.exportPolicyVersion === "string" ? snapshotRecord.exportPolicyVersion : null;
  if (policyVersion && policyVersion !== EXPORT_POLICY_VERSION) {
    reasons.push(`UNKNOWN_POLICY_VERSION:${policyVersion}`);
  }

  const hashInput = snapshotRecord ? buildHashInput(snapshotRecord) : null;
  if (snapshotRecord && hasRequiredFields(snapshotRecord) && !hashInput) {
    reasons.push("PAYLOAD_CANNOT_NORMALIZE");
  }

  const expectedSnapshotHash = hashInput ? sha256(hashInput) : null;
  const expectedSnapshotId = expectedSnapshotHash
    ? sha256({
      exportPolicyVersion: EXPORT_POLICY_VERSION,
      snapshotHash: expectedSnapshotHash,
    })
    : null;
  const snapshotHash = typeof snapshotRecord?.snapshotHash === "string" ? snapshotRecord.snapshotHash : null;
  const snapshotId = typeof snapshotRecord?.snapshotId === "string" ? snapshotRecord.snapshotId : null;
  const hashMatches = Boolean(snapshotHash && expectedSnapshotHash && snapshotHash === expectedSnapshotHash);
  const idMatches = Boolean(snapshotId && expectedSnapshotId && snapshotId === expectedSnapshotId);

  if (snapshotRecord && expectedSnapshotHash && !hashMatches) reasons.push("SNAPSHOT_HASH_MISMATCH");
  if (snapshotRecord && expectedSnapshotId && !idMatches) reasons.push("SNAPSHOT_ID_MISMATCH");

  const normalizedReasons = normalizeReasonList(reasons);

  return Object.freeze({
    verificationStatus: classifyVerification(normalizedReasons),
    snapshotId,
    snapshotHash,
    expectedSnapshotHash,
    expectedSnapshotId,
    hashMatches,
    idMatches,
    policyVersion,
    replayable: normalizedReasons.length === 0 && hashMatches && idMatches,
    authority: "READ_ONLY",
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
