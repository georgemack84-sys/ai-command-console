import type { ProposalFreezeError, ProposalFreezeInput } from "./types/proposalFreezeTypes";

export function detectGovernanceMismatch(
  input: ProposalFreezeInput,
): readonly ProposalFreezeError[] {
  const errors: ProposalFreezeError[] = [];
  const proposalGovernanceSnapshotId = input.proposalIntegrityResult.proposal.governanceSnapshotId;
  const stateGovernanceSnapshotId = input.proposalStateEngineResult.governanceBinding.governanceSnapshotId;
  const enforcementGovernanceSnapshotId = input.constitutionalEnforcementResult.lineage.governanceSnapshotId;
  const transitionGovernanceSnapshotId = input.proposalStateEngineInput.transition.governanceSnapshotId;

  if (
    !proposalGovernanceSnapshotId
    || proposalGovernanceSnapshotId !== stateGovernanceSnapshotId
    || proposalGovernanceSnapshotId !== enforcementGovernanceSnapshotId
    || proposalGovernanceSnapshotId !== transitionGovernanceSnapshotId
  ) {
    errors.push({
      code: "PROPOSAL_FREEZE_GOVERNANCE_MISMATCH",
      message: "Governance snapshot correlation drifted across proposal integrity, proposal state, and constitutional enforcement layers.",
      path: "governanceSnapshotId",
    });
  }

  if (
    input.proposalStateEngineInput.governancePolicyVersion
    !== input.proposalStateEngineResult.governanceBinding.governancePolicyVersion
  ) {
    errors.push({
      code: "PROPOSAL_FREEZE_POLICY_MISMATCH",
      message: "Governance policy version drifted between proposal-state input and governance binding output.",
      path: "governancePolicyVersion",
    });
  }

  return Object.freeze(errors);
}
