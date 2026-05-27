import { hashRecommendationValue } from "./recommendationHashEngine";
import type { RecommendationSynthesisInput } from "./types/recommendationSynthesisTypes";

export function bindRecommendationVersion(input: RecommendationSynthesisInput) {
  return Object.freeze({
    constitutionalVersion: input.constitutionalVersion,
    validatorVersionId: input.validatorVersionId,
    versionHash: hashRecommendationValue("recommendation-synthesis-version", {
      constitutionalVersion: input.constitutionalVersion,
      validatorVersionId: input.validatorVersionId,
    }),
  });
}
