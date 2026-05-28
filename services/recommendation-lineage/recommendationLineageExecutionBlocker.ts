import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function blockRecommendationLineageExecution(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  if (
    input.metadata?.runtimeLinked === true
    || input.metadata?.orchestrationLinked === true
    || input.metadata?.recommendationTriggeredOrchestration === true
  ) {
    return Object.freeze([{
      code: input.metadata?.orchestrationLinked === true
        ? "RECOMMENDATION_LINEAGE_ORCHESTRATION_LINKED"
        : "RECOMMENDATION_LINEAGE_RUNTIME_LINKED",
      message: "Recommendation lineage may not bridge into runtime or orchestration.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
