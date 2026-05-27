import type { OperatorAuthorityError, OperatorAuthorityInput, OperatorAuthorityStageRecord } from "./types/operatorAuthorityTypes";
import { hashOverrideReplayValue } from "./overrideReplayHashEngine";

export function validateOperatorSupremacy(input: OperatorAuthorityInput): {
  stage: OperatorAuthorityStageRecord;
  errors: readonly OperatorAuthorityError[];
} {
  const result = input.recommendationValidationResult.result;
  const valid =
    result.advisoryOnly
    && !result.executable
    && !result.executionAuthorized
    && result.operatorReviewRequired
    && input.humanSupremacyResult.overridePropagation.globallyPropagated;
  const errors = valid
    ? []
    : [{
      code: "OPERATOR_AUTHORITY_SUPREMACY_BROKEN" as const,
      message: "Operator supremacy compatibility could not be established.",
      path: "recommendationValidationResult",
    }];
  return Object.freeze({
    stage: Object.freeze({
      stage: "operator_supremacy_validation",
      passed: valid,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashOverrideReplayValue("operator-supremacy-stage", {
        recommendationId: result.recommendationId,
        admissibility: result.admissibility,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
