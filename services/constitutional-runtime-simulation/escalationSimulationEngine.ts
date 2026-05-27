import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { simulateEscalationPropagation } from "./escalationPropagationSimulator";

export function buildEscalationSimulationEngine(
  input: ConstitutionalRuntimeSimulationInput,
): readonly SimulationSignal[] {
  return Object.freeze([simulateEscalationPropagation(input)]);
}
