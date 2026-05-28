import type { SimulationInput, SimulationScenario } from "./simulationTypes";
import { projectSimulationState } from "./simulationStateProjection";

export function simulateEscalation({ scenario, input }: { scenario: SimulationScenario; input: SimulationInput }) {
  const projection = projectSimulationState({ scenario, input });
  return {
    ...projection,
    projectedSubsystemFailures: input.dashboard.escalationCoordination?.frozen ? ["escalation_lineage"] : [],
    projectedEscalations: ["governance_review_required"],
  };
}
