import { detectRecommendationAntiEmergence } from "@/services/recommendation-synthesis/recommendationAntiEmergenceDetector";
import type { EvidenceAggregationError, EvidenceAggregationInput } from "./types/evidenceAggregationTypes";

export function detectEvidenceAntiEmergence(
  input: EvidenceAggregationInput,
): readonly EvidenceAggregationError[] {
  const recommendation = input.recommendationSynthesisResult.recommendations[0]?.recommendation;
  if (!recommendation) {
    return Object.freeze([]);
  }
  return Object.freeze(
    detectRecommendationAntiEmergence({
      synthesisInput: input.recommendationSynthesisInput,
      recommendation,
    }).map((error) => ({
      code: "EVIDENCE_AGGREGATION_ANTI_EMERGENCE" as const,
      message: error.message,
      path: error.path,
    })),
  );
}
