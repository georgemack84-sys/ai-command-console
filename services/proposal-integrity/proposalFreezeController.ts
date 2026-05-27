import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateProposalFreeze(input: ProposalIntegrityInput): readonly ProposalIntegrityError[] {
  return input.metadata?.proposalFrozen === true
    ? Object.freeze([{
      code: "PROPOSAL_REPLAY_DRIFT_DETECTED",
      message: "Proposal is frozen pending operator review.",
      path: "metadata.proposalFrozen",
    }])
    : Object.freeze([]);
}
