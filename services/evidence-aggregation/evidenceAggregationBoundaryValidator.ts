import type { EvidenceAggregationError, EvidenceAggregationInput } from "./types/evidenceAggregationTypes";

export function validateEvidenceAggregationBoundary(
  input: EvidenceAggregationInput,
): readonly EvidenceAggregationError[] {
  const errors: EvidenceAggregationError[] = [];
  if (!input.aggregationSessionId || !input.startedAt) {
    errors.push({
      code: "EVIDENCE_AGGREGATION_INVALID_INPUT",
      message: "Aggregation session identifiers are required.",
      path: "aggregationSessionId",
    });
  }
  if (input.recommendationSynthesisResult.recommendations.some((item) => item.executionAuthorized !== false)) {
    errors.push({
      code: "EVIDENCE_AGGREGATION_HIDDEN_EXECUTION",
      message: "Aggregated evidence cannot consume executable recommendation artifacts.",
      path: "recommendationSynthesisResult.recommendations",
    });
  }
  return Object.freeze(errors);
}
