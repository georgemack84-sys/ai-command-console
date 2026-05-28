import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function detectKillSwitchBypass(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.killSwitchBypass === true
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_KILL_SWITCH_BYPASS",
      message: "Kill switch bypass attempt detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
