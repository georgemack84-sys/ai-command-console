import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashReplayValue } from "./replayHashEngine";
import type { RecommendationReplayAuditRecord, RecommendationReplayLedgerEntry } from "./types/recommendationReplayTypes";

export function buildReplayAuditRecord(input: {
  replayId: string;
  recommendationId: string;
  eventType: RecommendationReplayAuditRecord["eventType"];
  replayHash: string;
  timestamp: string;
  previousEntryHash?: string;
}): RecommendationReplayAuditRecord {
  const entryHash = hashReplayValue("recommendation-replay-audit-record", {
    replayId: input.replayId,
    recommendationId: input.recommendationId,
    eventType: input.eventType,
    replayHash: input.replayHash,
    timestamp: input.timestamp,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    auditId: `${input.replayId}:${input.eventType}`,
    replayId: input.replayId,
    recommendationId: input.recommendationId,
    eventType: input.eventType,
    replayHash: input.replayHash,
    timestamp: input.timestamp,
    previousEntryHash: input.previousEntryHash,
    entryHash,
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
    operatorReviewRequired: true as const,
  });
}

export function appendReplayAuditEntry(args: {
  existing: readonly RecommendationReplayLedgerEntry[];
  record: RecommendationReplayAuditRecord;
}): readonly RecommendationReplayLedgerEntry[] {
  const previousHash = args.existing.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(args.record),
    previousHash,
    scope: "recommendation-replay",
  });
  return Object.freeze([...args.existing, entry]);
}
