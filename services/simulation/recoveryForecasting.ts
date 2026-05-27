import type { SimulationInput, SimulationForecastSummary } from "./simulationTypes";
import { buildSimulationAudit } from "./simulationAudit";
import { projectCollapseRisk } from "./collapseRiskProjection";
import { projectGovernanceSurvivability } from "./governanceSurvivabilityProjection";
import { forecastOperationalTrust } from "./operationalTrustForecast";
import { forecastConstitutionalRisk } from "./constitutionalForecasting";
import { aggregateSimulationRisk } from "./simulationRiskAggregation";
import { runRecoverySimulationEngine } from "./recoverySimulationEngine";

export function buildRecoveryForecasting(input: SimulationInput): {
  summary: SimulationForecastSummary;
  auditRecords: ReturnType<typeof buildSimulationAudit>;
} {
  const { simulations, policy } = runRecoverySimulationEngine(input);
  const risk = aggregateSimulationRisk(simulations);
  const operationalTrustProjection = forecastOperationalTrust(input.dashboard);
  const governanceSurvivability = projectGovernanceSurvivability(input.dashboard);
  const constitutionalRisk = forecastConstitutionalRisk(input.dashboard);
  const collapseRisk = Math.max(projectCollapseRisk(input.dashboard), risk.collapseRisk);

  const confidenceDegradationReasons = Array.from(new Set([
    ...policy.reasons,
    ...simulations.flatMap((simulation) => simulation.uncertaintyLevel === "SEVERE" ? ["severe_forecast_uncertainty"] : []),
  ]));

  const summary: SimulationForecastSummary = {
    advisoryOnly: true,
    simulations,
    confidenceDegradationReasons,
    evidenceSufficient: policy.ok && policy.reasons.length < 4,
    collapseRisk,
    containmentPressure: Math.max(
      input.dashboard.continuityConvergence?.requiresContainment ? 0.7 : 0.3,
      input.dashboard.operationalStabilityAssessment?.containmentRecommended ? 0.68 : 0.25,
    ),
    governanceInstabilityRisk: Math.max(risk.governanceInstabilityRisk, 1 - governanceSurvivability, constitutionalRisk),
    operationalTrustProjection,
    generatedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
  };

  return {
    summary,
    auditRecords: buildSimulationAudit({ simulations, summary }),
  };
}
