import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function correlateRecommendationValidation(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  if (input.recommendationValidationResult.result.admissibility !== "ADMISSIBLE") {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_CERTIFICATION_INVALID",
      message: "Only admissible recommendations may be synthesized.",
      path: "recommendationValidationResult.result.admissibility",
    }]);
  }
  return Object.freeze([]);
}
