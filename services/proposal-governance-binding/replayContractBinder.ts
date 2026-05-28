import { hashGovernanceBindingValue } from "./governanceBindingHasher";
import type { GovernanceBindingInput, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function bindReplayContract(input: GovernanceBindingInput): {
  replayContractId: string;
  errors: readonly ProposalGovernanceBindingError[];
} {
  const errors: ProposalGovernanceBindingError[] = [];
  const replayEpisode = input.recommendationReplayResult.episodes[0];

  if (!replayEpisode || replayEpisode.governanceReplay.governanceSnapshotId !== input.proposalIntegrityResult.proposal.governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_REPLAY_AMBIGUITY",
      message: "Replay contract binding could not reconstruct the original governance replay contract safely.",
      path: "recommendationReplayResult.episodes[0]",
    });
  }

  const replayContractId = input.replayContractId
    || `replay-contract:${input.proposalIntegrityResult.proposal.proposalId}:${hashGovernanceBindingValue("proposal-governance-binding-replay-contract-id", {
      replaySnapshotId: input.proposalIntegrityResult.proposal.replaySnapshotId,
      replayHash: input.proposalIntegrityResult.proposal.replayHash,
    }).slice(0, 12)}`;

  return {
    replayContractId,
    errors: Object.freeze(errors),
  };
}
