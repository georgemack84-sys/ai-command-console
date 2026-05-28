import type { RecoverySimulationResult, SimulationAuditRecord, SimulationForecastSummary } from "./simulationTypes";

export function buildSimulationAudit({
  simulations,
  summary,
}: {
  simulations: RecoverySimulationResult[];
  summary: SimulationForecastSummary;
}) {
  const records: SimulationAuditRecord[] = [{
    eventType: "simulation.generated",
    evidence: simulations.flatMap((simulation) => simulation.evidenceSources).slice(0, 8),
    details: simulations.map((simulation) => `${simulation.simulationType}:${simulation.projectedOutcome}`),
    timestamp: summary.generatedAt,
  }];

  if (summary.confidenceDegradationReasons.length > 0) {
    records.push({
      eventType: "simulation.confidence.degraded",
      evidence: simulations.flatMap((simulation) => simulation.forecastLineage).slice(0, 8),
      details: summary.confidenceDegradationReasons,
      timestamp: summary.generatedAt,
    });
  }
  if (summary.collapseRisk >= 0.75) {
    records.push({
      eventType: "simulation.collapse.risk.detected",
      evidence: simulations.flatMap((simulation) => simulation.evidenceSources).slice(0, 8),
      details: ["collapse_risk_high"],
      timestamp: summary.generatedAt,
    });
  }

  return records;
}
