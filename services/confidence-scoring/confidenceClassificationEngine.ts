import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceClassificationRecord, ConfidenceLevel, UncertaintyLevel } from "./types/confidenceScoringTypes";

export function classifyConfidence(overallConfidence: number): ConfidenceClassificationRecord {
  const confidenceLevel: ConfidenceLevel =
    overallConfidence < 0.2
      ? "very_low"
      : overallConfidence < 0.4
        ? "low"
        : overallConfidence < 0.65
          ? "moderate"
          : overallConfidence < 0.85
            ? "high"
            : "very_high";
  const uncertaintyLevel: UncertaintyLevel =
    overallConfidence >= 0.85
      ? "minimal"
      : overallConfidence >= 0.65
        ? "elevated"
        : overallConfidence >= 0.4
          ? "high"
          : "critical";
  return Object.freeze({
    confidenceLevel,
    uncertaintyLevel,
    classificationHash: hashRecommendationValue("confidence-scoring-classification", {
      overallConfidence,
      confidenceLevel,
      uncertaintyLevel,
    }),
  });
}
