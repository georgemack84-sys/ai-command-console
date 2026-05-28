import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationEnvelope,
  RecommendationSynthesisError,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationDeterminism(
  envelopes: readonly RecommendationEnvelope[],
): readonly RecommendationSynthesisError[] {
  const orderedIds = envelopes.map((envelope) => envelope.recommendation.recommendationId);
  const stableHash = hashRecommendationValue("recommendation-synthesis-order", orderedIds);
  const replayedHash = hashRecommendationValue("recommendation-synthesis-order", [...orderedIds].sort((a, b) => a.localeCompare(b)));
  if (stableHash !== replayedHash) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_DETERMINISM_INSTABILITY",
      message: "Recommendation ordering is not deterministic.",
      path: "recommendations",
    }]);
  }
  return Object.freeze([]);
}
