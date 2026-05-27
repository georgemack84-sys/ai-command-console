import { detectRecommendationHiddenExecution } from "@/services/recommendation-synthesis/recommendationHiddenExecutionDetector";
import type { EvidenceAggregationError, EvidenceAggregationInput } from "./types/evidenceAggregationTypes";

export function detectEvidenceHiddenExecution(
  input: EvidenceAggregationInput,
): readonly EvidenceAggregationError[] {
  const recommendation = input.recommendationSynthesisResult.recommendations[0]?.recommendation;
  if (!recommendation) {
    if (input.recommendationSynthesisInput.hiddenExecutionDetectionResult.report.blocked) {
      return Object.freeze([{
        code: "EVIDENCE_AGGREGATION_HIDDEN_EXECUTION",
        message: "Hidden execution detection blocked evidence aggregation input.",
        path: "hiddenExecutionDetectionResult.report.blocked",
      }]);
    }
    return Object.freeze([]);
  }
  return Object.freeze(
    detectRecommendationHiddenExecution({
      synthesisInput: input.recommendationSynthesisInput,
      recommendation,
    }).map((error) => ({
      code: "EVIDENCE_AGGREGATION_HIDDEN_EXECUTION" as const,
      message: error.message,
      path: error.path,
    })),
  );
}
