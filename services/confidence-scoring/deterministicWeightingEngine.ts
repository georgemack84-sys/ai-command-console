import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceFactor, DeterministicWeightRecord } from "./types/confidenceScoringTypes";

export function buildDeterministicWeights(): DeterministicWeightRecord {
  const weights: DeterministicWeightRecord["weights"] = Object.freeze({
    evidence_quality: 0.24,
    replay_consistency: 0.2,
    governance_alignment: 0.2,
    validation_success: 0.14,
    policy_stability: 0.12,
    telemetry_completeness: 0.1,
  });
  return Object.freeze({
    weightId: "confidence-weights-v1",
    weights,
    deterministicHash: hashRecommendationValue("confidence-scoring-weights", weights),
  });
}

export function getFactorWeight(
  weights: DeterministicWeightRecord,
  factorType: ConfidenceFactor["factorType"],
): number {
  return weights.weights[factorType];
}
