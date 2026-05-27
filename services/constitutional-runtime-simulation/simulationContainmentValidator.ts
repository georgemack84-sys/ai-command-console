import type {
  ConstitutionalRuntimeSimulationError,
  ConstitutionalRuntimeSimulationInput,
  SimulationContainmentState,
} from "./simulationStateTypes";

export function validateSimulationContainment(input: {
  simulationInput: ConstitutionalRuntimeSimulationInput;
  containmentState: SimulationContainmentState;
}): readonly ConstitutionalRuntimeSimulationError[] {
  const errors: ConstitutionalRuntimeSimulationError[] = [];
  if (input.containmentState.authorityIncreaseDetected) {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_RUNTIME_SIMULATION_CONTAINMENT_LOWERED",
      message: "Containment pressure cannot lower oversight or imply authority increase.",
      path: "containmentState.authorityIncreaseDetected",
    }));
  }
  if (input.simulationInput.antiEmergenceResult.record.classification !== "contained"
    || input.simulationInput.runtimeAdmissibilityResult.record.classification !== "admissible") {
    errors.push(Object.freeze({
      code: "CONSTITUTIONAL_RUNTIME_SIMULATION_HIDDEN_ORCHESTRATION",
      message: "Simulation cannot model runtime futures from non-contained or inadmissible constitutional state.",
      path: "antiEmergenceResult.record.classification",
    }));
  }
  return Object.freeze(errors);
}
