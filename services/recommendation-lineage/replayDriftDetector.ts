import type {
  RecommendationLineageError,
  RecommendationLineageInput,
  ReplayLineageRecord,
} from "./recommendationLineageStateTypes";

export function detectReplayDrift(input: {
  lineageInput: RecommendationLineageInput;
  record: ReplayLineageRecord;
}): readonly RecommendationLineageError[] {
  if (input.lineageInput.metadata?.replayRepairAttack === true || input.record.replayDivergenceDetected) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_REPLAY_DRIFT",
      message: "Replay drift or repair attack was detected.",
      path: "replaySnapshotId",
    }]);
  }
  return Object.freeze([]);
}
