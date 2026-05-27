import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function detectRecursiveOverride(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.recursiveOverride === true
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_RECURSIVE_OVERRIDE",
      message: "Recursive override loop detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
