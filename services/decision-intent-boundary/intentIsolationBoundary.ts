import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentIsolationBoundary(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  const errors: DecisionIntentBoundaryError[] = [];
  if (
    input.constitutionalCertificationResult.report.executionAuthorized
    || input.constitutionalRuntimeSimulationResult.report.executable
    || input.constitutionalReadinessResult.report.executable
  ) {
    errors.push({
      code: "DECISION_INTENT_ISOLATION_VIOLATION",
      message: "Upstream input exposed executable or operational authority.",
      path: "upstream",
    });
  }
  return Object.freeze(errors);
}
