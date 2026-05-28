import type { AuthorityBoundary, ProposalGovernanceBindingError } from "./governanceBindingTypes";

export function validateAuthorityBinding(boundary: AuthorityBoundary): readonly ProposalGovernanceBindingError[] {
  const errors: ProposalGovernanceBindingError[] = [];

  if (
    boundary.executionAllowed !== false
    || boundary.schedulingAllowed !== false
    || boundary.runtimeMutationAllowed !== false
  ) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_AUTHORITY_EXPANSION",
      message: "Authority boundary attempted to grant execution, scheduling, or runtime mutation capability.",
      path: "authorityBoundary",
    });
  }

  if (!["NONE", "RECOMMENDATION", "PROPOSAL", "REVIEW_ONLY"].includes(boundary.maxAuthorityLevel)) {
    errors.push({
      code: "PROPOSAL_GOVERNANCE_BINDING_AUTHORITY_EXPANSION",
      message: "Authority boundary declared an unsupported authority level.",
      path: "authorityBoundary.maxAuthorityLevel",
    });
  }

  return Object.freeze(errors);
}
