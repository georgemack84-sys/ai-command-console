import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateProposalAuthorityFirewall(
  input: ProposalIntegrityInput,
): readonly ProposalIntegrityError[] {
  if (
    input.metadata?.authorityExpansion === true
    || input.metadata?.authorityCrossover === true
  ) {
    return Object.freeze([{
      code: "PROPOSAL_AUTHORITY_EXPANSION_DETECTED",
      message: "Authority expansion or crossover is forbidden in proposals.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
