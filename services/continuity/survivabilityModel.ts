import { clampMetric } from "../stability/stabilityMetrics";

export type StrategicContinuityAssessment = {
  survivable: boolean;
  survivabilityScore: number;
  continuityTrajectory: string;
  escalationPressure: number;
  governancePressure: number;
  stabilizationConfidence: number;
  collapseRisk: number;
  containmentConfidence: number;
  recommendedActions: string[];
  timestamp: string;
};

export function modelStrategicSurvivability(input: {
  governanceConfidence: number;
  stabilityScore: number;
  containmentConfidence: number;
  escalationPressure: number;
  collapseRisk: number;
  dependencyResilience: number;
}) {
  const survivabilityScore = clampMetric(
    input.governanceConfidence * 0.22
      + input.stabilityScore * 0.28
      + input.containmentConfidence * 0.18
      + input.dependencyResilience * 0.17
      + (1 - input.escalationPressure) * 0.08
      + (1 - input.collapseRisk) * 0.07,
    0.05,
  );

  let continuityTrajectory = "DECLINING";
  if (survivabilityScore >= 0.7 && input.collapseRisk < 0.35) continuityTrajectory = "STABLE";
  else if (survivabilityScore >= 0.5 && input.collapseRisk < 0.55) continuityTrajectory = "STRESSED";
  else if (input.collapseRisk >= 0.8) continuityTrajectory = "UNSTABLE";

  return {
    survivabilityScore,
    continuityTrajectory,
  };
}
