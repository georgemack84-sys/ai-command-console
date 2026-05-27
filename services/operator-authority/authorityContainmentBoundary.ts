import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function validateAuthorityContainmentBoundary(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  if (
    input.metadata?.containmentWeakening === true
    || input.metadata?.hiddenExecution === true
    || input.recommendationValidationResult.result.executable
    || input.recommendationValidationResult.result.executionAuthorized
    || input.recommendationValidationResult.result.executionRiskDetected
    || !input.recommendationValidationResult.result.containmentValidated
  ) {
    return Object.freeze([{
      code: "OPERATOR_AUTHORITY_CONTAINMENT_INVALID",
      message: "Operator suppression cannot proceed against weakened containment boundaries.",
      path: "containment",
    }]);
  }
  return Object.freeze([]);
}
