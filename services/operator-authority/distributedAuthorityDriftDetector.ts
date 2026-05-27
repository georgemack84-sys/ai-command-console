import type { OperatorAuthorityError, OperatorAuthorityInput } from "./types/operatorAuthorityTypes";

export function detectDistributedAuthorityDrift(
  input: OperatorAuthorityInput,
): readonly OperatorAuthorityError[] {
  return input.metadata?.distributedDrift === true || input.metadata?.propagationMismatch === true
    ? Object.freeze([{
      code: "OPERATOR_AUTHORITY_DISTRIBUTED_DRIFT",
      message: "Distributed authority drift or propagation mismatch detected.",
      path: "metadata",
    }, {
      code: "OPERATOR_AUTHORITY_PROPAGATION_MISMATCH",
      message: "Propagation mismatch detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
