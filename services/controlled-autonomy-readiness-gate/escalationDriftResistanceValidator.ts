import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function validateEscalationDriftResistance(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.escalationReadiness.escalationFailureRate > 0) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_ESCALATION_DRIFT_RESISTANCE_FAILED",
      message: "Escalation drift resistance could not be validated.",
      path: "constitutionalReadinessResult.escalationReadiness.escalationFailureRate",
    })]);
  }
  return Object.freeze([]);
}
