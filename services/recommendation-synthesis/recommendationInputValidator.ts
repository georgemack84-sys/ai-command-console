import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationSynthesisInput(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  const errors: RecommendationSynthesisError[] = [];

  if (!input.synthesisId) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_INVALID_INPUT",
      message: "Synthesis ID is required.",
      path: "synthesisId",
    });
  }
  if (!input.decisionReadinessCertificationResult.certification.recommendationSystemId) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_CERTIFICATION_INVALID",
      message: "Readiness certification must name a recommendation system.",
      path: "decisionReadinessCertificationResult.certification.recommendationSystemId",
    });
  }
  if (input.hiddenExecutionDetectionResult.report.executionAuthorized !== false) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_HIDDEN_EXECUTION",
      message: "Hidden execution inputs must remain permanently non-executing.",
      path: "hiddenExecutionDetectionResult.report.executionAuthorized",
    });
  }

  return Object.freeze(errors);
}
