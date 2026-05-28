import type {
  ConstitutionalRuntimeSimulationError,
  ConstitutionalRuntimeSimulationInput,
} from "./simulationStateTypes";
import { normalizeSimulationMetadata } from "./simulationSchemas";

export function validateSimulationAuthorityFirewall(
  input: ConstitutionalRuntimeSimulationInput,
): readonly ConstitutionalRuntimeSimulationError[] {
  const metadata = normalizeSimulationMetadata(input.metadata);
  const crossed = [
    "authoritygrant",
    "authoritymutation",
    "privilegeexpansion",
    "runtimepower",
    "executionpath",
  ].some((marker) => metadata.includes(marker));
  if (!crossed) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "CONSTITUTIONAL_RUNTIME_SIMULATION_AUTHORITY_CROSSOVER",
    message: "Simulation crossed from modeling into forbidden authority or execution semantics.",
    path: "metadata",
  })]);
}
