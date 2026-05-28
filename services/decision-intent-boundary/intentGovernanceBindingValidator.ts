import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentGovernanceBinding(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.constitutionalCertificationResult.record.governanceBound
    && input.constitutionalReadinessResult.record.governanceBound
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_GOVERNANCE_BINDING_INVALID",
      message: "Intent governance binding is incomplete.",
      path: "governanceBinding",
    }]);
}
