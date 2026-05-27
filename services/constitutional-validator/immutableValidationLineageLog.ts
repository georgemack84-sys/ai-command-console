import { appendImmutableLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  RecommendationValidationLedgerEntry,
  RecommendationValidationLineageEntry,
  RecommendationValidationLineageLedger,
} from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";

export function appendValidationLineage(input: {
  existing?: RecommendationValidationLineageLedger;
  entry: RecommendationValidationLineageEntry;
}): RecommendationValidationLineageLedger {
  const entries = Object.freeze([...(input.existing?.entries ?? []), input.entry]);
  return Object.freeze({
    entries,
    lineageHash: hashValidationValue("recommendation-validation-lineage", entries),
  });
}

export function appendValidationLedger(input: {
  existing?: readonly RecommendationValidationLedgerEntry[];
  payload: Readonly<Record<string, unknown>>;
  scope: string;
}): readonly RecommendationValidationLedgerEntry[] {
  const previousHash = input.existing?.at(-1)?.entryHash ?? null;
  const entry = appendImmutableLedgerEntry({
    payload: input.payload,
    previousHash,
    scope: input.scope,
  });
  return Object.freeze([...(input.existing ?? []), entry]);
}
