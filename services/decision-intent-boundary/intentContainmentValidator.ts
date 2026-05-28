import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentContainment(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.constitutionalCertificationResult.report.failClosed
    || !input.constitutionalCertificationResult.policy.containmentDominatesAutonomy
    ? Object.freeze([{
      code: "DECISION_INTENT_CONTAINMENT_FAILURE",
      message: "Intent containment validation failed closed.",
      path: "constitutionalCertificationResult",
    }])
    : Object.freeze([]);
}
