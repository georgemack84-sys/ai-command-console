import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function validateTransitionVisibility(input: DecisionReadinessCertificationInput): readonly DecisionReadinessCertificationError[] {
  return input.constitutionalTransitionResult.transition.operatorVisibilityRequired
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_READINESS_TRANSITION_AMBIGUITY" as const,
      message: "Transition visibility is required for certification.",
      path: "constitutionalTransitionResult.transition.operatorVisibilityRequired",
    }]);
}
