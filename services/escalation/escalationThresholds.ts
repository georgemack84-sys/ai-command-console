import type { OperationalStabilityAssessment } from "../stability/operationalStabilityEngine";
import { clampMetric } from "../stability/stabilityMetrics";

export type EscalationThresholdResult = {
  pressureScore: number;
  recommendedType: "operator" | "governance" | "recovery" | "infrastructure" | "constitutional" | "containment" | "emergency";
  reasons: string[];
};

export function evaluateEscalationThresholds(assessment: OperationalStabilityAssessment): EscalationThresholdResult {
  const reasons: string[] = [];
  const pressureScore = clampMetric(
    (assessment.degradationRate * 0.18)
    + (assessment.recoveryPressure * 0.18)
    + (assessment.escalationPressure * 0.16)
    + (assessment.replayInstabilityScore * 0.18)
    + (assessment.staleExecutionSpread * 0.1)
    + (assessment.dependencyInstabilityScore * 0.1)
    + (assessment.operatorInterventionPressure * 0.05)
    + ((1 - assessment.recoverySuccessConfidence) * 0.05),
    0.2,
  );

  let recommendedType: EscalationThresholdResult["recommendedType"] = "operator";

  if (assessment.lockdownRecommended || assessment.survivabilityScore <= 0.12) {
    recommendedType = "emergency";
    reasons.push("catastrophic_survivability_loss");
  } else if (assessment.containmentRecommended || assessment.replayInstabilityScore >= 0.65) {
    recommendedType = assessment.replayInstabilityScore >= 0.65 ? "containment" : "recovery";
    reasons.push("containment_or_replay_instability");
  } else if (assessment.dependencyInstabilityScore >= 0.55 || assessment.unstableSubsystems.includes("database")) {
    recommendedType = "infrastructure";
    reasons.push("dependency_instability");
  } else if (assessment.escalationPressure >= 0.55 || assessment.disputed) {
    recommendedType = "governance";
    reasons.push("governance_pressure");
  } else if (assessment.recoveryPressure >= 0.55) {
    recommendedType = "recovery";
    reasons.push("recovery_pressure");
  } else if (assessment.degradationRate >= 0.45) {
    recommendedType = "operator";
    reasons.push("degradation_rate_rising");
  }

  if (assessment.disputed && recommendedType !== "emergency") {
    recommendedType = "constitutional";
    reasons.push("disputed_state_requires_constitutional_visibility");
  }

  return {
    pressureScore,
    recommendedType,
    reasons: Array.from(new Set(reasons)),
  };
}
