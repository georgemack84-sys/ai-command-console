import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function bindRecommendationGovernance(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (!input.constitutionalReadinessResult.governanceBinding.governanceBound) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_RECOMMENDATION_GOVERNANCE_DETACHED",
      message: "Recommendation governance binding is detached.",
      path: "constitutionalReadinessResult.governanceBinding.governanceBound",
    })]);
  }
  return Object.freeze([]);
}
