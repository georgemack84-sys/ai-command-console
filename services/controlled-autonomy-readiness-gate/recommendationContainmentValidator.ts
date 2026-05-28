import type { ControlledAutonomyGateError, ControlledAutonomyReadinessGateInput } from "./controlledAutonomyReadinessGate";

export function validateRecommendationContainment(input: ControlledAutonomyReadinessGateInput): readonly ControlledAutonomyGateError[] {
  if (input.constitutionalReadinessResult.recommendationReadiness.confidenceVolatilityScore > 0) {
    return Object.freeze([Object.freeze({
      code: "CONTROLLED_AUTONOMY_GATE_RECOMMENDATION_CONTAINMENT_DEGRADED",
      message: "Confidence volatility prevents recommendation containment certification.",
      path: "constitutionalReadinessResult.recommendationReadiness.confidenceVolatilityScore",
    })]);
  }
  return Object.freeze([]);
}
