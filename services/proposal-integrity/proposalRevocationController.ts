import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateProposalRevocation(input: ProposalIntegrityInput): readonly ProposalIntegrityError[] {
  return input.metadata?.proposalRevoked === true
    ? Object.freeze([{
      code: "PROPOSAL_REPLAY_HASH_MISMATCH",
      message: "Revoked proposals may not replay successfully.",
      path: "metadata.proposalRevoked",
    }])
    : Object.freeze([]);
}
