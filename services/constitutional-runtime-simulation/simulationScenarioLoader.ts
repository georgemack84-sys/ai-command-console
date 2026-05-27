import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationScenarioDefinition,
} from "./simulationStateTypes";
import { getSimulationScenarioRegistry } from "./simulationScenarioRegistry";

export function loadSimulationScenarios(
  input: ConstitutionalRuntimeSimulationInput,
): readonly SimulationScenarioDefinition[] {
  return getSimulationScenarioRegistry(input.simulationId);
}
