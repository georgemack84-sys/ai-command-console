import type {
  Recommendation,
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

const ANTI_EMERGENCE_TERMS = Object.freeze([
  "automatically",
  "self-direct",
  "self-heal",
  "retry loop",
  "recursive chain",
  "dispatch when",
  "schedule later",
]);

export function detectRecommendationAntiEmergence(input: {
  synthesisInput: RecommendationSynthesisInput;
  recommendation: Recommendation;
}): readonly RecommendationSynthesisError[] {
  const errors: RecommendationSynthesisError[] = [];
  const summary = `${input.recommendation.summary} ${input.recommendation.rationale}`.toLowerCase();
  for (const term of ANTI_EMERGENCE_TERMS) {
    if (summary.includes(term)) {
      errors.push({
        code: "RECOMMENDATION_SYNTHESIS_ANTI_EMERGENCE",
        message: `Anti-emergence detector matched forbidden pattern: ${term}.`,
        path: "recommendation.rationale",
      });
    }
  }
  if (input.synthesisInput.operatorAuthorityResult.action.actionType === "KILL_SWITCH") {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_AUTHORITY_AMBIGUITY",
      message: "Kill-switch authority prevents continued recommendation synthesis.",
      path: "operatorAuthorityResult.action.actionType",
    });
  }
  return Object.freeze(errors);
}
