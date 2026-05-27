import type { GovernanceBindingInput, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function validateGovernanceBindingRevocation(
  input: GovernanceBindingInput,
): readonly ProposalGovernanceBindingError[] {
  if (input.proposalRevocationResult.status === "FAILED_CLOSED") {
    return Object.freeze([{
      code: "PROPOSAL_GOVERNANCE_BINDING_FAIL_CLOSED",
      message: "Proposal revocation already failed closed, so governance binding must preserve containment.",
      path: "proposalRevocationResult.status",
    }]);
  }

  return Object.freeze([]);
}
