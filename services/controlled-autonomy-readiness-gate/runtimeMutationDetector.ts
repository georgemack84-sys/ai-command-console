import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function detectRuntimeMutation(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("runtimecontamination") || normalized.includes("runtimemutation")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_RUNTIME_MUTATION_DETECTED",
      message: "Runtime contamination or mutation markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
