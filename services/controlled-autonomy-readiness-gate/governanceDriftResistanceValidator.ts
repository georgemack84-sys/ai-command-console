import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function validateGovernanceDriftResistance(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.governanceReadiness.governanceViolationRate > 0) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_GOVERNANCE_DRIFT_RESISTANCE_FAILED",
      message: "Governance drift resistance could not be validated.",
      path: "constitutionalReadinessResult.governanceReadiness.governanceViolationRate",
    })]);
  }
  return Object.freeze([]);
}
