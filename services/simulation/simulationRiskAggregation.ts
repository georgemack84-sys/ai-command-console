import { clampMetric } from "../stability/stabilityMetrics";
import type { RecoverySimulationResult } from "./simulationTypes";

export function aggregateSimulationRisk(simulations: RecoverySimulationResult[]) {
  const collapseRisk = clampMetric(
    Math.max(...simulations.map((simulation) => (
      simulation.projectedOutcome === "COLLAPSE_RISK"
        ? 0.95
        : simulation.projectedOutcome === "FAILURE"
          ? 0.8
          : simulation.projectedOutcome === "ESCALATION_REQUIRED"
            ? 0.68
            : simulation.projectedOutcome === "CONTAINMENT_REQUIRED"
              ? 0.62
              : 0.25
    )), 0.1),
    0.1,
  );

  return {
    collapseRisk,
    governanceInstabilityRisk: clampMetric(
      simulations.filter((simulation) => simulation.projectedEscalations.includes("governance_review_required")).length / Math.max(simulations.length, 1),
      0.1,
    ),
  };
}
