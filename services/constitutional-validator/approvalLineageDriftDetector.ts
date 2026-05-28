import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectApprovalLineageDrift(
  input: RecommendationValidationInput,
): readonly RecommendationValidationError[] {
  if (input.metadata?.approvalDrift === true || input.metadata?.overrideSuppression === true) {
    return Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_APPROVAL_DRIFT",
      message: "Approval lineage drift or override suppression detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
