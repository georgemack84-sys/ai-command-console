import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function simulateRuntimeInstability(
  input: ConstitutionalRuntimeSimulationInput,
): SimulationSignal {
  const triggered = input.runtimeAdmissibilityResult.errors.length > 0
    || input.constitutionalTelemetryResult.events.some((event) =>
      event.domain === "containment_pressure" && event.triggered);
  return Object.freeze({
    domain: "runtime_instability",
    triggered,
    severity: triggered ? "high" : "none",
    reason: triggered ? "Runtime instability increased oversight pressure in simulation only." : "Runtime instability remained contained in simulation.",
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-runtime-instability", {
      simulationId: input.simulationId,
      triggered,
    }),
  });
}
