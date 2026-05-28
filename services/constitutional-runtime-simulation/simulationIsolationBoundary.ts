import type {
  ConstitutionalRuntimeSimulationError,
  ConstitutionalRuntimeSimulationInput,
} from "./simulationStateTypes";
import { normalizeSimulationMetadata } from "./simulationSchemas";

export function validateSimulationIsolationBoundary(
  input: ConstitutionalRuntimeSimulationInput,
): readonly ConstitutionalRuntimeSimulationError[] {
  const metadata = normalizeSimulationMetadata(input.metadata);
  const violations = [
    "execution",
    "orchestration",
    "scheduler",
    "runtimecontroller",
    "liveescalation",
    "remediation",
  ].filter((marker) => metadata.includes(marker));
  if (violations.length === 0) {
    return Object.freeze([]);
  }
  return Object.freeze([Object.freeze({
    code: "CONSTITUTIONAL_RUNTIME_SIMULATION_ISOLATION_VIOLATION",
    message: `Simulation must remain isolated from operational systems. Found: ${violations.join(", ")}.`,
    path: "metadata",
  })]);
}
