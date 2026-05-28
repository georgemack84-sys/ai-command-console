import type { RecommendationValidationError, RecommendationValidationInput, RecommendationValidationStageRecord } from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";

export function checkGovernanceCompliance(input: RecommendationValidationInput): {
  stage: RecommendationValidationStageRecord;
  errors: readonly RecommendationValidationError[];
} {
  const passed =
    input.constitutionalCertificationResult.record.governanceBound
    && input.constitutionalReadinessResult.record.governanceBound
    && input.humanSupremacyResult.record.governanceBound;
  const errors = passed
    ? []
    : [{
      code: "RECOMMENDATION_VALIDATION_GOVERNANCE_INVALID" as const,
      message: "Governance compliance chain is incomplete.",
      path: "governance",
    }];
  return Object.freeze({
    stage: Object.freeze({
      stage: "governance_compliance",
      passed,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashValidationValue("validation-stage-governance", {
        passed,
        governanceSnapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
