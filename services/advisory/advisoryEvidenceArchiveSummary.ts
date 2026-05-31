import { hashPayloadDeterministically } from "../contracts/payloadHasher";
import type { AdvisoryEvidenceArchiveEntry } from "./advisoryEvidenceArchiveIndex";

export type AdvisoryEvidenceArchiveSummaryStatus = "SUMMARIZED" | "DISPUTED_SUMMARY" | "FAILED_SUMMARY";

export type AdvisoryEvidenceArchiveSummary = Readonly<{
  summaryStatus: AdvisoryEvidenceArchiveSummaryStatus;
  totalEntries: number;
  counts: Readonly<{
    indexed: number;
    disputed: number;
    failed: number;
    unknown: number;
  }>;
  bySource: readonly Readonly<{
    source: string;
    count: number;
  }>[];
  disputedReferences: readonly Readonly<{
    referenceHash: string | null;
    reason: string;
  }>[];
  failedReferences: readonly Readonly<{
    referenceHash: string | null;
    reason: string;
  }>[];
  evidenceCoverage: Readonly<{
    withSnapshotId: number;
    withSnapshotHash: number;
    withPolicyVersion: number;
    withEvidenceRef: number;
  }>;
  summaryHash: string;
  generatedAt: string;
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

function normalizeEntries(entries: readonly unknown[]) {
  return entries.map((entry) => (isRecord(entry) ? { ...entry } : null));
}

function referenceReason(entry: Record<string, unknown>, fallback: string) {
  const reasons = Array.isArray(entry.reasons)
    ? entry.reasons.filter((reason): reason is string => typeof reason === "string" && reason.trim().length > 0)
    : [];
  return reasons[0] || fallback;
}

function buildBySource(entries: readonly (Record<string, unknown> | null)[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!entry) continue;
    const source = asString(entry.source) || "UNKNOWN_SOURCE";
    counts.set(source, (counts.get(source) || 0) + 1);
  }
  return Object.freeze([...counts.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([source, count]) => Object.freeze({ source, count })));
}

function buildSummaryHash(input: Omit<AdvisoryEvidenceArchiveSummary, "summaryStatus" | "summaryHash" | "generatedAt" | "reasons">) {
  return sha256({
    authority: input.authority,
    bySource: input.bySource,
    counts: input.counts,
    disputedReferences: input.disputedReferences,
    evidenceCoverage: input.evidenceCoverage,
    failedReferences: input.failedReferences,
    importedToLiveState: input.importedToLiveState,
    mayApprove: input.mayApprove,
    mayCancel: input.mayCancel,
    mayDeploy: input.mayDeploy,
    mayOverride: input.mayOverride,
    mayResume: input.mayResume,
    mayRetry: input.mayRetry,
    mayRollback: input.mayRollback,
    totalEntries: input.totalEntries,
    trusted: input.trusted,
  });
}

function classifySummary(reasons: readonly string[]) {
  if (reasons.includes("ARCHIVE_ENTRIES_MISSING") || reasons.includes("ARCHIVE_ENTRIES_MALFORMED")) {
    return "FAILED_SUMMARY" as const;
  }
  if (reasons.length > 0) return "DISPUTED_SUMMARY" as const;
  return "SUMMARIZED" as const;
}

export function summarizeAdvisoryEvidenceArchive(
  entries: unknown,
  generatedAt = new Date().toISOString(),
): AdvisoryEvidenceArchiveSummary {
  const reasons: string[] = [];

  if (entries === undefined || entries === null) {
    reasons.push("ARCHIVE_ENTRIES_MISSING");
  }
  if (entries !== undefined && entries !== null && !Array.isArray(entries)) {
    reasons.push("ARCHIVE_ENTRIES_MALFORMED");
  }

  const normalizedEntries = Array.isArray(entries) ? normalizeEntries(entries) : [];
  const counts = {
    indexed: 0,
    disputed: 0,
    failed: 0,
    unknown: 0,
  };
  const disputedReferences: { referenceHash: string | null; reason: string }[] = [];
  const failedReferences: { referenceHash: string | null; reason: string }[] = [];
  const evidenceCoverage = {
    withEvidenceRef: 0,
    withPolicyVersion: 0,
    withSnapshotHash: 0,
    withSnapshotId: 0,
  };

  for (const entry of normalizedEntries) {
    if (!entry) {
      counts.unknown += 1;
      reasons.push("ARCHIVE_ENTRY_MALFORMED");
      continue;
    }

    const status = asString(entry.archiveStatus);
    const referenceHash = asString(entry.referenceHash);

    if (asString(entry.snapshotId)) evidenceCoverage.withSnapshotId += 1;
    if (asString(entry.snapshotHash)) evidenceCoverage.withSnapshotHash += 1;
    if (asString(entry.policyVersion)) evidenceCoverage.withPolicyVersion += 1;
    if (asString(entry.evidenceRef)) evidenceCoverage.withEvidenceRef += 1;

    if (entry.authority !== "READ_ONLY") reasons.push("AUTHORITY_NOT_READ_ONLY");
    if (entry.trusted === true) reasons.push("TRUSTED_STATE_LEAK");
    if (entry.importedToLiveState === true) reasons.push("LIVE_IMPORT_LEAK");

    for (const field of CONTROL_FIELDS) {
      if (entry[field] === true) reasons.push(`CONTROL_AUTHORITY_LEAK:${field}`);
    }

    if (status === "INDEXED") {
      counts.indexed += 1;
    } else if (status === "DISPUTED_REFERENCE") {
      counts.disputed += 1;
      disputedReferences.push({
        referenceHash,
        reason: referenceReason(entry, "DISPUTED_REFERENCE"),
      });
      reasons.push("DISPUTED_REFERENCE_PRESENT");
    } else if (status === "FAILED_REFERENCE") {
      counts.failed += 1;
      failedReferences.push({
        referenceHash,
        reason: referenceReason(entry, "FAILED_REFERENCE"),
      });
      reasons.push("FAILED_REFERENCE_PRESENT");
    } else {
      counts.unknown += 1;
      reasons.push(`UNKNOWN_ARCHIVE_STATUS:${String(status || "UNKNOWN")}`);
    }
  }

  const bySource = buildBySource(normalizedEntries);
  const normalizedDisputedReferences = Object.freeze(disputedReferences
    .sort((left, right) => `${left.referenceHash ?? ""}:${left.reason}`.localeCompare(`${right.referenceHash ?? ""}:${right.reason}`))
    .map((reference) => Object.freeze(reference)));
  const normalizedFailedReferences = Object.freeze(failedReferences
    .sort((left, right) => `${left.referenceHash ?? ""}:${left.reason}`.localeCompare(`${right.referenceHash ?? ""}:${right.reason}`))
    .map((reference) => Object.freeze(reference)));
  const normalizedReasons = normalizeReasons(reasons);
  const summaryWithoutHash = {
    totalEntries: normalizedEntries.length,
    counts: Object.freeze(counts),
    bySource,
    disputedReferences: normalizedDisputedReferences,
    failedReferences: normalizedFailedReferences,
    evidenceCoverage: Object.freeze(evidenceCoverage),
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
  };

  return Object.freeze({
    summaryStatus: classifySummary(normalizedReasons),
    ...summaryWithoutHash,
    summaryHash: buildSummaryHash(summaryWithoutHash),
    generatedAt,
    reasons: normalizedReasons,
  });
}
