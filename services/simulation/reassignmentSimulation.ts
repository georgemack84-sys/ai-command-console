import type { SimulationInput, SimulationScenario } from "./simulationTypes";
import { projectSimulationState } from "./simulationStateProjection";

export function simulateReassignment({ scenario, input }: { scenario: SimulationScenario; input: SimulationInput }) {
  const projection = projectSimulationState({ scenario, input });
  return {
    ...projection,
    projectedSubsystemFailures: (input.dashboard.continuityConvergence?.staleOwnershipClaims || []).length ? ["ownership"] : [],
    projectedEscalations: scenario.disputed ? ["containment_escalation"] : [],
  };
}
