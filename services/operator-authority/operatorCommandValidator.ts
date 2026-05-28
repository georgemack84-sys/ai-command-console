import { OPERATOR_CONTROL_TERMS } from "./constants/operatorControlTerms";
import type { OperatorAuthorityError, OperatorAuthorityInput, OperatorAuthorityStageRecord } from "./types/operatorAuthorityTypes";
import { hashOverrideReplayValue } from "./overrideReplayHashEngine";

export function validateOperatorCommand(input: OperatorAuthorityInput): {
  stage: OperatorAuthorityStageRecord;
  errors: readonly OperatorAuthorityError[];
} {
  const validatedRecommendation = input.recommendationValidationResult.result;
  const valid =
    !!input.actionId
    && !!input.operatorId
    && OPERATOR_CONTROL_TERMS.includes(input.actionType)
    && input.targetIds.length > 0
    && input.scopeBoundaryIds.length > 0
    && validatedRecommendation.advisoryOnly
    && !validatedRecommendation.executionAuthorized
    && !validatedRecommendation.executable
    && validatedRecommendation.operatorReviewRequired;
  const errors = valid
    ? []
    : [{
      code: "OPERATOR_AUTHORITY_COMMAND_INVALID" as const,
      message: "Operator authority command is incomplete or invalid.",
      path: "command",
    }];
  return Object.freeze({
    stage: Object.freeze({
      stage: "operator_command_validation",
      passed: valid,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashOverrideReplayValue("operator-command-stage", {
        actionId: input.actionId,
        actionType: input.actionType,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
