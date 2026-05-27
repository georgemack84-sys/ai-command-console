import type {
  RecommendationEnvelope,
  RecommendationSynthesisError,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationOutput(
  envelopes: readonly RecommendationEnvelope[],
): readonly RecommendationSynthesisError[] {
  const errors = envelopes.flatMap((envelope, index) => {
    if (envelope.recommendation.executionAuthorized !== false || envelope.executionAuthorized !== false) {
      return [{
        code: "RECOMMENDATION_SYNTHESIS_INVALID_INPUT" as const,
        message: "Recommendation output must preserve executionAuthorized: false.",
        path: `recommendations[${index}]`,
      }];
    }
    return [];
  });
  return Object.freeze(errors);
}
