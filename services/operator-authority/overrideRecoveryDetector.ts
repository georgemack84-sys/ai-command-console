import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function detectOverrideRecovery(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.overrideRecovery === true
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_OVERRIDE_RECOVERY_DETECTED",
      message: "Override recovery attempts are forbidden.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
