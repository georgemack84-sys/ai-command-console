import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationApprovalDependencies(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  if (!input.decisionReadinessCertificationResult.certification.approvalDependencyReplayVerified) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_APPROVAL_INVALID",
      message: "Approval dependency replay must remain certified.",
      path: "decisionReadinessCertificationResult.certification.approvalDependencyReplayVerified",
    }]);
  }

  if (input.proposalIntegrityResult.proposal.approvalDependencyIds.length === 0) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_APPROVAL_INVALID",
      message: "At least one approval dependency is required.",
      path: "proposalIntegrityResult.proposal.approvalDependencyIds",
    }]);
  }

  return Object.freeze([]);
}
