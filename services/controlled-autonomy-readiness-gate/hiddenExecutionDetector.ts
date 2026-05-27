import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function detectHiddenExecution(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("hiddenexecution") || normalized.includes("executionmarker")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_HIDDEN_EXECUTION_DETECTED",
      message: "Hidden execution markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
