import type {
  CorrelationResult,
  IntentCorrelationError,
  IntentCorrelationRelationship,
} from "@/types/intent-correlation-engine";
import { createCorrelationError } from "./correlationErrors";

export function validateCorrelationContainment(input: {
  relationships: readonly IntentCorrelationRelationship[];
  result?: CorrelationResult;
  metadata?: Readonly<Record<string, unknown>>;
}): readonly IntentCorrelationError[] {
  const errors: IntentCorrelationError[] = [];
  const forbiddenKeys = Object.keys(input.metadata ?? {}).filter((key) =>
    /execute|dispatch|schedule|workflow|activate|nextaction|actionplan|runtimeplan|orchestrationplan|autoapprove|inheritedapproval|authoritychain|dependencyactivation/i.test(key));

  if (forbiddenKeys.length > 0) {
    errors.push(createCorrelationError("PHASE_4_6B_CORRELATION_EXECUTION_LEAKAGE_REJECTED", "Forbidden operational metadata detected in correlation input.", "metadata"));
  }
  for (const relationship of input.relationships) {
    if (relationship.boundary.executionAuthority !== false) {
      errors.push(createCorrelationError("PHASE_4_6B_CORRELATION_EXECUTION_LEAKAGE_REJECTED", "Correlation relationships can never carry execution authority.", `relationships.${relationship.correlationId}`));
    }
    if (relationship.boundary.orchestrationAuthority !== false) {
      errors.push(createCorrelationError("PHASE_4_6B_CORRELATION_ORCHESTRATION_LEAKAGE_REJECTED", "Correlation relationships can never carry orchestration authority.", `relationships.${relationship.correlationId}`));
    }
  }
  if (input.result && input.result.boundary.workflowSynthesis !== false) {
    errors.push(createCorrelationError("PHASE_4_6B_CORRELATION_WORKFLOW_SYNTHESIS_REJECTED", "Correlation results can never synthesize workflows.", "result.boundary.workflowSynthesis"));
  }

  return Object.freeze(errors);
}
