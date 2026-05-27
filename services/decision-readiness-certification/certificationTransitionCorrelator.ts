import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function correlateCertificationTransition(input: DecisionReadinessCertificationInput): readonly DecisionReadinessCertificationError[] {
  const invalid =
    input.constitutionalTransitionResult.freeze.frozen
    || !input.constitutionalTransitionResult.compatibility.operatorVisibilityRequired
    || !input.constitutionalTransitionResult.stateMachine.declared;
  return invalid
    ? Object.freeze([{
      code: "DECISION_READINESS_TRANSITION_AMBIGUITY" as const,
      message: "Transition visibility or legality was not constitutionally stable.",
      path: "constitutionalTransitionResult",
    }])
    : Object.freeze([]);
}
