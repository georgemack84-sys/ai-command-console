import type { RecommendationValidationError, RecommendationValidationInput, RecommendationValidationStageRecord } from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";

export function validateCapabilityContainment(input: RecommendationValidationInput): {
  stage: RecommendationValidationStageRecord;
  errors: readonly RecommendationValidationError[];
} {
  const artifact = input.decisionIntentBoundaryResult.artifact;
  const valid =
    artifact.advisoryOnly
    && !artifact.executable
    && !artifact.executionAuthorized
    && !artifact.orchestrationAllowed
    && !artifact.runtimeMutationAllowed
    && !artifact.authorityMutationAllowed
    && !artifact.governanceMutationAllowed
    && !artifact.schedulerRegistrationAllowed
    && artifact.operatorReviewRequired
    && input.metadata?.runtimeLinked !== true;
  const errors = valid
    ? []
    : [{
      code: "RECOMMENDATION_VALIDATION_CONTAINMENT_INVALID" as const,
      message: "Capability containment validation failed.",
      path: "artifact",
    }];
  return Object.freeze({
    stage: Object.freeze({
      stage: "capability_containment",
      passed: valid,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashValidationValue("validation-stage-containment", {
        intentId: artifact.intentId,
        containmentVerified: artifact.constitutionalBoundaryState.containmentVerified,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
