import type { RecommendationSynthesisError } from "./types/recommendationSynthesisTypes";

export function shouldRecommendationFailClosed(
  errors: readonly RecommendationSynthesisError[],
): boolean {
  return errors.length > 0;
}
