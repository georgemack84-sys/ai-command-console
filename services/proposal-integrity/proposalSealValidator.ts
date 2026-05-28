import type { OperationalProposal } from "./operationalProposal";
import type { ProposalIntegrityError } from "./proposalIntegrityStateTypes";

export function validateProposalSeal(proposal: OperationalProposal): readonly ProposalIntegrityError[] {
  if (
    proposal.advisoryOnly
    && !proposal.executable
    && !proposal.executionAuthorized
    && !proposal.orchestrationAllowed
    && !proposal.runtimeMutationAllowed
    && !proposal.authorityMutationAllowed
    && !proposal.governanceMutationAllowed
    && !proposal.schedulerRegistrationAllowed
    && proposal.operatorReviewRequired
  ) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "PROPOSAL_EXECUTION_AUTHORIZATION_NOT_FALSE",
    message: "Proposal sealing requires immutable non-executable constitutional flags.",
    path: "proposal.flags",
  }]);
}
