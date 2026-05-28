import type { ProposalLifecycleState } from "./types/proposalStateTypes";

export const PROPOSAL_TRANSITION_MATRIX: Readonly<Record<ProposalLifecycleState, readonly ProposalLifecycleState[]>> = Object.freeze({
  generated: ["validated", "frozen", "revoked", "archived"] as const,
  validated: ["governed", "frozen", "revoked", "archived"] as const,
  governed: ["reviewed", "frozen", "revoked", "disputed", "archived"] as const,
  reviewed: ["approved", "denied", "frozen", "revoked", "disputed", "archived"] as const,
  approved: ["archived", "revoked", "frozen"] as const,
  denied: ["archived", "revoked"] as const,
  frozen: ["archived", "revoked", "disputed"] as const,
  revoked: ["archived"] as const,
  disputed: ["frozen", "revoked", "archived"] as const,
  archived: [] as const,
});

export function isProposalTransitionAllowed(
  sourceState: ProposalLifecycleState,
  targetState: ProposalLifecycleState,
): boolean {
  return PROPOSAL_TRANSITION_MATRIX[sourceState].includes(targetState);
}
