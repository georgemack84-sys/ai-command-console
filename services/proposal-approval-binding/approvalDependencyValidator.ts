import type {
  ProposalApprovalBindingError,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";

export function validateApprovalDependencies(
  input: ProposalApprovalBindingInput,
): readonly ProposalApprovalBindingError[] {
  const errors: ProposalApprovalBindingError[] = [];
  const expectedIds = [...input.proposalIntegrityResult.proposal.approvalDependencyIds].sort();
  const actualIds = input.approvals.map((approval) => approval.approvalId).sort();

  if (expectedIds.length === 0 || actualIds.length === 0) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_DEPENDENCY_MISSING",
      message: "Approval binding requires explicit immutable approval dependencies.",
      path: "approvals",
    });
  }

  if (expectedIds.join("|") !== actualIds.join("|")) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_DEPENDENCY_FABRICATION",
      message: "Approval binding detected fabricated, missing, or reordered approval dependencies.",
      path: "approvals",
    });
  }

  const corrupted = input.approvals.find((approval) =>
    approval.proposalId !== input.proposalIntegrityResult.proposal.proposalId
    || approval.governanceSnapshotId !== input.proposalGovernanceBindingResult.binding.governanceSnapshotId
    || approval.authorityBoundaryId !== input.proposalGovernanceBindingResult.authorityBoundary.authorityBoundaryId
  );

  if (corrupted) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_DEPENDENCY_MISSING",
      message: "Approval dependency lineage does not match immutable proposal governance coordinates.",
      path: "approvals",
    });
  }

  return Object.freeze(errors);
}
