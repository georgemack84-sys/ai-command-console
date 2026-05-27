import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function validateRecommendationIsolationBoundary(
  input: RecommendationValidationInput,
): readonly RecommendationValidationError[] {
  const artifact = input.decisionIntentBoundaryResult.artifact;
  return artifact.advisoryOnly && !artifact.executable && !artifact.executionAuthorized
    ? Object.freeze([])
    : Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_ISOLATION_VIOLATION",
      message: "Recommendation isolation boundary was violated.",
      path: "artifact",
    }]);
}
