import type {
  ExecutionSemanticDetection,
  RecommendationValidationError,
  RecommendationValidationInput,
  RecommendationValidationStageRecord,
} from "./types/recommendationValidationTypes";
import { checkGovernanceCompliance } from "./governanceComplianceChecker";
import { validateScopeCeilings } from "./scopeCeilingValidator";
import { validateApprovalDependencyIntegrity } from "./approvalDependencyIntegrityValidator";
import { validateReplayReproducibility } from "./replayReproducibilityValidator";
import { validateCapabilityContainment } from "./capabilityContainmentValidator";
import { validateOverrideCompatibility } from "./overrideCompatibilityValidator";
import { validateNonExecutionGuarantee } from "./nonExecutionGuaranteeValidator";

export function runRecommendationValidationPipeline(
  input: RecommendationValidationInput,
): {
  stages: readonly RecommendationValidationStageRecord[];
  detections: readonly ExecutionSemanticDetection[];
  errors: readonly RecommendationValidationError[];
} {
  const governance = checkGovernanceCompliance(input);
  const scope = validateScopeCeilings(input);
  const approval = validateApprovalDependencyIntegrity(input);
  const replay = validateReplayReproducibility(input);
  const containment = validateCapabilityContainment(input);
  const override = validateOverrideCompatibility(input);
  const nonExecution = validateNonExecutionGuarantee(input);

  return Object.freeze({
    stages: Object.freeze([
      governance.stage,
      scope.stage,
      approval.stage,
      replay.stage,
      containment.stage,
      override.stage,
      nonExecution.stage,
    ]),
    detections: nonExecution.detections,
    errors: Object.freeze([
      ...governance.errors,
      ...scope.errors,
      ...approval.errors,
      ...replay.errors,
      ...containment.errors,
      ...override.errors,
      ...nonExecution.errors,
    ]),
  });
}
