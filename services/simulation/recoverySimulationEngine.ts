import { applyForecastConfidence, computeForecastConfidence } from "./forecastConfidence";
import { buildSimulationLineage } from "./simulationLineage";
import { buildSimulationScenarios } from "./simulationScenarioBuilder";
import { simulateContainment } from "./containmentSimulation";
import { simulateContinuityStabilization } from "./continuityStabilizationSimulation";
import { simulateDegradationPropagation } from "./degradationPropagationSimulation";
import { simulateEscalation } from "./escalationSimulation";
import { simulateReassignment } from "./reassignmentSimulation";
import { simulateReplay } from "./replaySimulation";
import { simulateRollback } from "./rollbackSimulation";
import { validateSimulationPolicies } from "./simulationPolicies";
import type { RecoverySimulationResult, SimulationInput, SimulationScenario } from "./simulationTypes";

function projectScenario({
  scenario,
  input,
}: {
  scenario: SimulationScenario;
  input: SimulationInput;
}) {
  switch (scenario.simulationType) {
    case "REPLAY":
      return simulateReplay({ scenario, input });
    case "ROLLBACK":
      return simulateRollback({ scenario, input });
    case "ESCALATION":
      return simulateEscalation({ scenario, input });
    case "REASSIGNMENT":
      return simulateReassignment({ scenario, input });
    case "CONTAINMENT":
      return simulateContainment({ scenario, input });
    case "CONTINUITY_STABILIZATION":
      return simulateContinuityStabilization({ scenario, input });
    case "DEGRADATION_PROPAGATION":
      return simulateDegradationPropagation({ scenario, input });
  }
}

export function runRecoverySimulationEngine(input: SimulationInput): {
  simulations: RecoverySimulationResult[];
  policy: ReturnType<typeof validateSimulationPolicies>;
} {
  const policy = validateSimulationPolicies(input);
  const scenarios = buildSimulationScenarios(input);

  const simulations = scenarios.map((scenario, index) => {
    const projection = projectScenario({ scenario, input });
    const lineage = buildSimulationLineage({ dashboard: input.dashboard, scenario });
    const confidence = computeForecastConfidence({
      input,
      baseConfidence: 0.78 - (scenario.disputed ? 0.15 : 0) - (scenario.frozen ? 0.12 : 0),
    });

    return applyForecastConfidence({
      simulationId: `simulation:${scenario.simulationType.toLowerCase()}:${index}`,
      simulationType: scenario.simulationType,
      projectedOutcome: projection.projectedOutcome,
      survivabilityScore: projection.survivabilityScore,
      continuityConfidence: projection.continuityConfidence,
      escalationProbability: projection.escalationProbability,
      operationalTrustProjection: projection.operationalTrustProjection,
      projectedSubsystemFailures: projection.projectedSubsystemFailures,
      projectedEscalations: projection.projectedEscalations,
      forecastLineage: lineage,
      evidenceSources: scenario.evidenceSources,
      generatedAt: new Date(input.nowMs ?? Date.now()).toISOString(),
    }, confidence.confidenceScore, confidence.uncertaintyLevel);
  });

  return { simulations, policy };
}
