import { RECOVERY_SIMULATION_TYPES } from "./simulationConstants";
import type { SimulationInput, SimulationScenario } from "./simulationTypes";

export function buildSimulationScenarios(input: SimulationInput): SimulationScenario[] {
  const executionIds = Array.from(new Set([
    ...((input.dashboard.activeRecoveries || []).map((entry) => String(entry.executionId || "")).filter(Boolean)),
    ...((input.dashboard.blockedRecoveries || []).map((entry) => String(entry.executionId || "")).filter(Boolean)),
    ...((input.dashboard.quarantinedExecutions || []).map((entry) => String(entry.executionId || "")).filter(Boolean)),
  ]));

  const evidenceSources = Array.from(new Set([
    ...(input.dashboard.continuityConvergence?.evidence || []),
    ...(input.dashboard.auditHistory || []).map((entry) => String(entry.id || "")).filter(Boolean).slice(0, 6),
  ]));

  return RECOVERY_SIMULATION_TYPES.map((simulationType) => ({
    simulationType,
    executionIds,
    frozen: Boolean(input.dashboard.stewardship?.shouldFreeze || input.dashboard.continuityConvergence?.requiresFreeze),
    disputed: Boolean(input.dashboard.governanceDisputes?.length || input.dashboard.stewardship?.state === "DISPUTED"),
    evidenceSources,
  }));
}
