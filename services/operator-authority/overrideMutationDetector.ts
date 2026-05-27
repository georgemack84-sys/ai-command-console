import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function detectOverrideMutation(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.overrideMutation === true
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_OVERRIDE_MUTATION",
      message: "Override mutation attempt detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
