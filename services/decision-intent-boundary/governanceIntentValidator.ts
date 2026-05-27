import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentGovernance(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.constitutionalCertificationResult.record.governanceBound
    && input.constitutionalReadinessResult.record.governanceBound
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_GOVERNANCE_VIOLATION",
      message: "Intent governance validation failed.",
      path: "governance",
    }]);
}
