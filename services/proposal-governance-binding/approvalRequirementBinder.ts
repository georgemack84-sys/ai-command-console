import type { ApprovalRequirementBinding, GovernanceBindingInput, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function bindApprovalRequirements(input: GovernanceBindingInput): {
  approvalRequirementBinding: ApprovalRequirementBinding;
  errors: readonly ProposalGovernanceBindingError[];
} {
  const errors: ProposalGovernanceBindingError[] = [];
  const binding = input.approvalRequirementBinding;

  if (binding.requiredApprovalCount < 0 || binding.requiredApproverRoles.length === 0) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_APPROVAL_REQUIREMENT_MISMATCH",
      message: "Approval requirement binding must preserve explicit approver roles and non-negative counts.",
      path: "approvalRequirementBinding",
    });
  }

  if (
    input.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0
    && binding.requiredApprovalCount === 0
  ) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_APPROVAL_REQUIREMENT_MISMATCH",
      message: "Proposal has approval dependencies but binding removes required approvals.",
      path: "approvalRequirementBinding.requiredApprovalCount",
    });
  }

  return {
    approvalRequirementBinding: Object.freeze(binding),
    errors: Object.freeze(errors),
  };
}
