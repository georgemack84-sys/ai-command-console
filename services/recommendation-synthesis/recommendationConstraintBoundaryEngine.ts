import { hashRecommendationValue } from "./recommendationHashEngine";
import type { RecommendationSynthesisInput } from "./types/recommendationSynthesisTypes";

export function buildRecommendationConstraintBoundary(input: RecommendationSynthesisInput) {
  const approvalRequired = input.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0;
  const escalationAllowed =
    input.decisionReadinessCertificationResult.certification.operatorSupremacyVerified &&
    input.operatorAuthorityResult.action.actionType !== "DENY" &&
    input.operatorAuthorityResult.action.actionType !== "REVOKE" &&
    input.operatorAuthorityResult.action.actionType !== "KILL_SWITCH";

  return Object.freeze({
    constraintProfileId: `${input.synthesisId}:constraint-profile`,
    approvalRequired,
    escalationAllowed,
    boundaryHash: hashRecommendationValue("recommendation-synthesis-constraint-boundary", {
      approvalRequired,
      escalationAllowed,
    }),
  });
}
