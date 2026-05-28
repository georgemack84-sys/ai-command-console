import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { PrioritizationAuditEvent, PrioritizationLedgerEntry } from "./types/prioritizationTypes";

export function buildPrioritizationAuditEvent(input: {
  prioritizationId: string;
  recommendationId: string;
  eventType: PrioritizationAuditEvent["eventType"];
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
}): PrioritizationAuditEvent {
  const entryHash = hashRecommendationValue("recommendation-prioritization-audit-event", {
    prioritizationId: input.prioritizationId,
    recommendationId: input.recommendationId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash ?? null,
  });

  return Object.freeze({
    eventId: `${input.prioritizationId}:${input.eventType}`,
    prioritizationId: input.prioritizationId,
    recommendationId: input.recommendationId,
    eventType: input.eventType,
    timestamp: input.timestamp,
    inputHash: input.inputHash,
    outputHash: input.outputHash,
    previousEntryHash: input.previousEntryHash,
    entryHash,
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
  });
}

export function appendPrioritizationAuditEntry(args: {
  existing: readonly PrioritizationLedgerEntry[];
  event: PrioritizationAuditEvent;
}): readonly PrioritizationLedgerEntry[] {
  const previousHash = args.existing.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: Object.freeze(args.event),
    previousHash,
    scope: "recommendation-prioritization",
  });
  return Object.freeze([...args.existing, entry]);
}
