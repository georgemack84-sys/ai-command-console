import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationOperatorAuthority(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  const forbiddenActions = new Set(["DENY", "FREEZE", "KILL_SWITCH", "REVOKE"]);
  if (forbiddenActions.has(input.operatorAuthorityResult.action.actionType)) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_AUTHORITY_AMBIGUITY",
      message: "Operator suppression action blocks recommendation synthesis output.",
      path: "operatorAuthorityResult.action.actionType",
    }]);
  }
  return Object.freeze([]);
}
