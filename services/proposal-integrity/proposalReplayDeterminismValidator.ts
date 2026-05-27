import type { ProposalIntegrityError, ProposalReplayBinding } from "./proposalIntegrityStateTypes";

export function validateProposalReplayDeterminism(
  binding: ProposalReplayBinding,
): readonly ProposalIntegrityError[] {
  return binding.deterministicHash.length > 0
    ? Object.freeze([])
    : Object.freeze([{
      code: "PROPOSAL_REPLAY_HASH_MISMATCH",
      message: "Replay determinism hash could not be generated.",
      path: "replayHash",
    }]);
}
