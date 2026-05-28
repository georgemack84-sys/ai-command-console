import type { SimulationInput, SimulationScenario } from "./simulationTypes";
import { projectSimulationState } from "./simulationStateProjection";

export function simulateDegradationPropagation({ scenario, input }: { scenario: SimulationScenario; input: SimulationInput }) {
  const projection = projectSimulationState({ scenario, input });
  return {
    ...projection,
    projectedSubsystemFailures: input.dashboard.degradedSystems.slice(0, 3),
    projectedEscalations: input.dashboard.degradedSystems.length > 1 ? ["infrastructure_escalation"] : [],
  };
}
