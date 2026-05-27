import type { ProposalGovernanceBinding, ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function detectProposalGovernanceDrift(input: {
  integrityInput: ProposalIntegrityInput;
  binding: ProposalGovernanceBinding;
}): readonly ProposalIntegrityError[] {
  if (input.integrityInput.metadata?.governanceSubstitution === true || !input.binding.governanceBound) {
    return Object.freeze([{
      code: "PROPOSAL_GOVERNANCE_DRIFT_DETECTED",
      message: "Governance substitution or drift was detected.",
      path: "governanceBinding",
    }]);
  }
  return Object.freeze([]);
}
