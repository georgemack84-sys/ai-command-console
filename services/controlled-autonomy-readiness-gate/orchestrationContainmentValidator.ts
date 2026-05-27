import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateOrchestrationContainment(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("hiddenorchestration") || normalized.includes("orchestrationmarker")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_ORCHESTRATION_CONTAINMENT_FAILED",
      message: "Hidden orchestration markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
