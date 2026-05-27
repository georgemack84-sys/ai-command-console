import type { RecommendationIntegrityInspection, RecommendationIntegrityState } from "@/types/recommendation-integrity";
import { hashRecommendationIntegrityValue } from "@/services/recommendation-integrity/deterministicRecommendationHasher";

export function inspectRecommendationIntegrity(input: {
  recommendationId: string;
  coordinationId: string;
  recommendationState: RecommendationIntegrityState;
}): RecommendationIntegrityInspection {
  const base = Object.freeze(input);
  return Object.freeze({
    ...base,
    inspectionHash: hashRecommendationIntegrityValue("integrity-inspection", base),
  });
}
