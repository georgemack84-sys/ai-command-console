import type { RecommendationReplayLedgerEntry } from "@/types/recommendation-integrity";
import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";

export function appendRecommendationAuditLedger(input: {
  existing?: readonly RecommendationReplayLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly RecommendationReplayLedgerEntry[] {
  const previousHash = input.existing && input.existing.length > 0
    ? input.existing[input.existing.length - 1]?.entryHash ?? null
    : null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), Object.freeze(entry)]);
}
