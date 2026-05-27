import { buildRecommendationFreeze } from "@/services/recommendation-synthesis/recommendationFreezeEngine";
import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { ConfidenceFreezeRecord, ConfidenceScoringError } from "./types/confidenceScoringTypes";

export function buildConfidenceFreezeRecord(
  errors: readonly ConfidenceScoringError[],
): ConfidenceFreezeRecord {
  const freeze = buildRecommendationFreeze(
    errors.map((error) => ({
      code: "RECOMMENDATION_SYNTHESIS_FAIL_CLOSED" as const,
      message: error.message,
      path: error.path,
    })),
  );
  return Object.freeze({
    frozen: freeze.frozen,
    reducedConfidence: errors.length > 0,
    cautionAmplified: errors.length > 0,
    reasons: Object.freeze(errors.map((error) => error.code)),
    freezeHash: hashRecommendationValue("confidence-scoring-freeze", {
      freezeHash: freeze.freezeHash,
      reasons: errors.map((error) => error.code),
    }),
  });
}
