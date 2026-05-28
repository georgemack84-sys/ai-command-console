import type { ProposalApprovalBinding, ProposalIntegrityError } from "./proposalIntegrityStateTypes";

export function validateProposalApprovalLineage(
  binding: ProposalApprovalBinding,
): readonly ProposalIntegrityError[] {
  if (binding.approvalBound && binding.approvalDependencyIds.length > 0) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "PROPOSAL_APPROVAL_DEPENDENCY_INVALID",
    message: "Approval dependency preservation failed.",
    path: "approvalDependencyIds",
  }]);
}
