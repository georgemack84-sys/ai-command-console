import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function simulateContainmentPressure(
  input: ConstitutionalRuntimeSimulationInput,
): SimulationSignal {
  const triggered = input.antiEmergenceResult.record.classification !== "contained"
    || input.runtimeAdmissibilityResult.readinessScore.restrictionLevel !== "none"
    || input.constitutionalTelemetryResult.events.some((event) =>
      event.domain === "containment_pressure" && event.triggered);
  return Object.freeze({
    domain: "containment_pressure",
    triggered,
    severity: triggered ? "high" : "none",
    reason: triggered ? "Containment pressure increased oversight only and never runtime authority." : "Containment pressure remained bounded in simulation.",
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-containment-pressure", {
      simulationId: input.simulationId,
      triggered,
    }),
  });
}
