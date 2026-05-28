import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationTransition(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  if (input.constitutionalTransitionResult.freeze.frozen) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_TRANSITION_INVALID",
      message: "Transition validation is frozen and cannot support synthesis.",
      path: "constitutionalTransitionResult.freeze.frozen",
    }]);
  }
  return Object.freeze([]);
}
