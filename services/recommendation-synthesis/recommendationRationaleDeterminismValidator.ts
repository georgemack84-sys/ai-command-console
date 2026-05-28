import { generateRecommendationRationale } from "./recommendationRationaleGenerator";
import type {
  Recommendation,
  RecommendationRationale,
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationRationaleDeterminism(input: {
  synthesisInput: RecommendationSynthesisInput;
  recommendation: Recommendation;
  rationaleRecord: RecommendationRationale;
}): readonly RecommendationSynthesisError[] {
  const replayed = generateRecommendationRationale({
    synthesisInput: input.synthesisInput,
    recommendation: input.recommendation,
  });
  if (replayed.rationaleHash !== input.rationaleRecord.rationaleHash) {
    return Object.freeze([{
      code: "RECOMMENDATION_SYNTHESIS_DETERMINISM_INSTABILITY",
      message: "Recommendation rationale is not deterministic.",
      path: "rationaleRecord.rationaleHash",
    }]);
  }
  return Object.freeze([]);
}
