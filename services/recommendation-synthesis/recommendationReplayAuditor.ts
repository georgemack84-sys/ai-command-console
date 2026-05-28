import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function auditRecommendationReplay(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  const replay = input.deterministicReplayResult.result;
  if (!replay.replayCertified || !replay.deterministic || replay.driftDetected) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_REPLAY_MISMATCH",
      message: "Replay must remain certified, deterministic, and drift-free.",
      path: "deterministicReplayResult.result",
    }]);
  }
  return Object.freeze([]);
}
