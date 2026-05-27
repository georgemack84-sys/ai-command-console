import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function validateContainmentDriftResistance(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.containmentReadiness.containmentPressureScore > 0) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_CONTAINMENT_DRIFT_RESISTANCE_FAILED",
      message: "Containment drift resistance could not be validated.",
      path: "constitutionalReadinessResult.containmentReadiness.containmentPressureScore",
    })]);
  }
  return Object.freeze([]);
}
