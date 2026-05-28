import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function simulateCoordinationStress(
  input: ConstitutionalRuntimeSimulationInput,
): SimulationSignal {
  const triggered = input.antiEmergenceResult.signals.some((signal) =>
    signal.triggered && (signal.domain === "recursive_coordination" || signal.domain === "fanout_expansion"))
    || input.runtimeAdmissibilityResult.errors.some((error) =>
      error.code === "RUNTIME_ADMISSIBILITY_RECURSIVE_COORDINATION");
  return Object.freeze({
    domain: "coordination_stress",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Coordination stress reached recursive or hidden-orchestration boundaries." : "Coordination remained non-orchestrating in simulation.",
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-coordination-stress", {
      simulationId: input.simulationId,
      triggered,
    }),
  });
}
