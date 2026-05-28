import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationContainment(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  if (!input.recommendationValidationResult.result.containmentValidated) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_CONTAINMENT_INVALID",
      message: "Upstream containment validation must remain true.",
      path: "recommendationValidationResult.result.containmentValidated",
    }]);
  }
  return Object.freeze([]);
}
