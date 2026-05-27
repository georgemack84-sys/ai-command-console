import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectRecommendationMutation(
  input: RecommendationValidationInput,
): readonly RecommendationValidationError[] {
  if (input.metadata?.proposalMutation === true || input.metadata?.recommendationMutation === true) {
    return Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_MUTATION_DETECTED",
      message: "Recommendation or downstream proposal mutation marker detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
