import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function certifyApprovalStability(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.approvalReadiness.approvalInstabilityScore > 0) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_APPROVAL_STABILITY_FAILURE",
      message: "Approval instability score is above zero.",
      path: "constitutionalReadinessResult.approvalReadiness.approvalInstabilityScore",
    })]);
  }
  return Object.freeze([]);
}
