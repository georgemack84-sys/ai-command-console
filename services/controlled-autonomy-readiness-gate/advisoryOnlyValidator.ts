import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function validateAdvisoryOnly(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (!input.constitutionalReadinessResult.recommendationReadiness.recommendationIntegrityStable) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_RECOMMENDATION_NOT_ADVISORY",
      message: "Recommendation integrity could not be verified as stable and advisory-only.",
      path: "constitutionalReadinessResult.recommendationReadiness.recommendationIntegrityStable",
    })]);
  }
  return Object.freeze([]);
}
