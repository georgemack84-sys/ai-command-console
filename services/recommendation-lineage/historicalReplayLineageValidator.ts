import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

function hasMarker(input: RecommendationLineageInput, key: string): boolean {
  return input.metadata?.[key] === true;
}

export function validateHistoricalReplayLineage(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  if (
    hasMarker(input, "presentStateSubstitution")
    || hasMarker(input, "syntheticLineage")
    || hasMarker(input, "replayRepair")
  ) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_SYNTHETIC_ANCESTRY",
      message: "Historical replay lineage contains present-state or synthetic markers.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
