import type { SimulationInput, SimulationScenario } from "./simulationTypes";
import { projectSimulationState } from "./simulationStateProjection";

export function simulateContainment({ scenario, input }: { scenario: SimulationScenario; input: SimulationInput }) {
  const projection = projectSimulationState({ scenario, input });
  return {
    ...projection,
    projectedSubsystemFailures: (input.dashboard.continuityConvergence?.unstableDependencies || []).slice(0, 2),
    projectedEscalations: projection.projectedOutcome === "CONTAINMENT_REQUIRED" ? ["containment_escalation"] : [],
  };
}
