import { buildRecommendationFreeze } from "@/services/recommendation-synthesis/recommendationFreezeEngine";
import { hashEvidenceValue } from "./evidenceHashEngine";
import type { EvidenceAggregationError, EvidenceAggregationFreezeRecord } from "./types/evidenceAggregationTypes";

export function buildEvidenceFreeze(
  errors: readonly EvidenceAggregationError[],
): EvidenceAggregationFreezeRecord {
  const recommendationFreeze = buildRecommendationFreeze(
    errors.map((error) => ({
      code: "RECOMMENDATION_SYNTHESIS_FAIL_CLOSED" as const,
      message: error.message,
      path: error.path,
    })),
  );
  return Object.freeze({
    frozen: recommendationFreeze.frozen,
    escalated: recommendationFreeze.escalated,
    reasons: Object.freeze(errors.map((error) => error.code)),
    freezeHash: hashEvidenceValue("evidence-freeze", {
      recommendationFreezeHash: recommendationFreeze.freezeHash,
      errors: errors.map((error) => error.code),
    }),
  });
}
