import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateProposalReplay(input: ProposalIntegrityInput): readonly ProposalIntegrityError[] {
  if (
    input.constitutionalReplayResult.record.replayDeterministic
    && input.constitutionalCertificationResult.record.replaySafe
    && input.recommendationLineageResult.replayLineage.replayCertified
  ) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "PROPOSAL_REPLAY_SNAPSHOT_MISSING",
    message: "Proposal replay binding could not be historically certified.",
    path: "replay",
  }]);
}
