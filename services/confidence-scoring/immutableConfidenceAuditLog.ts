import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceAuditRecord, ConfidenceScoringLedgerEntry } from "./types/confidenceScoringTypes";

export function appendConfidenceAuditEntry(input: {
  existing?: readonly ConfidenceScoringLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly ConfidenceScoringLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}

export function buildConfidenceAuditRecord(input: {
  confidenceId: string;
  recommendationId: string;
  event: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  createdAt: string;
}): ConfidenceAuditRecord {
  return Object.freeze({
    auditId: `${input.confidenceId}:${input.event}`,
    confidenceId: input.confidenceId,
    recommendationId: input.recommendationId,
    event: input.event,
    governanceSnapshotId: input.governanceSnapshotId,
    replaySnapshotId: input.replaySnapshotId,
    createdAt: input.createdAt,
    auditHash: hashRecommendationValue("confidence-scoring-audit-record", input),
  });
}
