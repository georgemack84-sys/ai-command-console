import type {
  ConstitutionalRuntimeSimulationError,
  ConstitutionalRuntimeSimulationInput,
  SimulationScenarioTrace,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function validateSimulationDeterminism(input: {
  simulationInput: ConstitutionalRuntimeSimulationInput;
  traces: readonly SimulationScenarioTrace[];
  signals: readonly SimulationSignal[];
}): readonly ConstitutionalRuntimeSimulationError[] {
  const currentHash = hashSimulationValue("constitutional-runtime-simulation-determinism", {
    simulationId: input.simulationInput.simulationId,
    traces: input.traces,
    signals: input.signals,
  });
  const expectedHash = hashSimulationValue("constitutional-runtime-simulation-determinism", {
    simulationId: input.simulationInput.simulationId,
    traces: input.traces,
    signals: input.signals,
  });
  if (currentHash === expectedHash) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "CONSTITUTIONAL_RUNTIME_SIMULATION_ESCALATION_NONDETERMINISM",
    message: "Simulation traces diverged under identical replay-bound inputs.",
    path: "scenarioTraces",
  })]);
}
