import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentAuthorityFirewall(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  const errors: DecisionIntentBoundaryError[] = [];
  if (
    input.constitutionalCertificationResult.report.executionAuthorized
    || input.constitutionalCertificationResult.report.orchestrationAllowed
  ) {
    errors.push({
      code: "DECISION_INTENT_AUTHORITY_CROSSOVER",
      message: "Certification output crossed into authority before intent evaluation.",
      path: "constitutionalCertificationResult.report",
    });
  }
  return Object.freeze(errors);
}
