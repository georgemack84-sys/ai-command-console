import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateRecommendationLineageIsolationBoundary(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  if (
    input.decisionIntentBoundaryResult.artifact.advisoryOnly
    && !input.decisionIntentBoundaryResult.artifact.executable
    && !input.decisionIntentBoundaryResult.artifact.executionAuthorized
    && !input.decisionIntentBoundaryResult.artifact.orchestrationAllowed
  ) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "RECOMMENDATION_LINEAGE_ISOLATION_VIOLATION",
    message: "Decision intent boundary no longer preserves advisory-only isolation.",
    path: "decisionIntentBoundaryResult.artifact",
  }]);
}
