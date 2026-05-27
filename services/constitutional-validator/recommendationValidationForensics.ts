import type { RecommendationValidationForensicExport } from "./types/recommendationValidationTypes";
import { hashValidationAuditValue } from "./validationAuditHashEngine";

export function exportRecommendationValidationForensics(input: {
  recommendationId: string;
  validationHash: string;
  replayHash: string;
  auditHash: string;
  lineageHash: string;
}): RecommendationValidationForensicExport {
  return Object.freeze({
    exportId: hashValidationAuditValue("recommendation-validation-forensics-id", {
      recommendationId: input.recommendationId,
    }),
    recommendationId: input.recommendationId,
    validationHash: input.validationHash,
    replayHash: input.replayHash,
    auditHash: input.auditHash,
    lineageHash: input.lineageHash,
    exportHash: hashValidationAuditValue("recommendation-validation-forensics", input),
  });
}
