import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceAggregationError } from "./types/evidenceAggregationTypes";

export function validateEvidenceHash(input: {
  scope: string;
  value: unknown;
  expectedHash: string;
  path: string;
}): readonly EvidenceAggregationError[] {
  const replayed = hashEvidenceValue(input.scope, input.value);
  if (replayed !== input.expectedHash) {
    return Object.freeze([{
      code: "EVIDENCE_AGGREGATION_HASH_INSTABILITY",
      message: "Evidence hash instability detected.",
      path: input.path,
    }]);
  }
  return Object.freeze([]);
}
