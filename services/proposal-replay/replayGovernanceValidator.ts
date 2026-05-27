import type { ProposalReplayInput, ProposalReplayError, ProposalReplaySnapshotBundle } from "./replayTypes";

export function validateReplayGovernance(
  input: ProposalReplayInput,
  snapshotBundle: ProposalReplaySnapshotBundle,
): readonly ProposalReplayError[] {
  const errors: ProposalReplayError[] = [];
  const replayEpisode = input.recommendationReplayResult.episodes[0];
  const proposal = input.proposalIntegrityResult.proposal;

  if (!replayEpisode) {
    errors.push({
      code: "PROPOSAL_REPLAY_GOVERNANCE_MISMATCH",
      message: "Proposal replay requires an immutable replay episode for governance reconstruction.",
      path: "recommendationReplayResult.episodes",
    });
    return Object.freeze(errors);
  }

  if (replayEpisode.governanceReplay.governanceSnapshotId !== snapshotBundle.governanceSnapshot.governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_REPLAY_GOVERNANCE_MISMATCH",
      message: "Replay governance snapshot diverged from the original proposal governance snapshot.",
      path: "recommendationReplayResult.episodes[0].governanceReplay.governanceSnapshotId",
    });
  }

  if (proposal.governanceSnapshotId !== snapshotBundle.governanceSnapshot.governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_REPLAY_GOVERNANCE_MISMATCH",
      message: "Proposal ancestry no longer matches the immutable governance snapshot binding.",
      path: "proposalIntegrityResult.proposal.governanceSnapshotId",
    });
  }

  if (snapshotBundle.governanceBinding.bindingStatus === "INVALID" || snapshotBundle.governanceBinding.bindingStatus === "DISPUTED") {
    errors.push({
      code: "PROPOSAL_REPLAY_GOVERNANCE_MISMATCH",
      message: "Proposal governance binding is not constitutionally admissible for replay reconstruction.",
      path: "proposalGovernanceBindingResult.binding.bindingStatus",
    });
  }

  return Object.freeze(errors);
}
