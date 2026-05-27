import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceFactor, ConfidenceScoringInput } from "./types/confidenceScoringTypes";

export function evaluateTelemetryCompleteness(
  input: ConfidenceScoringInput,
): ConfidenceFactor {
  const telemetryCount = input.recommendationSynthesisInput.telemetry.length;
  const score = Math.max(0, Math.min(1, Number((telemetryCount >= 2 ? 1 : telemetryCount / 2).toFixed(3))));
  return Object.freeze({
    factorId: `${input.confidenceSessionId}:telemetry-completeness`,
    factorType: "telemetry_completeness",
    score,
    weight: 0,
    reason: telemetryCount >= 2 ? "Telemetry inputs are complete for deterministic scoring." : "Telemetry inputs are incomplete and require caution.",
    deterministicHash: hashRecommendationValue("confidence-scoring-telemetry-completeness", {
      telemetryCount,
      score,
    }),
  });
}
