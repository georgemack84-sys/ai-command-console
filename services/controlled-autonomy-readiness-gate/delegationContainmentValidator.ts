import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";
import { normalizeGateMetadata } from "./readinessClassificationEngine";

export function validateDelegationContainment(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  const normalized = normalizeGateMetadata(input.metadata);
  if (normalized.includes("delegationleakage") || normalized.includes("approvalinheritance")) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_DELEGATION_CONTAINMENT_FAILED",
      message: "Delegation leakage or approval inheritance markers were detected.",
      path: "metadata",
    })]);
  }
  return Object.freeze([]);
}
