import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function detectRecommendationDrift(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  const replayHash = input.deterministicReplayResult.result.replayHash;
  const certificationReplayHash = input.decisionReadinessCertificationResult.replayRecord.replayHash;

  if (replayHash !== certificationReplayHash) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_REPLAY_MISMATCH",
      message: "Replay hash drift detected between replay and certification artifacts.",
      path: "replayHash",
    }]);
  }
  return Object.freeze([]);
}
