import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function detectOverrideRetry(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.overrideRetry === true
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_OVERRIDE_RETRY",
      message: "Override retry semantics are forbidden.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
