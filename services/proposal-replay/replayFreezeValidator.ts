import type { ProposalReplayInput, ProposalReplayError } from "./replayTypes";

export function validateReplayFreezeState(
  input: ProposalReplayInput,
): readonly ProposalReplayError[] {
  if (input.proposalFreezeResult.status === "FAILED_CLOSED") {
    return Object.freeze([{
      code: "PROPOSAL_REPLAY_FAIL_CLOSED",
      message: "Proposal replay cannot proceed as healthy because freeze containment already failed closed.",
      path: "proposalFreezeResult.status",
    } satisfies ProposalReplayError]);
  }

  if (input.proposalFreezeResult.status === "FROZEN" || input.proposalFreezeResult.status === "PERMANENTLY_FROZEN") {
    return Object.freeze([{
      code: "PROPOSAL_REPLAY_FROZEN",
      message: "Proposal replay must preserve active freeze containment.",
      path: "proposalFreezeResult.status",
    } satisfies ProposalReplayError]);
  }

  return Object.freeze([]);
}
