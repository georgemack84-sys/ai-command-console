import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function validateAuthorityContainment(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.record.failClosed) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_AUTHORITY_CONTAINMENT_FAILED",
      message: "Upstream readiness is already fail-closed, so authority containment is not proven.",
      path: "constitutionalReadinessResult.record.failClosed",
    })]);
  }
  return Object.freeze([]);
}
