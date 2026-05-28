import type { RecoveryDashboardReadModel } from "../recovery/verification/recoveryVerificationTypes";
import type { RecoveryProjectedOutcome, RecoverySimulationResult, RecoverySimulationType, SimulationForecastSummary } from "./simulationTypes";
import { buildSimulationAudit } from "./simulationAudit";
import { buildSimulationLineage } from "./simulationLineage";
import { buildScenarioForecasts } from "./scenarioForecasting";
import { evaluateSimulationConstraints } from "./simulationConstraints";

export type ConstitutionalSimulationResult = {
  simulationId: string;
  simulationType: string;
  deterministic: boolean;
  constitutionalSafe: boolean;
  uncertaintyLevel: number;
  survivabilityScore: number;
  escalationRisk: number;
  containmentFailureProbability: number;
  governanceIntegrityForecast: number;
  unstableDomains: string[];
  projectedInterventions: string[];
  forecastLineageId: string;
  evidenceReferences: string[];
  createdAt: number;
};

function toRecoverySimulationType(simulationType: string): RecoverySimulationType {
  switch (simulationType) {
    case "governance_conflict":
    case "constitutional_violation":
      return "ESCALATION";
    case "continuity_collapse":
    case "operational_survivability":
    case "dependency_collapse":
      return "DEGRADATION_PROPAGATION";
    case "containment_failure":
      return "CONTAINMENT";
    case "recovery_saturation":
      return "ROLLBACK";
    case "tenant_isolation":
      return "REASSIGNMENT";
    case "operator_intervention":
      return "CONTINUITY_STABILIZATION";
    default:
      return "REPLAY";
  }
}

function toProjectedOutcome(constitutionalSafe: boolean, survivabilityScore: number): RecoveryProjectedOutcome {
  if (!constitutionalSafe) return "ESCALATION_REQUIRED";
  if (survivabilityScore < 0.4) return "COLLAPSE_RISK";
  if (survivabilityScore < 0.6) return "UNSTABLE";
  return "SUCCESS";
}

export function buildConstitutionalSimulation(input: {
  dashboard: RecoveryDashboardReadModel;
  nowMs: number;
}) {
  const forecasts = buildScenarioForecasts({ dashboard: input.dashboard });
  const generatedAt = new Date(input.nowMs).toISOString();

  const results: ConstitutionalSimulationResult[] = forecasts.map((forecast) => {
    const constraints = evaluateSimulationConstraints({
      dashboard: input.dashboard,
      simulationType: forecast.simulationType,
    });
    const lineage = buildSimulationLineage({
      dashboard: input.dashboard,
      scenario: {
        simulationType: toRecoverySimulationType(forecast.simulationType),
        executionIds: input.dashboard.activeRecoveries
          .map((entry) => String(entry.executionId ?? entry.id ?? ""))
          .filter(Boolean),
        frozen: Boolean(input.dashboard.continuityConvergence?.requiresFreeze),
        disputed: input.dashboard.governanceDisputes.length > 0,
        evidenceSources: forecast.evidenceReferences,
      },
    });

    return {
      simulationId: `simulation:${forecast.simulationType}:${input.nowMs}`,
      simulationType: forecast.simulationType,
      deterministic: constraints.deterministic,
      constitutionalSafe: constraints.allowed,
      uncertaintyLevel: Number((1 - forecast.governanceIntegrityForecast).toFixed(4)),
      survivabilityScore: Number(forecast.survivabilityScore.toFixed(4)),
      escalationRisk: Number(forecast.escalationRisk.toFixed(4)),
      containmentFailureProbability: Number(forecast.containmentFailureProbability.toFixed(4)),
      governanceIntegrityForecast: Number(forecast.governanceIntegrityForecast.toFixed(4)),
      unstableDomains: forecast.unstableDomains,
      projectedInterventions: constraints.allowed
        ? forecast.projectedInterventions
        : Array.from(new Set([...forecast.projectedInterventions, ...constraints.blockedReasons])),
      forecastLineageId: lineage.join("|"),
      evidenceReferences: forecast.evidenceReferences,
      createdAt: input.nowMs,
    };
  });

  const simulationRecords: RecoverySimulationResult[] = results.map((result) => ({
      simulationId: result.simulationId,
      simulationType: toRecoverySimulationType(result.simulationType),
      projectedOutcome: toProjectedOutcome(result.constitutionalSafe, result.survivabilityScore),
      survivabilityScore: result.survivabilityScore,
      continuityConfidence: result.governanceIntegrityForecast,
      escalationProbability: result.escalationRisk,
      operationalTrustProjection: result.governanceIntegrityForecast,
      projectedSubsystemFailures: result.unstableDomains,
      projectedEscalations: result.projectedInterventions,
      confidenceScore: 1 - result.uncertaintyLevel,
      uncertaintyLevel:
        result.uncertaintyLevel >= 0.8 ? "SEVERE"
        : result.uncertaintyLevel >= 0.55 ? "HIGH"
        : result.uncertaintyLevel >= 0.3 ? "MODERATE"
        : "LOW",
      evidenceSources: result.evidenceReferences,
      forecastLineage: result.forecastLineageId.split("|"),
      generatedAt,
    }));

  const summary: SimulationForecastSummary = {
      simulations: simulationRecords,
      confidenceDegradationReasons: results.flatMap((result) => (result.constitutionalSafe ? [] : ["blocked_by_governance"])),
      evidenceSufficient: simulationRecords.every((result) => result.evidenceSources.length > 0),
      advisoryOnly: true,
      collapseRisk: Math.max(...results.map((result) => 1 - result.survivabilityScore)),
      containmentPressure: Math.max(...results.map((result) => result.containmentFailureProbability)),
      governanceInstabilityRisk: Math.max(...results.map((result) => 1 - result.governanceIntegrityForecast)),
      operationalTrustProjection: Math.min(...results.map((result) => result.governanceIntegrityForecast)),
      generatedAt,
  };

  const auditRecords = buildSimulationAudit({
    simulations: simulationRecords,
    summary,
  });

  return {
    results,
    auditRecords,
    deterministic: true as const,
    readOnly: true as const,
  };
}
