import type { ProposalRevocationError, ProposalRevocationInput } from "./proposalRevocationTypes";

export function validateProposalRevocationReplay(
  input: ProposalRevocationInput,
): readonly ProposalRevocationError[] {
  const errors: ProposalRevocationError[] = [];
  const request = input.request.replaySnapshotId;
  const expected = input.proposalIntegrityResult.proposal.replaySnapshotId;
  const replayStatus = input.recommendationReplayResult.status;

  if (!request) {
    errors.push({
      code: "PROPOSAL_REVOCATION_REPLAY_SNAPSHOT_MISSING",
      message: "Revocation requires an explicit replay snapshot.",
      path: "request.replaySnapshotId",
    });
  }

  if (request !== expected) {
    errors.push({
      code: "PROPOSAL_REVOCATION_REPLAY_AMBIGUITY",
      message: "Replay snapshot drift prevents deterministic revocation reconstruction.",
      path: "request.replaySnapshotId",
    });
  }

  if (replayStatus !== "COMPLETED") {
    errors.push({
      code: "PROPOSAL_REVOCATION_REPLAY_AMBIGUITY",
      message: "Replay lineage is not in a stable reconstructive state.",
      path: "recommendationReplayResult.status",
    });
  }

  return Object.freeze(errors);
}
