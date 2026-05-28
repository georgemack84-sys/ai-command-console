import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function detectAuthorityPersistence(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.authorityPersistence === true || input.metadata?.staleAuthority === true
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_PERSISTENCE_DETECTED",
      message: "Residual authority persistence was detected.",
      path: "metadata",
    }, {
      code: "OPERATOR_AUTHORITY_STALE_AUTHORITY",
      message: "Stale authority continuation was detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
