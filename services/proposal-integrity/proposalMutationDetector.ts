import type { OperationalProposal } from "./operationalProposal";
import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function detectProposalMutation(input: {
  proposal: OperationalProposal;
  integrityInput: ProposalIntegrityInput;
}): readonly ProposalIntegrityError[] {
  if (
    input.integrityInput.metadata?.mutationAfterSeal === true
    || (
      input.integrityInput.existingSealedProposal
      && input.integrityInput.existingSealedProposal.proposalId === input.proposal.proposalId
      && input.integrityInput.existingSealedProposal.proposalHash !== input.proposal.proposalHash
    )
  ) {
    return Object.freeze([{
      code: "PROPOSAL_MUTATION_AFTER_SEAL_BLOCKED",
      message: "Proposal mutation after sealing is forbidden.",
      path: "proposalHash",
    }]);
  }
  return Object.freeze([]);
}
