import type { ProposalIntegrityError, ProposalIntegrityInput } from "./proposalIntegrityStateTypes";

export function validateProposalContainmentBoundary(
  input: ProposalIntegrityInput,
): readonly ProposalIntegrityError[] {
  if (
    input.metadata?.containmentWeakening === true
    || input.constitutionalCertificationResult.record.failClosed
    || !input.decisionIntentBoundaryResult.artifact.operatorReviewRequired
  ) {
    return Object.freeze([{
      code: "PROPOSAL_RUNTIME_LINKAGE_DETECTED",
      message: "Proposal containment boundary was violated or weakened.",
      path: "containment",
    }]);
  }
  return Object.freeze([]);
}
