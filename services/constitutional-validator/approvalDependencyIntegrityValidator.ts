import type { RecommendationValidationError, RecommendationValidationInput, RecommendationValidationStageRecord } from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";

export function validateApprovalDependencyIntegrity(input: RecommendationValidationInput): {
  stage: RecommendationValidationStageRecord;
  errors: readonly RecommendationValidationError[];
} {
  const valid =
    input.recommendationLineageResult.approvalLineage.approvalDependencies.length > 0
    && input.recommendationLineageResult.approvalLineage.operatorInterventions.length > 0
    && input.decisionIntentBoundaryResult.artifact.approvalDependencies.length > 0
    && input.metadata?.approvalAmbiguity !== true;
  const errors = valid
    ? []
    : [{
      code: "RECOMMENDATION_VALIDATION_APPROVAL_DEPENDENCY_INVALID" as const,
      message: "Approval dependency integrity could not be validated.",
      path: "approval",
    }];
  return Object.freeze({
    stage: Object.freeze({
      stage: "approval_dependency",
      passed: valid,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashValidationValue("validation-stage-approval", {
        approvalCount: input.recommendationLineageResult.approvalLineage.approvalDependencies.length,
        interventionCount: input.recommendationLineageResult.approvalLineage.operatorInterventions.length,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
