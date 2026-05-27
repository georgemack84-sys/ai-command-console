import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  RecommendationLineageEntry,
  RecommendationLineageLedger,
  RecommendationLineageLedgerEntry,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function appendRecommendationLineage(input: {
  existing?: RecommendationLineageLedger;
  entry: RecommendationLineageEntry;
}): RecommendationLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashRecommendationLineageValue("recommendation-lineage-ledger", entries),
  });
}

export function appendRecommendationLineageLedger(input: {
  existing?: readonly RecommendationLineageLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly RecommendationLineageLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
