import type { RecommendationValidationError, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectValidationReplayDrift(
  input: RecommendationValidationInput,
): readonly RecommendationValidationError[] {
  if (input.metadata?.replayCorruption === true || input.metadata?.replayDrift === true) {
    return Object.freeze([{
      code: "RECOMMENDATION_VALIDATION_REPLAY_DRIFT",
      message: "Replay drift or corruption marker detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
