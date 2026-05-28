import type {
  ApprovalBindingStatus,
  OperatorOverrideBinding,
  ProposalApprovalBindingError,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";

export function resolveApprovalBindingStatus(input: {
  engineInput: ProposalApprovalBindingInput;
  errors: readonly ProposalApprovalBindingError[];
  overrideBinding?: OperatorOverrideBinding;
}): ApprovalBindingStatus {
  if (input.errors.length > 0) {
    return "FAILED_CLOSED";
  }

  if (input.overrideBinding?.disposition === "REVOKE") {
    return "REVOKED";
  }

  if (
    input.engineInput.proposalRevocationResult.status === "REVOKED"
    || input.engineInput.proposalRevocationResult.status === "CASCADE_IN_PROGRESS"
    || input.engineInput.proposalRevocationResult.status === "CASCADE_COMPLETED"
  ) {
    return "REVOKED";
  }

  if (
    input.overrideBinding?.disposition === "FREEZE"
    || input.engineInput.proposalFreezeResult.status === "FROZEN"
    || input.engineInput.proposalFreezeResult.status === "PERMANENTLY_FROZEN"
  ) {
    return "FROZEN";
  }

  return "BOUND";
}
