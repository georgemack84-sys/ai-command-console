import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function validateOperatorAuthorityFirewall(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.authorityExpansion === true
    || input.metadata?.hiddenExecution === true
    || input.metadata?.orchestrationTrigger === true
    || input.metadata?.schedulerPayload === true
    || input.recommendationValidationResult.result.executable
    || input.recommendationValidationResult.result.executionAuthorized
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_FIREWALL_VIOLATION",
      message: "Authority expansion is forbidden in operator suppression flows.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
