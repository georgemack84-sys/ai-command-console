import type { ProposalApprovalBinding, ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function detectProposalApprovalDrift(input: {
  integrityInput: ProposalIntegrityInput;
  binding: ProposalApprovalBinding;
}): readonly ProposalIntegrityError[] {
  if (
    input.integrityInput.metadata?.approvalAmbiguity === true
    || input.binding.interventionIds.length === 0
  ) {
    return Object.freeze([{
      code: "PROPOSAL_APPROVAL_DEPENDENCY_INVALID",
      message: "Approval drift or missing intervention lineage was detected.",
      path: "approvalDependencyIds",
    }]);
  }
  return Object.freeze([]);
}
