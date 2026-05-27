import { RECOMMENDATION_SYNTHESIS_FORBIDDEN_TERMS } from "./recommendationSynthesisContracts";
import type {
  Recommendation,
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function detectRecommendationHiddenExecution(input: {
  synthesisInput: RecommendationSynthesisInput;
  recommendation: Recommendation;
}): readonly RecommendationSynthesisError[] {
  const errors: RecommendationSynthesisError[] = [];
  if (input.synthesisInput.hiddenExecutionDetectionResult.report.blocked) {
    errors.push({
      code: "RECOMMENDATION_SYNTHESIS_HIDDEN_EXECUTION",
      message: "Upstream hidden execution detection blocked synthesis input.",
      path: "hiddenExecutionDetectionResult.report.blocked",
    });
  }

  const haystack = `${input.recommendation.summary} ${input.recommendation.rationale}`.toLowerCase();
  for (const term of RECOMMENDATION_SYNTHESIS_FORBIDDEN_TERMS) {
    if (haystack.includes(term)) {
      errors.push({
        code: "RECOMMENDATION_SYNTHESIS_HIDDEN_EXECUTION",
        message: `Recommendation text contains forbidden execution semantic: ${term}.`,
        path: "recommendation.summary",
      });
    }
  }
  return Object.freeze(errors);
}
