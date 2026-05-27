import { deriveRecommendationConfidence } from "./recommendationConfidenceEngine";
import type {
  RecommendationConfidenceRecord,
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationConfidenceDeterminism(
  input: RecommendationSynthesisInput,
  confidenceRecord: RecommendationConfidenceRecord,
): readonly RecommendationSynthesisError[] {
  const replayed = deriveRecommendationConfidence(input);
  if (replayed.confidenceHash !== confidenceRecord.confidenceHash) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_DETERMINISM_INSTABILITY",
      message: "Confidence derivation is not deterministic.",
      path: "confidenceRecord.confidenceHash",
    }]);
  }
  return Object.freeze([]);
}
