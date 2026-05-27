import type {
  ExecutionSemanticDetection,
  RecommendationValidationError,
  RecommendationValidationInput,
  RecommendationValidationStageRecord,
} from "./types/recommendationValidationTypes";
import { hashValidationValue } from "./validationHashEngine";
import { detectHiddenExecution } from "./hiddenExecutionDetector";
import { detectOrchestrationSemantics } from "./orchestrationSemanticDetector";
import { detectSchedulerSemantics } from "./schedulerSemanticDetector";
import { detectRecommendationAuthorityExpansion } from "./authorityExpansionDetector";
import { detectRecursiveCoordination } from "./recursiveCoordinationDetector";

export function validateNonExecutionGuarantee(input: RecommendationValidationInput): {
  stage: RecommendationValidationStageRecord;
  detections: readonly ExecutionSemanticDetection[];
  errors: readonly RecommendationValidationError[];
} {
  const detections = Object.freeze([
    detectHiddenExecution(input),
    detectOrchestrationSemantics(input),
    detectSchedulerSemantics(input),
    detectRecommendationAuthorityExpansion(input),
    detectRecursiveCoordination(input),
  ]);
  const errors: RecommendationValidationError[] = [];
  for (const detection of detections) {
    if (!detection.detected) continue;
    const code =
      detection.semanticType === "EXECUTION_DISPATCH" ? "RECOMMENDATION_VALIDATION_EXECUTION_RISK"
      : detection.semanticType === "ORCHESTRATION_TRIGGER" ? "RECOMMENDATION_VALIDATION_ORCHESTRATION_SEMANTICS"
      : detection.semanticType === "SCHEDULER_PAYLOAD" ? "RECOMMENDATION_VALIDATION_SCHEDULER_SEMANTICS"
      : detection.semanticType === "AUTHORITY_ESCALATION" ? "RECOMMENDATION_VALIDATION_AUTHORITY_EXPANSION"
      : "RECOMMENDATION_VALIDATION_RECURSIVE_COORDINATION";
    errors.push({
      code,
      message: `Detected forbidden semantic type: ${detection.semanticType}.`,
      path: "summary",
    });
  }
  return Object.freeze({
    stage: Object.freeze({
      stage: "non_execution_guarantee",
      passed: errors.length === 0,
      reasons: Object.freeze(errors.map((error) => error.code)),
      deterministicHash: hashValidationValue("validation-stage-non-execution", {
        detections: detections.map((detection) => ({
          type: detection.semanticType,
          detected: detection.detected,
        })),
      }),
    }),
    detections,
    errors: Object.freeze(errors),
  });
}
