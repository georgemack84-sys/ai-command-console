import { clampMetric } from "../stability/stabilityMetrics";

export type StrategicForecast = {
  forecastId: string;
  survivabilityProjection: number;
  degradationTrend: number;
  collapseRisk: number;
  stabilizationProbability: number;
  projectedContainmentLoad: number;
  governanceStressProjection: number;
  uncertaintyLevel: number;
  generatedAt: number;
};

export function buildStrategicContinuityForecast(input: {
  survivabilityScore: number;
  recoverabilityConfidence: number;
  systemicInstability: number;
  collapseRisk: number;
  containmentRequired: boolean;
  governanceConfidence: number;
  disputeCount: number;
  nowMs: number;
}) : StrategicForecast {
  const uncertaintyLevel = clampMetric(
    (1 - input.governanceConfidence) * 0.4
      + input.systemicInstability * 0.35
      + (input.disputeCount > 0 ? 0.2 : 0.05),
    0.05,
  );

  return {
    forecastId: `executive-forecast:${input.nowMs}`,
    survivabilityProjection: clampMetric((input.survivabilityScore * 0.6) + (input.recoverabilityConfidence * 0.4), 0.05),
    degradationTrend: clampMetric(input.systemicInstability * 0.7 + ((1 - input.recoverabilityConfidence) * 0.3), 0.05),
    collapseRisk: clampMetric(Math.max(input.collapseRisk, 1 - input.recoverabilityConfidence), 0.05),
    stabilizationProbability: clampMetric(input.recoverabilityConfidence * 0.75, 0.05),
    projectedContainmentLoad: clampMetric(input.containmentRequired ? 0.82 : 0.34, 0.05),
    governanceStressProjection: clampMetric(1 - input.governanceConfidence, 0.05),
    uncertaintyLevel,
    generatedAt: input.nowMs,
  };
}
