import type {
  Recommendation,
  RecommendationRationale,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";
import { hashRecommendationValue } from "./recommendationHashEngine";

export function generateRecommendationRationale(input: {
  synthesisInput: RecommendationSynthesisInput;
  recommendation: Recommendation;
}): RecommendationRationale {
  const reasonCodes = Object.freeze([
    input.synthesisInput.decisionReadinessCertificationResult.certification.replayDeterminismVerified ? "replay_certified" : "replay_unverified",
    input.synthesisInput.decisionReadinessCertificationResult.certification.governanceLineageVerified ? "governance_certified" : "governance_uncertain",
    input.synthesisInput.proposalIntegrityResult.proposal.approvalDependencyIds.length > 0 ? "approval_required" : "approval_optional",
    input.synthesisInput.hiddenExecutionDetectionResult.report.blocked ? "hidden_execution_detected" : "hidden_execution_absent",
  ]);

  return Object.freeze({
    rationaleId: `${input.recommendation.recommendationId}:rationale`,
    summary: input.recommendation.summary,
    rationale: input.recommendation.rationale,
    reasonCodes,
    rationaleHash: hashRecommendationValue("recommendation-synthesis-rationale", {
      summary: input.recommendation.summary,
      rationale: input.recommendation.rationale,
      reasonCodes,
    }),
  });
}
