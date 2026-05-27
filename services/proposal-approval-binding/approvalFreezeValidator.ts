import type {
  ProposalApprovalBindingError,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";

export function validateApprovalFreezeState(
  input: ProposalApprovalBindingInput,
): readonly ProposalApprovalBindingError[] {
  if (input.proposalFreezeResult.status === "ACTIVE") {
    return Object.freeze([]);
  }

  return Object.freeze([{
    code: "PROPOSAL_APPROVAL_BINDING_FREEZE_BYPASS",
    message: "Approval binding cannot bypass constitutional freeze containment.",
    path: "proposalFreezeResult.status",
  } satisfies ProposalApprovalBindingError]);
}
