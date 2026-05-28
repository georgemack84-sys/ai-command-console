import type { ProposalIntegrityError, ProposalIntegrityInput, ProposalLineageBinding } from "./proposalIntegrityStateTypes";

export function detectProposalLineageDrift(input: {
  integrityInput: ProposalIntegrityInput;
  binding: ProposalLineageBinding;
}): readonly ProposalIntegrityError[] {
  if (
    input.integrityInput.metadata?.lineageHashMismatch === true
    || input.integrityInput.metadata?.syntheticAncestry === true
    || !input.binding.lineageBound
  ) {
    return Object.freeze([{
      code: "PROPOSAL_LINEAGE_HASH_MISMATCH",
      message: "Proposal lineage drift or synthetic ancestry was detected.",
      path: "recommendationLineageHash",
    }]);
  }
  return Object.freeze([]);
}
