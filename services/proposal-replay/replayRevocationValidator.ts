import type { ProposalReplayInput, ProposalReplayError } from "./replayTypes";

export function validateReplayRevocationState(
  input: ProposalReplayInput,
): readonly ProposalReplayError[] {
  if (input.proposalRevocationResult.status === "FAILED_CLOSED") {
    return Object.freeze([{
      code: "PROPOSAL_REPLAY_FAIL_CLOSED",
      message: "Proposal replay cannot proceed because revocation containment already failed closed.",
      path: "proposalRevocationResult.status",
    } satisfies ProposalReplayError]);
  }

  if (input.proposalRevocationResult.status === "CASCADE_COMPLETED") {
    return Object.freeze([{
      code: "PROPOSAL_REPLAY_REVOKED",
      message: "Proposal replay must preserve active revocation containment.",
      path: "proposalRevocationResult.status",
    } satisfies ProposalReplayError]);
  }

  return Object.freeze([]);
}
