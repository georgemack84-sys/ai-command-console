import type {
  RecommendationLineageError,
  RecommendationLineageInput,
  ReplayLineageRecord,
} from "./recommendationLineageStateTypes";

export function detectReplayLineageDrift(input: {
  lineageInput: RecommendationLineageInput;
  record: ReplayLineageRecord;
}): readonly RecommendationLineageError[] {
  if (input.record.replayDivergenceDetected || input.lineageInput.metadata?.replayDriftInjection === true) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_REPLAY_DRIFT",
      message: "Replay drift was detected in recommendation ancestry.",
      path: "replaySnapshotId",
    }]);
  }
  return Object.freeze([]);
}
