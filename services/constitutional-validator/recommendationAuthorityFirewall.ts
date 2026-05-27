import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function validateRecommendationAuthorityFirewall(
  input: RecommendationValidationInput,
): readonly RecommendationValidationError[] {
  return input.metadata?.authorityExpansion === true
    ? Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_AUTHORITY_EXPANSION",
      message: "Authority expansion is blocked by the recommendation firewall.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
