import type { RecommendationAdmissibilityResult, RecommendationValidationSnapshot } from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";

export function buildValidationSnapshot(result: RecommendationAdmissibilityResult): RecommendationValidationSnapshot {
  return Object.freeze({
    snapshotId: hashValidationValue("recommendation-validation-snapshot-id", {
      recommendationId: result.recommendationId,
      validationHash: result.validationHash,
    }),
    recommendationId: result.recommendationId,
    governanceSnapshotId: result.governanceSnapshotId,
    replaySnapshotId: result.replaySnapshotId,
    validationHash: result.validationHash,
    snapshotHash: hashValidationValue("recommendation-validation-snapshot", result),
  });
}
