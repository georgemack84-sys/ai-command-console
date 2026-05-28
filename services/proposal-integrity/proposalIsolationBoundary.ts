import type { OperationalProposal } from "./operationalProposal";
import type { ProposalIntegrityError } from "./proposalIntegrityStateTypes";

export function validateProposalIsolationBoundary(
  proposal: OperationalProposal,
): readonly ProposalIntegrityError[] {
  return proposal.advisoryOnly
    && !proposal.executable
    && !proposal.executionAuthorized
    && !proposal.orchestrationAllowed
    ? Object.freeze([])
    : Object.freeze([{
      code: "PROPOSAL_EXECUTION_AUTHORIZATION_NOT_FALSE",
      message: "Proposal isolation boundary was violated.",
      path: "proposal.flags",
    }]);
}
