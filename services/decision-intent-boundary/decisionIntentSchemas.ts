import type {
  DecisionIntentBoundaryError,
  DecisionIntentBoundaryInput,
} from "./decisionIntentStateTypes";

export function validateDecisionIntentInput(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  const errors: DecisionIntentBoundaryError[] = [];
  if (input.summary.trim().length === 0) {
    errors.push({
      code: "DECISION_INTENT_SCHEMA_INVALID",
      message: "Intent summary must not be empty.",
      path: "summary",
    });
  }
  if (input.approvalDependencies.length === 0) {
    errors.push({
      code: "DECISION_INTENT_APPROVAL_DEPENDENCY_INVALID",
      message: "Intent artifacts must retain explicit approval dependencies.",
      path: "approvalDependencies",
    });
  }
  if (!input.constitutionalCertificationResult.derivedOnly || !input.constitutionalReadinessResult.derivedOnly) {
    errors.push({
      code: "DECISION_INTENT_SCHEMA_INVALID",
      message: "Upstream constitutional inputs must be derived-only.",
      path: "derivedOnly",
    });
  }
  return Object.freeze(errors);
}
