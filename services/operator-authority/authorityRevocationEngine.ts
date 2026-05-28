import type { OperatorAuthorityInput, RecommendationSuppressionRecord } from "./types/operatorAuthorityTypes";
import { hashOverrideAuditValue } from "./overrideAuditHashEngine";

export function buildAuthorityRevocationRecord(input: OperatorAuthorityInput): RecommendationSuppressionRecord {
  const suppressed = input.actionType === "REVOKE" || input.actionType === "DENY";
  return Object.freeze({
    recommendationId: input.recommendationValidationResult.result.recommendationId,
    suppressed,
    continuityInvalidated: suppressed,
    suppressionHash: hashOverrideAuditValue("authority-revocation", {
      actionType: input.actionType,
      recommendationId: input.recommendationValidationResult.result.recommendationId,
      suppressed,
    }),
  });
}
