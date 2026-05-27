import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function detectOrchestrationEmergence(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("hiddenorchestration") || normalized.includes("recursivworkflow") || normalized.includes("recursion")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_ORCHESTRATION_EMERGENCE",
      message: "Orchestration emergence markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
