import type { RecommendationValidationEvidence, RecommendationValidationInput } from "./types/recommendationValidationTypes";
import { hashValidationAuditValue } from "./validationAuditHashEngine";

export function generateValidationEvidence(input: {
  validationInput: RecommendationValidationInput;
  reasons: readonly string[];
}): RecommendationValidationEvidence {
  const evidenceRefs = Object.freeze([
    input.validationInput.decisionIntentBoundaryResult.artifact.intentId,
    input.validationInput.recommendationLineageResult.artifact.lineageId,
    input.validationInput.constitutionalReadinessResult.record.governanceSnapshotId,
    input.validationInput.constitutionalReadinessResult.record.replaySnapshotId,
  ]);
  return Object.freeze({
    evidenceId: hashValidationAuditValue("recommendation-validation-evidence-id", {
      recommendationId: input.validationInput.recommendationId,
    }),
    recommendationId: input.validationInput.recommendationId,
    evidenceRefs,
    reasons: Object.freeze(input.reasons),
    evidenceHash: hashValidationAuditValue("recommendation-validation-evidence", {
      recommendationId: input.validationInput.recommendationId,
      evidenceRefs,
      reasons: input.reasons,
    }),
  });
}
