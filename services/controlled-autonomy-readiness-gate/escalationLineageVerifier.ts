import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function verifyEscalationLineage(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.escalationReadiness.escalationFailureRate > 0) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_ESCALATION_LINEAGE_DEGRADED",
      message: "Escalation failure rate is above zero.",
      path: "constitutionalReadinessResult.escalationReadiness.escalationFailureRate",
    })]);
  }
  return Object.freeze([]);
}
