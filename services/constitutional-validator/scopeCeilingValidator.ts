import type { RecommendationValidationError, RecommendationValidationInput, RecommendationValidationStageRecord } from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";

export function validateScopeCeilings(input: RecommendationValidationInput): {
  stage: RecommendationValidationStageRecord;
  errors: readonly RecommendationValidationError[];
} {
  const scopeInvalid =
    input.metadata?.scopeExpansion === true
    || input.metadata?.widenAuthority === true
    || input.decisionIntentBoundaryResult.artifact.intentType === "bounded_plan" && input.decisionIntentBoundaryResult.artifact.risk.level === "critical";
  const errors = scopeInvalid
    ? [{
      code: "RECOMMENDATION_VALIDATION_SCOPE_CEILING_BREACH" as const,
      message: "Scope ceiling breach or widening authority marker detected.",
      path: "scope",
    }]
    : [];
  return Object.freeze({
    stage: Object.freeze({
      stage: "scope_ceiling",
      passed: errors.length === 0,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashValidationValue("validation-stage-scope", {
        scopeCount: input.decisionIntentBoundaryResult.artifact.proposalLineage.length,
        scopeInvalid,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
