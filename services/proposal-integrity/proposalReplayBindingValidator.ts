import type { ProposalIntegrityError, ProposalReplayBinding } from "./proposalIntegrityStateTypes";

export function validateProposalReplayBinding(
  binding: ProposalReplayBinding,
): readonly ProposalIntegrityError[] {
  if (binding.replaySnapshotId && binding.replayBound && binding.historicalOnly) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "PROPOSAL_REPLAY_SNAPSHOT_MISSING",
    message: "Replay snapshot binding is incomplete.",
    path: "replaySnapshotId",
  }]);
}
