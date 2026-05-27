import { hashProposalReplayValue } from "./replayHasher";
import type {
  ProposalReplayError,
  ProposalReplayInput,
  ProposalReplaySnapshotBundle,
} from "./replayTypes";

export function loadProposalReplaySnapshots(
  input: ProposalReplayInput,
): {
  snapshotBundle: ProposalReplaySnapshotBundle;
  errors: readonly ProposalReplayError[];
} {
  const errors: ProposalReplayError[] = [];
  const proposalSnapshotId = input.proposalIntegrityResult.snapshot.snapshotId;
  const governanceSnapshot = input.proposalGovernanceBindingResult.snapshot;
  const governanceBinding = input.proposalGovernanceBindingResult.binding;
  const authorityBoundary = input.proposalGovernanceBindingResult.authorityBoundary;
  const validatorVersionSet = input.proposalGovernanceBindingResult.validatorVersionSet;
  const approvalRequirementBinding = input.proposalGovernanceBindingResult.approvalRequirementBinding;

  if (!proposalSnapshotId) {
    errors.push({
      code: "PROPOSAL_REPLAY_MISSING_PROPOSAL_SNAPSHOT",
      message: "Proposal replay requires the original immutable proposal snapshot.",
      path: "proposalIntegrityResult.snapshot.snapshotId",
    });
  }

  if (!governanceSnapshot.governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_REPLAY_MISSING_GOVERNANCE_SNAPSHOT",
      message: "Proposal replay requires the original immutable governance snapshot.",
      path: "proposalGovernanceBindingResult.snapshot.governanceSnapshotId",
    });
  }

  if (!governanceSnapshot.policySnapshotId) {
    errors.push({
      code: "PROPOSAL_REPLAY_MISSING_POLICY_SNAPSHOT",
      message: "Proposal replay requires the original immutable policy snapshot.",
      path: "proposalGovernanceBindingResult.snapshot.policySnapshotId",
    });
  }

  if (!governanceBinding.replayContractId) {
    errors.push({
      code: "PROPOSAL_REPLAY_MISSING_REPLAY_CONTRACT",
      message: "Proposal replay requires the original replay contract binding.",
      path: "proposalGovernanceBindingResult.binding.replayContractId",
    });
  }

  if (!authorityBoundary.authorityBoundaryId) {
    errors.push({
      code: "PROPOSAL_REPLAY_AUTHORITY_SNAPSHOT_MISSING",
      message: "Proposal replay requires the original immutable authority boundary.",
      path: "proposalGovernanceBindingResult.authorityBoundary.authorityBoundaryId",
    });
  }

  const snapshotBundle = Object.freeze({
    proposalSnapshotId,
    governanceSnapshot,
    governanceBinding,
    authorityBoundary,
    validatorVersionSet,
    approvalRequirementBinding,
    proposalSnapshotHash: hashProposalReplayValue("proposal-replay-snapshot-bundle", {
      proposalSnapshotId,
      governanceSnapshotId: governanceSnapshot.governanceSnapshotId,
      policySnapshotId: governanceSnapshot.policySnapshotId,
      authorityBoundaryId: authorityBoundary.authorityBoundaryId,
      replayContractId: governanceBinding.replayContractId,
      validatorVersionSetId: validatorVersionSet.validatorVersionSetId,
      approvalRequirementSetId: approvalRequirementBinding.approvalRequirementSetId,
    }),
  });

  return {
    snapshotBundle,
    errors: Object.freeze(errors),
  };
}
