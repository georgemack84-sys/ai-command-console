import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function verifyBoundaryContainment(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (!input.constitutionalReadinessResult.containmentReadiness.containmentGuaranteed) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_BOUNDARY_CONTAINMENT_UNPROVEN",
      message: "Containment guarantees are not proven.",
      path: "constitutionalReadinessResult.containmentReadiness.containmentGuaranteed",
    })]);
  }
  return Object.freeze([]);
}
