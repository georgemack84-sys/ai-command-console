import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceFactor, ConfidenceScoringInput } from "./types/confidenceScoringTypes";

export function analyzePolicyStability(
  input: ConfidenceScoringInput,
): ConfidenceFactor {
  const policySnapshotIds = [...input.recommendationSynthesisInput.policySnapshotIds].sort((a, b) => a.localeCompare(b));
  const score = policySnapshotIds.length > 0 ? 1 : 0;
  return Object.freeze({
    factorId: `${input.confidenceSessionId}:policy-stability`,
    factorType: "policy_stability",
    score,
    weight: 0,
    reason: score === 1 ? "Policy bindings are explicit and replay-safe." : "Missing policy bindings invalidate confidence stability.",
    deterministicHash: hashRecommendationValue("confidence-scoring-policy-stability", {
      policySnapshotIds,
      score,
    }),
  });
}
