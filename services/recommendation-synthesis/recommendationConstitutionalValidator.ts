import { validateRecommendationSynthesisInput } from "./recommendationInputValidator";
import type {
  RecommendationSynthesisError,
  RecommendationSynthesisInput,
} from "./types/recommendationSynthesisTypes";

export function validateRecommendationConstitutionalBoundaries(
  input: RecommendationSynthesisInput,
): readonly RecommendationSynthesisError[] {
  return validateRecommendationSynthesisInput(input);
}
