import type { AuthorityBoundary } from "@/services/proposal-governance-binding/governanceBindingTypes";
import type { ProposalReplayError } from "./replayTypes";

export function validateReplayAuthorityBoundary(
  boundary: AuthorityBoundary,
): readonly ProposalReplayError[] {
  const errors: ProposalReplayError[] = [];

  if (
    boundary.executionAllowed !== false
    || boundary.schedulingAllowed !== false
    || boundary.runtimeMutationAllowed !== false
  ) {
    errors.push({
      code: "PROPOSAL_REPLAY_AUTHORITY_MISMATCH",
      message: "Proposal replay detected authority expansion beyond immutable historical ceilings.",
      path: "proposalGovernanceBindingResult.authorityBoundary",
    });
  }

  const scopes = JSON.stringify({
    allowedScopes: boundary.allowedScopes,
    forbiddenScopes: boundary.forbiddenScopes,
  }).toLowerCase();
  if (scopes.includes("execute") || scopes.includes("schedule") || scopes.includes("mutate")) {
    errors.push({
      code: "PROPOSAL_REPLAY_AUTHORITY_MISMATCH",
      message: "Proposal replay detected forbidden execution, scheduling, or mutation scope in the authority boundary.",
      path: "proposalGovernanceBindingResult.authorityBoundary.allowedScopes",
    });
  }

  return Object.freeze(errors);
}
