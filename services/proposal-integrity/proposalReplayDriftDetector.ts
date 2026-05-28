import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function detectProposalReplayDrift(
  input: ProposalIntegrityInput,
): readonly ProposalIntegrityError[] {
  if (
    input.metadata?.replayDrift === true
    || input.metadata?.replaySubstitution === true
    || input.metadata?.latestGovernanceState === true
  ) {
    return Object.freeze([{
      code: "PROPOSAL_REPLAY_DRIFT_DETECTED",
      message: "Replay drift or present-state substitution was detected.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
