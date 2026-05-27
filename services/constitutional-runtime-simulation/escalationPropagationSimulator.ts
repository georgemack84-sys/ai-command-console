import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function simulateEscalationPropagation(
  input: ConstitutionalRuntimeSimulationInput,
): SimulationSignal {
  const triggered = input.escalationDeterminismResult.record.oversightState !== "stable"
    || input.constitutionalTelemetryResult.events.some((event) =>
      event.domain === "escalation_volatility" && event.triggered);
  return Object.freeze({
    domain: "escalation_propagation",
    triggered,
    severity: triggered ? "high" : "none",
    reason: triggered ? "Escalation propagation increased oversight only and never autonomy." : "Escalation propagation remained stable in simulation.",
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-escalation-propagation", {
      simulationId: input.simulationId,
      triggered,
    }),
  });
}
