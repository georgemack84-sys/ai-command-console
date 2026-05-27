import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  RecommendationAuditLedgerEntry,
  RecommendationSynthesisLineageEntry,
  RecommendationSynthesisLineageLedger,
} from "./types/recommendationSynthesisTypes";
import { hashRecommendationValue } from "./recommendationHashEngine";

export function appendRecommendationLineage(input: {
  existing?: RecommendationSynthesisLineageLedger;
  entry: RecommendationSynthesisLineageEntry;
}): RecommendationSynthesisLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashRecommendationValue("recommendation-synthesis-lineage", entries),
  });
}

export function appendRecommendationAuditEntry(input: {
  existing?: readonly RecommendationAuditLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly RecommendationAuditLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
