import { shouldRecommendationFailClosed } from "@/services/recommendation-synthesis/recommendationFailClosedController";
import type { EvidenceAggregationError } from "./types/evidenceAggregationTypes";

export function shouldEvidenceFailClosed(
  errors: readonly EvidenceAggregationError[],
): boolean {
  return shouldRecommendationFailClosed(
    errors.map((error) => ({
      code: "RECOMMENDATION_SYNTHESIS_FAIL_CLOSED" as const,
      message: error.message,
      path: error.path,
    })),
  );
}
