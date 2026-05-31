import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { AdvisoryReadModel } from "./advisoryReadModel";

export type AdvisorySnapshotExportStatus = "EXPORTED" | "DISPUTED_EXPORT" | "FAILED_EXPORT";

export type AdvisorySnapshotExport = Readonly<{
  exportStatus: AdvisorySnapshotExportStatus;
  snapshotId: string;
  snapshotHash: string;
  generatedAt: string;
  unifiedStatus: string;
  unifiedRisk: string;
  sourceBreakdown: readonly unknown[];
  conflicts: readonly unknown[];
  evidenceCompleteness: Readonly<{
    available: number;
    missing: number;
  }>;
  replayability: Readonly<{
    replayableSources: number;
    nonReplayableSources: number;
  }>;
  authority: "READ_ONLY";
  mayDeploy: false;
  mayRetry: false;
  mayRollback: false;
  mayCancel: false;
  mayResume: false;
  mayApprove: false;
  mayOverride: false;
  exportPolicyVersion: "advisory-snapshot-export/v1";
  reasons: readonly string[];
}>;

const EXPORT_POLICY_VERSION = "advisory-snapshot-export/v1" as const;

const KNOWN_STATUSES = new Set(["NORMAL", "WATCH", "CAUTION", "ESCALATE", "DISPUTED", "FAILED"]);
const KNOWN_RISKS = new Set(["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNKNOWN"]);
const CONTROL_FIELDS = [
  "mayDeploy",
  "mayRetry",
  "mayRollback",
  "mayCancel",
  "mayResume",
  "mayApprove",
  "mayOverride",
] as const;

const SAFE_COUNTS = Object.freeze({ available: 0, missing: 0 });
const SAFE_REPLAYABILITY = Object.freeze({ replayableSources: 0, nonReplayableSources: 0 });

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
  if (!isRecord(value)) return SAFE_COUNTS;
  const available = typeof value.available === "number" && Number.isFinite(value.available) ? value.available : 0;
  const missing = typeof value.missing === "number" && Number.isFinite(value.missing) ? value.missing : 0;
  return Object.freeze({ available, missing });
}

function normalizeReplayability(value: unknown) {
  if (!isRecord(value)) return SAFE_REPLAYABILITY;
  const replayableSources = typeof value.replayableSources === "number" && Number.isFinite(value.replayableSources)
    ? value.replayableSources
    : 0;
  const nonReplayableSources = typeof value.nonReplayableSources === "number" && Number.isFinite(value.nonReplayableSources)
    ? value.nonReplayableSources
    : 0;
  return Object.freeze({ replayableSources, nonReplayableSources });
}

function hasRequiredFields(readModel: Record<string, unknown>) {
  return (
    typeof readModel.unifiedStatus === "string" &&
    typeof readModel.unifiedRisk === "string" &&
    Array.isArray(readModel.sourceBreakdown) &&
    Array.isArray(readModel.conflicts) &&
    isRecord(readModel.evidenceCompleteness) &&
    isRecord(readModel.replayability)
  );
}

function classifyExport(readModel: Record<string, unknown> | null, reasons: string[]): AdvisorySnapshotExportStatus {
  if (!readModel) return "FAILED_EXPORT";
  if (!hasRequiredFields(readModel)) return "FAILED_EXPORT";
  if (reasons.some((reason) => reason.startsWith("CONTROL_AUTHORITY_LEAK:") || reason === "AUTHORITY_NOT_READ_ONLY")) {
    return "DISPUTED_EXPORT";
  }
  if (reasons.some((reason) => reason.startsWith("UNKNOWN_STATUS:") || reason.startsWith("UNKNOWN_RISK:"))) {
    return "DISPUTED_EXPORT";
  }
  if (Array.isArray(readModel.conflicts) && readModel.conflicts.length > 0) return "DISPUTED_EXPORT";
  return "EXPORTED";
}

function buildHashInput(exported: Omit<AdvisorySnapshotExport, "generatedAt" | "snapshotHash" | "snapshotId" | "reasons" | "exportStatus">) {
  return {
    authority: exported.authority,
    conflicts: exported.conflicts,
    evidenceCompleteness: exported.evidenceCompleteness,
    exportPolicyVersion: exported.exportPolicyVersion,
    mayApprove: exported.mayApprove,
    mayCancel: exported.mayCancel,
    mayDeploy: exported.mayDeploy,
    mayOverride: exported.mayOverride,
    mayResume: exported.mayResume,
    mayRetry: exported.mayRetry,
    mayRollback: exported.mayRollback,
    replayability: exported.replayability,
    sourceBreakdown: exported.sourceBreakdown,
    unifiedRisk: exported.unifiedRisk,
    unifiedStatus: exported.unifiedStatus,
  };
}

export function buildAdvisorySnapshotExport(
  readModel?: unknown,
  generatedAt = new Date().toISOString(),
): AdvisorySnapshotExport {
  const modelRecord = isRecord(readModel) ? readModel : null;
  const reasons: string[] = [];

  if (!modelRecord) {
    reasons.push("READ_MODEL_MISSING");
  } else if (!hasRequiredFields(modelRecord)) {
    reasons.push("READ_MODEL_REQUIRED_FIELDS_MISSING");
  }

  const unifiedStatus = typeof modelRecord?.unifiedStatus === "string" ? modelRecord.unifiedStatus : "UNKNOWN";
  const unifiedRisk = typeof modelRecord?.unifiedRisk === "string" ? modelRecord.unifiedRisk : "UNKNOWN";

  if (modelRecord && !KNOWN_STATUSES.has(unifiedStatus)) reasons.push(`UNKNOWN_STATUS:${unifiedStatus}`);
  if (modelRecord && !KNOWN_RISKS.has(unifiedRisk)) reasons.push(`UNKNOWN_RISK:${unifiedRisk}`);
  if (modelRecord && modelRecord.authority !== "READ_ONLY") reasons.push("AUTHORITY_NOT_READ_ONLY");

  for (const field of CONTROL_FIELDS) {
    if (modelRecord?.[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${field}`);
  }

  const normalizedReasons = normalizeReasonList(reasons);
  const exportStatus = classifyExport(modelRecord, [...normalizedReasons]);
  const exportedWithoutHashes = {
    unifiedStatus,
    unifiedRisk,
    sourceBreakdown: normalizeSourceBreakdown(modelRecord?.sourceBreakdown),
    conflicts: normalizeConflicts(modelRecord?.conflicts),
    evidenceCompleteness: normalizeCounts(modelRecord?.evidenceCompleteness),
    replayability: normalizeReplayability(modelRecord?.replayability),
    authority: "READ_ONLY" as const,
    mayDeploy: false as const,
    mayRetry: false as const,
    mayRollback: false as const,
    mayCancel: false as const,
    mayResume: false as const,
    mayApprove: false as const,
    mayOverride: false as const,
    exportPolicyVersion: EXPORT_POLICY_VERSION,
  };
  const snapshotHash = sha256(buildHashInput(exportedWithoutHashes));
  const snapshotId = sha256({
    exportPolicyVersion: EXPORT_POLICY_VERSION,
    snapshotHash,
  });

  return Object.freeze({
    exportStatus,
    snapshotId,
    snapshotHash,
    generatedAt,
    ...exportedWithoutHashes,
    reasons: normalizedReasons,
  });
}
