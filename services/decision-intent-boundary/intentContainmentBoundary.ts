import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentContainmentBoundary(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.constitutionalCertificationResult.report.failClosed
    ? Object.freeze([{
      code: "DECISION_INTENT_CONTAINMENT_FAILURE",
      message: "Certification gate already failed closed, so intent boundary must reject.",
      path: "constitutionalCertificationResult.report.failClosed",
    }])
    : Object.freeze([]);
}
