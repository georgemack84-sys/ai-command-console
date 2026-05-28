import type { GovernanceBindingInput, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function validateGovernanceBindingReplay(
  input: GovernanceBindingInput,
): readonly ProposalGovernanceBindingError[] {
  const errors: ProposalGovernanceBindingError[] = [];
  const episode = input.recommendationReplayResult.episodes[0];

  if (!episode || !episode.validation.deterministicReplayVerified || !episode.validation.governanceConsistencyVerified) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_REPLAY_AMBIGUITY",
      message: "Replay contract is not sufficiently deterministic to bind governance safely.",
      path: "recommendationReplayResult",
    });
  }

  if (episode && episode.governanceReplay.governanceSnapshotId !== input.proposalIntegrityResult.proposal.governanceSnapshotId) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_GOVERNANCE_MIGRATION",
      message: "Replay governance snapshot does not match immutable proposal ancestry.",
      path: "recommendationReplayResult.episodes[0].governanceReplay.governanceSnapshotId",
    });
  }

  return Object.freeze(errors);
}
