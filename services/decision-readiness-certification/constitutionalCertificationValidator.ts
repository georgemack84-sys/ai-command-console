import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function validateConstitutionalCertificationInput(
  input: DecisionReadinessCertificationInput,
): readonly DecisionReadinessCertificationError[] {
  const errors: DecisionReadinessCertificationError[] = [];
  if (!input.certificationId || !input.recommendationSystemId) {
    errors.push({
      code: "DECISION_READINESS_UNKNOWN_CERTIFICATION_STATE",
      message: "Certification identifiers are required.",
      path: "certificationId",
    });
  }
  if (input.hiddenExecutionDetectionResult.report.executionAuthorized !== false) {
    errors.push({
      code: "DECISION_READINESS_HIDDEN_EXECUTION",
      message: "Execution authorization must never appear in readiness certification inputs.",
      path: "hiddenExecutionDetectionResult.report.executionAuthorized",
    });
  }
  return Object.freeze(errors);
}
