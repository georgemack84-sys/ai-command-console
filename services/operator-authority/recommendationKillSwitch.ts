import type { OperatorAuthorityInput, RecommendationSuppressionRecord } from "./types/operatorAuthorityTypes";
import { hashOverrideAuditValue } from "./overrideAuditHashEngine";

export function buildKillSwitchRecord(input: OperatorAuthorityInput): RecommendationSuppressionRecord {
  const suppressed = input.actionType === "KILL_SWITCH";
  return Object.freeze({
    recommendationId: input.recommendationValidationResult.result.recommendationId,
    suppressed,
    continuityInvalidated: suppressed,
    suppressionHash: hashOverrideAuditValue("recommendation-kill-switch", {
      actionType: input.actionType,
      recommendationId: input.recommendationValidationResult.result.recommendationId,
      suppressed,
    }),
  });
}
