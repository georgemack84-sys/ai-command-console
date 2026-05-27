import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectValidationGovernanceDrift(
  input: RecommendationValidationInput,
): readonly RecommendationValidationError[] {
  if (input.metadata?.governanceBypass === true || input.metadata?.governanceSubstitution === true) {
    return Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_GOVERNANCE_DRIFT",
      message: "Governance drift or bypass marker detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
