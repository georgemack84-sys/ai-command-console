import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceFactor, ConfidenceScoringInput } from "./types/confidenceScoringTypes";

export function evaluateReplayConsistency(
  input: ConfidenceScoringInput,
): ConfidenceFactor {
  const replay = input.recommendationSynthesisInput.deterministicReplayResult.result;
  const score = replay.replayCertified && replay.deterministic && !replay.driftDetected ? 1 : 0.15;
  return Object.freeze({
    factorId: `${input.confidenceSessionId}:replay-consistency`,
    factorType: "replay_consistency",
    score,
    weight: 0,
    reason: score === 1 ? "Replay remained deterministic and certified." : "Replay uncertainty forces caution.",
    deterministicHash: hashRecommendationValue("confidence-scoring-replay-consistency", {
      replayCertified: replay.replayCertified,
      deterministic: replay.deterministic,
      driftDetected: replay.driftDetected,
      score,
    }),
  });
}
