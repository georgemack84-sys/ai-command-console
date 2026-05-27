import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateAntiExpansion(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  const errors: ControlledAutonomyGateError[] = [];
  if (normalized.includes("authorityexpansion")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_AUTHORITY_EXPANSION_ATTEMPT",
      message: "Authority expansion markers were detected.",
      path: "metadata",
    }));
  }
  if (normalized.includes("containmentdegradation")) {
    errors.push(Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_CONTAINMENT_DEGRADATION",
      message: "Containment degradation markers were detected.",
      path: "metadata",
    }));
  }
  return Object.freeze(errors);
}
