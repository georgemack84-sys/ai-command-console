import type { RecommendationDriftInspection } from "@/types/governance-drift";
import { hashGovernanceDriftValue } from "@/services/governance-drift-detection/deterministicDriftHasher";

export function inspectRecommendationDrift(input: {
  recommendationId: string;
  recommendationState: string;
  recommendationLinked: boolean;
}): RecommendationDriftInspection {
  return Object.freeze({
    ...input,
    inspectionHash: hashGovernanceDriftValue("recommendation-drift-inspection", input),
  });
}
