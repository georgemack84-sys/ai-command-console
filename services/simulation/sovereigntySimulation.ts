import { buildCivilizationForecast } from "./civilizationForecasting";

export function buildSovereigntySimulation(input: {
  sovereigntyState: string;
  survivabilityConfidence: number;
  governanceReliability?: number;
  operationalStability?: number;
  escalationPressure?: number;
  containmentPressure: number;
  systemicRisk?: number;
  unstableSystems?: string[];
  createdAt: number;
}) {
  const forecast = buildCivilizationForecast({
    survivabilityConfidence: input.survivabilityConfidence,
    governanceReliability: input.governanceReliability ?? input.survivabilityConfidence,
    operationalStability: input.operationalStability ?? input.survivabilityConfidence,
    escalationPressure: input.escalationPressure ?? input.containmentPressure,
    containmentPressure: input.containmentPressure,
    systemicRisk: input.systemicRisk ?? input.containmentPressure,
    createdAt: input.createdAt,
  });

  return {
    simulationId: `sovereignty-simulation:${input.createdAt}`,
    sovereigntyState: input.sovereigntyState,
    deterministic: true as const,
    advisoryOnly: true as const,
    replaySafe: true as const,
    forecast,
    blockedReasons:
      forecast.collapseRisk >= 0.7 || input.sovereigntyState === "EMERGENCY_CONTAINMENT"
        ? ["simulation_detected_collapse_risk"]
        : [],
    unstableSystems: [...(input.unstableSystems ?? [])].sort(),
  };
}
