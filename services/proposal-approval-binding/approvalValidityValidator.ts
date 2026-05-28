import type {
  ApprovalDependency,
  ProposalApprovalBindingError,
} from "./types/proposalApprovalBindingTypes";
import type { ApprovalRequirementBinding } from "@/services/proposal-governance-binding/governanceBindingTypes";

export function validateApprovalBindingValidity(input: {
  approvals: readonly ApprovalDependency[];
  approvalRequirementBinding: ApprovalRequirementBinding;
}): readonly ProposalApprovalBindingError[] {
  const errors: ProposalApprovalBindingError[] = [];
  const allowedRoles = new Set(input.approvalRequirementBinding.requiredApproverRoles);

  if (input.approvals.length < input.approvalRequirementBinding.requiredApprovalCount) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_MISSING_LINEAGE",
      message: "Approval binding does not meet the immutable approval count requirement.",
      path: "approvals",
    });
  }

  const invalidRole = input.approvals.find((approval) => !allowedRoles.has(approval.approverRole));
  if (invalidRole) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_INFERRED_APPROVAL",
      message: "Approval binding detected an approval role outside the immutable governance requirement set.",
      path: "approvals",
    });
  }

  return Object.freeze(errors);
}
