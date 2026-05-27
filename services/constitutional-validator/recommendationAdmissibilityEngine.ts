import type { RecommendationAdmissibility, RecommendationValidationError } from "./types/recommendationValidationTypes";

export function decideRecommendationAdmissibility(input: {
  errors: readonly RecommendationValidationError[];
  executionRiskDetected: boolean;
}): RecommendationAdmissibility {
  if (input.executionRiskDetected) {
    return "BLOCKED";
  }
  if (input.errors.some((error) =>
    error.code === "RECOMMENDATION_VALIDATION_GOVERNANCE_INVALID"
    || error.code === "RECOMMENDATION_VALIDATION_GOVERNANCE_DRIFT")) {
    return "DISPUTED";
  }
  if (input.errors.some((error) =>
    error.code === "RECOMMENDATION_VALIDATION_REPLAY_INVALID"
    || error.code === "RECOMMENDATION_VALIDATION_REPLAY_DRIFT"
    || error.code === "RECOMMENDATION_VALIDATION_SYNTHETIC_ANCESTRY")) {
    return "REJECTED";
  }
  if (input.errors.some((error) =>
    error.code === "RECOMMENDATION_VALIDATION_CONTAINMENT_INVALID"
    || error.code === "RECOMMENDATION_VALIDATION_OVERRIDE_INCOMPATIBLE"
    || error.code === "RECOMMENDATION_VALIDATION_APPROVAL_DEPENDENCY_INVALID")) {
    return "ESCALATED";
  }
  if (input.errors.length > 0) {
    return "REJECTED";
  }
  return "ADMISSIBLE";
}
