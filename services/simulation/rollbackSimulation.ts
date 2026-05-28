import type { SimulationInput, SimulationScenario } from "./simulationTypes";
import { projectSimulationState } from "./simulationStateProjection";

export function simulateRollback({ scenario, input }: { scenario: SimulationScenario; input: SimulationInput }) {
  const projection = projectSimulationState({ scenario, input });
  return {
    ...projection,
    projectedSubsystemFailures: scenario.disputed ? ["rollback_governance"] : [],
    projectedEscalations: projection.projectedOutcome === "FAILURE" ? ["governance_review_required"] : [],
  };
}
