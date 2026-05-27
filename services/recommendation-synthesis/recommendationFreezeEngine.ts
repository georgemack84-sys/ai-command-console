import { hashRecommendationValue } from "./recommendationHashEngine";
import type {
  RecommendationFreezeRecord,
  RecommendationSynthesisError,
} from "./types/recommendationSynthesisTypes";

export function buildRecommendationFreeze(
  errors: readonly RecommendationSynthesisError[],
): RecommendationFreezeRecord {
  const reasons = Object.freeze(errors.map((error) => error.code));
  return Object.freeze({
    frozen: errors.length > 0,
    escalated: errors.length > 0,
    reasons,
    freezeHash: hashRecommendationValue("recommendation-synthesis-freeze", reasons),
  });
}
