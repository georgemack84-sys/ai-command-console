import { clampMetric } from "../stability/stabilityMetrics";

export function forecastStrategicContinuity(input: {
  survivabilityScore: number;
  escalationPressure: number;
  governancePressure: number;
  containmentConfidence: number;
  stabilizationConfidence: number;
  disputedTruth: boolean;
}) {
  const collapseRisk = clampMetric(
    (1 - input.survivabilityScore) * 0.35
      + input.escalationPressure * 0.2
      + input.governancePressure * 0.18
      + (1 - input.containmentConfidence) * 0.14
      + (1 - input.stabilizationConfidence) * 0.08
      + (input.disputedTruth ? 0.2 : 0),
    0.05,
  );

  let continuityTrajectory = "STABLE";
  if (collapseRisk >= 0.8) continuityTrajectory = "UNSTABLE";
  else if (collapseRisk >= 0.55) continuityTrajectory = "DECLINING";
  else if (collapseRisk >= 0.35) continuityTrajectory = "STRESSED";

  const recommendedActions: string[] = [];
  if (input.disputedTruth) recommendedActions.push("explain_uncertainty");
  if (collapseRisk >= 0.7) recommendedActions.push("escalate_governance_review");
  if (input.containmentConfidence < 0.55) recommendedActions.push("preserve_containment_precedence");
  if (recommendedActions.length === 0) recommendedActions.push("continue_supervised_monitoring");

  return {
    collapseRisk,
    continuityTrajectory,
    escalationPressure: clampMetric(input.escalationPressure, 0),
    governancePressure: clampMetric(input.governancePressure, 0),
    stabilizationConfidence: clampMetric(input.stabilizationConfidence, 0.05),
    containmentConfidence: clampMetric(input.containmentConfidence, 0.05),
    recommendedActions: Array.from(new Set(recommendedActions)),
  };
}
