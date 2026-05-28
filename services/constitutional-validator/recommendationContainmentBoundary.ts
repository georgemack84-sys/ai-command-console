import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function validateRecommendationContainmentBoundary(
  input: RecommendationValidationInput,
): readonly RecommendationValidationError[] {
  if (
    input.metadata?.containmentWeakening === true
    || input.recommendationLineageResult.errors.some((error) => error.code === "RECOMMENDATION_LINEAGE_CONTAINMENT_FAILURE")
  ) {
    return Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_CONTAINMENT_INVALID",
      message: "Containment boundary is weakened or disputed.",
      path: "containment",
    }]);
  }
  return Object.freeze([]);
}
