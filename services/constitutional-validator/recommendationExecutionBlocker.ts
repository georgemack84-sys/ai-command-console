import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function blockRecommendationExecution(
  input: RecommendationValidationInput,
): readonly RecommendationValidationError[] {
  return input.metadata?.executionPayload === true
    ? Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_EXECUTION_RISK",
      message: "Execution payloads are forbidden in recommendation validation.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
