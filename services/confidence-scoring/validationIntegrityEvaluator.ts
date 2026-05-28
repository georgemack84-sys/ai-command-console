import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceFactor, ConfidenceScoringInput } from "./types/confidenceScoringTypes";

export function evaluateValidationIntegrity(
  input: ConfidenceScoringInput,
): ConfidenceFactor {
  const result = input.recommendationSynthesisInput.recommendationValidationResult.result;
  const score = result.governanceValidated && result.replayValidated && result.containmentValidated ? 1 : 0.25;
  return Object.freeze({
    factorId: `${input.confidenceSessionId}:validation-integrity`,
    factorType: "validation_success",
    score,
    weight: 0,
    reason: score === 1 ? "Validation remained constitutionally admissible." : "Validation instability increases caution.",
    deterministicHash: hashRecommendationValue("confidence-scoring-validation-integrity", {
      governanceValidated: result.governanceValidated,
      replayValidated: result.replayValidated,
      containmentValidated: result.containmentValidated,
      score,
    }),
  });
}
