import type { RecommendationValidationError, RecommendationValidationInput, RecommendationValidationStageRecord } from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";

export function validateOverrideCompatibility(input: RecommendationValidationInput): {
  stage: RecommendationValidationStageRecord;
  errors: readonly RecommendationValidationError[];
} {
  const valid =
    input.decisionIntentBoundaryResult.artifact.operatorReviewRequired
    && input.humanSupremacyResult.overridePropagation.globallyPropagated
    && input.humanSupremacyResult.killSwitch.scope !== "none"
    && input.metadata?.overrideSuppression !== true;
  const errors = valid
    ? []
    : [{
      code: "RECOMMENDATION_VALIDATION_OVERRIDE_INCOMPATIBLE" as const,
      message: "Override compatibility could not be guaranteed.",
      path: "override",
    }];
  return Object.freeze({
    stage: Object.freeze({
      stage: "override_compatibility",
      passed: valid,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashValidationValue("validation-stage-override", {
        supremacyId: input.humanSupremacyResult.record.supremacyId,
        propagated: input.humanSupremacyResult.overridePropagation.globallyPropagated,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
