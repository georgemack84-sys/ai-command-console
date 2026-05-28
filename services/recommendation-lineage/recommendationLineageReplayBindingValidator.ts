import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateRecommendationLineageReplayBinding(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  if (
    input.constitutionalCertificationResult.record.replaySafe
    && input.constitutionalReadinessResult.record.replaySafe
    && input.decisionIntentBoundaryResult.errors.every((error) => error.code !== "DECISION_INTENT_REPLAY_INVALID")
  ) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "RECOMMENDATION_LINEAGE_REPLAY_BINDING_INVALID",
    message: "Recommendation lineage replay binding is incomplete.",
    path: "replayBinding",
  }]);
}
