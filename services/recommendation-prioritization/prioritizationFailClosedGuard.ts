import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { PrioritizationError, PrioritizationFreezeRecord } from "./types/prioritizationTypes";

export function buildPrioritizationFreezeRecord(errors: readonly PrioritizationError[]): PrioritizationFreezeRecord {
  const reasons = Object.freeze(errors.map((error) => error.code));
  const failedClosed = errors.some((error) =>
    error.code !== "PRIORITIZATION_REPLAY_MISMATCH"
    && error.code !== "PRIORITIZATION_CONFIDENCE_FROZEN"
    && error.code !== "PRIORITIZATION_RECOMMENDATION_HASH_MISMATCH",
  );

  return Object.freeze({
    frozen: errors.length > 0,
    failedClosed,
    reasons,
    freezeHash: hashRecommendationValue("recommendation-prioritization-freeze", {
      reasons,
      failedClosed,
    }),
  });
}
