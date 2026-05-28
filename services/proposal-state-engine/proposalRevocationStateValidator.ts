import type { ProposalStateError } from "./types/proposalStateTypes";

export function validateProposalRevocationState(input: {
  currentState: string;
  targetState: string;
}): readonly ProposalStateError[] {
  if (input.currentState === "revoked" && input.targetState !== "archived") {
    return Object.freeze([{
      code: "PROPOSAL_STATE_REVOKED" as const,
      message: "Revoked proposals may only transition to archived.",
      path: "transition.targetState",
    }]);
  }

  if (input.currentState === "archived") {
    return Object.freeze([{
      code: "PROPOSAL_STATE_ARCHIVED" as const,
      message: "Archived proposals may not transition further.",
      path: "transition.targetState",
    }]);
  }

  return Object.freeze([]);
}
