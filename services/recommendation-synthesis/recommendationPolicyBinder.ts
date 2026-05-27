import { hashRecommendationValue } from "./recommendationHashEngine";
import type { RecommendationSynthesisInput } from "./types/recommendationSynthesisTypes";

export function bindRecommendationPolicy(input: RecommendationSynthesisInput) {
  const policySnapshotIds = Object.freeze([...input.policySnapshotIds].sort((a, b) => a.localeCompare(b)));
  return Object.freeze({
    policySnapshotIds,
    policyHash: hashRecommendationValue("recommendation-synthesis-policy", policySnapshotIds),
  });
}
