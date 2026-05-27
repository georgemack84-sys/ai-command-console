import type {
  ProposalApprovalBindingError,
  ProposalApprovalBindingInput,
} from "./types/proposalApprovalBindingTypes";

export function validateApprovalGovernance(
  input: ProposalApprovalBindingInput,
): readonly ProposalApprovalBindingError[] {
  const errors: ProposalApprovalBindingError[] = [];
  const proposal = input.proposalIntegrityResult.proposal;
  const governance = input.proposalGovernanceBindingResult;
  const replay = input.proposalReplayResult;

  if (proposal.governanceSnapshotId !== governance.binding.governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_GOVERNANCE_MISMATCH",
      message: "Approval binding cannot detach from the original governance snapshot.",
      path: "proposalIntegrityResult.proposal.governanceSnapshotId",
    });
  }

  if (governance.snapshot.policySnapshotId !== governance.binding.policySnapshotId) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_GOVERNANCE_SUBSTITUTION",
      message: "Approval binding detected policy snapshot substitution.",
      path: "proposalGovernanceBindingResult.snapshot.policySnapshotId",
    });
  }

  if (replay.replay.governanceSnapshotId !== governance.binding.governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_APPROVAL_BINDING_GOVERNANCE_MISMATCH",
      message: "Replay governance snapshot diverges from immutable governance binding.",
      path: "proposalReplayResult.replay.governanceSnapshotId",
    });
  }

  return Object.freeze(errors);
}
