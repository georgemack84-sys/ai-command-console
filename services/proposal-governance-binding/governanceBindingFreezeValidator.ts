import type { GovernanceBindingInput, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function validateGovernanceBindingFreeze(
  input: GovernanceBindingInput,
): readonly ProposalGovernanceBindingError[] {
  if (input.proposalFreezeResult.status === "FAILED_CLOSED") {
    return Object.freeze([{
      code: "PROPOSAL_GOVERNANCE_BINDING_FAIL_CLOSED",
      message: "Proposal freeze layer already failed closed, so governance binding must not proceed as healthy.",
      path: "proposalFreezeResult.status",
    }]);
  }

  return Object.freeze([]);
}
