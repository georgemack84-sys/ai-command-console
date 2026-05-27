import type { RecommendationEnvelope } from "./types/recommendationSynthesisTypes";

export function orderRecommendationsDeterministically(
  envelopes: readonly RecommendationEnvelope[],
): readonly RecommendationEnvelope[] {
  return Object.freeze(
    [...envelopes].sort((left, right) =>
      left.recommendation.recommendationId.localeCompare(right.recommendation.recommendationId),
    ),
  );
}
