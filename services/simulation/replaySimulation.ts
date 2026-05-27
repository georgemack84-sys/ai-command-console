import type { SimulationInput, SimulationScenario } from "./simulationTypes";
import { projectSimulationState } from "./simulationStateProjection";

export function simulateReplay({ scenario, input }: { scenario: SimulationScenario; input: SimulationInput }) {
  const projection = projectSimulationState({ scenario, input });
  return {
    ...projection,
    projectedSubsystemFailures: input.dashboard.replayDivergenceCount > 0 ? ["replay"] : [],
    projectedEscalations: projection.escalationProbability > 0.6 ? ["recovery_escalation"] : [],
  };
}
