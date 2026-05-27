import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateApprovalDependencies(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.approvalDependencies.length > 0
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_APPROVAL_DEPENDENCY_INVALID",
      message: "Intent artifact is missing explicit approval dependencies.",
      path: "approvalDependencies",
    }]);
}
