import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function detectHiddenAuthorityRestoration(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.hiddenAuthorityRestoration === true || input.metadata?.autonomousRecovery === true
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_HIDDEN_RESTORATION",
      message: "Hidden authority restoration attempt detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
