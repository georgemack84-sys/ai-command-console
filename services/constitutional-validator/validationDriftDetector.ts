import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectValidationDrift(input: RecommendationValidationInput): readonly RecommendationValidationError[] {
  if (input.metadata?.validationDrift === true || input.metadata?.syntheticAncestry === true) {
    return Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_SYNTHETIC_ANCESTRY",
      message: "Validation drift or synthetic ancestry marker detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
