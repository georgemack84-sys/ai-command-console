import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function detectCapabilityMutation(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("capabilitymutation") || normalized.includes("adaptiveexecution")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_CAPABILITY_MUTATION",
      message: "Capability mutation or adaptive execution markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
