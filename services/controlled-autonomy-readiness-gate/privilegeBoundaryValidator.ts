import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validatePrivilegeBoundary(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("privilegeescalation")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_PRIVILEGE_ESCALATION_ATTEMPT",
      message: "Privilege escalation markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
