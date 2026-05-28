import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function validateGovernanceFreeze(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.record.readinessClassification === "FROZEN") {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_GOVERNANCE_FREEZE_REQUIRED",
      message: "Upstream constitutional readiness is already frozen.",
      path: "constitutionalReadinessResult.record.readinessClassification",
    })]);
  }
  return Object.freeze([]);
}
