import type { SimulationInput, SimulationScenario } from "./simulationTypes";
import { projectSimulationState } from "./simulationStateProjection";

export function simulateContinuityStabilization({ scenario, input }: { scenario: SimulationScenario; input: SimulationInput }) {
  const projection = projectSimulationState({ scenario, input });
  const continuityUnstable = projection.continuityConfidence < 0.45 || projection.projectedOutcome === "UNSTABLE" || projection.projectedOutcome === "PARTIAL_SUCCESS";
  return {
    ...projection,
    projectedSubsystemFailures: projection.continuityConfidence < 0.45 ? ["continuity"] : [],
    projectedEscalations: continuityUnstable || projection.escalationProbability > 0.55 ? ["stabilization_review_required"] : [],
  };
}
