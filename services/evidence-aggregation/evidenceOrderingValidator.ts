import { buildEvidenceDeterministicOrdering } from "./evidenceDeterministicOrderingEngine";
import type { EvidenceAggregationError, EvidenceReference } from "./types/evidenceAggregationTypes";

export function validateEvidenceOrdering(
  references: readonly EvidenceReference[],
): readonly EvidenceAggregationError[] {
  const ordering = buildEvidenceDeterministicOrdering(references);
  const replayed = buildEvidenceDeterministicOrdering(ordering.ordered);
  if (ordering.orderingHash !== replayed.orderingHash) {
    return Object.freeze([{
      code: "EVIDENCE_AGGREGATION_UNSTABLE_ORDERING",
      message: "Evidence ordering is not deterministic.",
      path: "evidenceReferences",
    }]);
  }
  return Object.freeze([]);
}
