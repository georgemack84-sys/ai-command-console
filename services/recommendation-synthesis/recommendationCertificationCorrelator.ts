import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function correlateRecommendationCertification(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  const certification = input.decisionReadinessCertificationResult.certification;
  const errors: RecommendationSynthesisError[] = [];
  if (!certification.replayDeterminismVerified || !certification.failClosedEnforcementVerified) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_CERTIFICATION_INVALID",
      message: "Decision readiness certification must remain replay-deterministic and fail-closed.",
      path: "decisionReadinessCertificationResult.certification",
    });
  }
  if (!certification.hiddenExecutionPreventionVerified) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_HIDDEN_EXECUTION",
      message: "Hidden execution prevention certification is required.",
      path: "decisionReadinessCertificationResult.certification.hiddenExecutionPreventionVerified",
    });
  }
  return Object.freeze(errors);
}
