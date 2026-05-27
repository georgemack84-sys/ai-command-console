import type {
  PrioritizationError,
  RecommendationPrioritizationInput,
  RecommendationPriorityInput,
} from "./types/prioritizationTypes";

function validateInputFlags(input: RecommendationPriorityInput): PrioritizationError[] {
  const errors: PrioritizationError[] = [];
  if (input.executionAuthorized !== false
    || input.runtimeMutationAllowed !== false
    || input.schedulingAllowed !== false
    || input.authorityMutationAllowed !== false) {
    errors.push({
      code: "PRIORITIZATION_INVALID_AUTHORITY_FLAGS",
      message: "Prioritization inputs may not declare execution, mutation, scheduling, or authority mutation.",
      path: `inputs.${input.recommendationId}.flags`,
    });
  }
  return errors;
}

export function validatePrioritizationContracts(
  input: RecommendationPrioritizationInput,
): PrioritizationError[] {
  const errors: PrioritizationError[] = [];
  if (!input.prioritizationRunId) {
    errors.push({
      code: "PRIORITIZATION_INVALID_INPUT",
      message: "Prioritization run ID is required.",
      path: "prioritizationRunId",
    });
  }

  for (const candidate of input.inputs) {
    if (!candidate.prioritizationId || !candidate.recommendationId) {
      errors.push({
        code: "PRIORITIZATION_INVALID_INPUT",
        message: "Prioritization and recommendation IDs are required.",
        path: `inputs.${candidate.recommendationId || "unknown"}`,
      });
    }
    if (!candidate.governanceSnapshotId) {
      errors.push({
        code: "PRIORITIZATION_MISSING_GOVERNANCE_SNAPSHOT",
        message: "Governance snapshot ID is required.",
        path: `inputs.${candidate.recommendationId}.governanceSnapshotId`,
      });
    }
    if (!candidate.replaySnapshotId) {
      errors.push({
        code: "PRIORITIZATION_MISSING_REPLAY_SNAPSHOT",
        message: "Replay snapshot ID is required.",
        path: `inputs.${candidate.recommendationId}.replaySnapshotId`,
      });
    }
    if (!candidate.confidenceScoreId) {
      errors.push({
        code: "PRIORITIZATION_MISSING_CONFIDENCE_SCORE",
        message: "Confidence score ID is required.",
        path: `inputs.${candidate.recommendationId}.confidenceScoreId`,
      });
    }
    if (!candidate.constraintEvaluationId) {
      errors.push({
        code: "PRIORITIZATION_MISSING_CONSTRAINT_EVALUATION",
        message: "Constraint evaluation reference is required.",
        path: `inputs.${candidate.recommendationId}.constraintEvaluationId`,
      });
    }
    errors.push(...validateInputFlags(candidate));
  }

  return errors;
}
