import type { OperatorAuthorityInput, RecommendationSuppressionRecord } from "./types/operatorAuthorityTypes";
import { hashOverrideAuditValue } from "./overrideAuditHashEngine";

export function buildRecommendationFreezeRecord(input: OperatorAuthorityInput): RecommendationSuppressionRecord {
  const suppressed = input.actionType === "FREEZE" || input.actionType === "PAUSE" || input.actionType === "KILL_SWITCH";
  return Object.freeze({
    recommendationId: input.recommendationValidationResult.result.recommendationId,
    suppressed,
    continuityInvalidated: suppressed,
    suppressionHash: hashOverrideAuditValue("recommendation-freeze", {
      actionType: input.actionType,
      recommendationId: input.recommendationValidationResult.result.recommendationId,
      suppressed,
    }),
  });
}
