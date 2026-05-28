import { projectContinuity } from "./continuityProjection";
import { modelSystemicCollapse } from "./systemicCollapseModeling";

function clamp(value: number) {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

export function buildCivilizationForecast(input: {
  survivabilityConfidence: number;
  governanceReliability: number;
  operationalStability: number;
  escalationPressure: number;
  containmentPressure: number;
  systemicRisk: number;
  createdAt: number;
}) {
  const continuity = projectContinuity({
    survivabilityConfidence: input.survivabilityConfidence,
    governanceReliability: input.governanceReliability,
    operationalStability: input.operationalStability,
  });
  const collapse = modelSystemicCollapse({
    systemicRisk: input.systemicRisk,
    escalationPressure: input.escalationPressure,
    containmentPressure: input.containmentPressure,
    survivabilityConfidence: input.survivabilityConfidence,
    governanceReliability: input.governanceReliability,
  });

  return {
    forecastId: `civilization-forecast:${input.createdAt}`,
    survivabilityProjection: continuity.continuityProjection,
    degradationTrend: continuity.degradationTrend,
    collapseRisk: collapse.collapseRisk,
    stabilizationProbability: clamp(1 - collapse.collapseRisk),
    projectedContainmentLoad: clamp((input.containmentPressure * 0.6) + (input.systemicRisk * 0.4)),
    governanceStressProjection: clamp(
      (input.escalationPressure * 0.45)
      + ((1 - input.governanceReliability) * 0.35)
      + (input.systemicRisk * 0.2),
    ),
    uncertaintyLevel: collapse.uncertaintyLevel,
    generatedAt: input.createdAt,
  };
}
