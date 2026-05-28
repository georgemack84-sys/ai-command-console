import type { ProposalStateError } from "./types/proposalStateTypes";

export function validateProposalFreezeState(input: {
  currentState: string;
  targetState: string;
}): readonly ProposalStateError[] {
  if (input.currentState !== "frozen") {
    return Object.freeze([]);
  }

  if (input.targetState === "archived" || input.targetState === "revoked" || input.targetState === "disputed") {
    return Object.freeze([]);
  }

  return Object.freeze([{
    code: "PROPOSAL_STATE_FROZEN" as const,
    message: "Frozen proposals may only transition to archived, revoked, or disputed.",
    path: "transition.targetState",
  }]);
}
