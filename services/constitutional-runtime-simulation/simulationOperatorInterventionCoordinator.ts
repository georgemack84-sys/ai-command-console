import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function simulateOperatorIntervention(
  input: ConstitutionalRuntimeSimulationInput,
): SimulationSignal {
  const triggered = input.humanSupremacyResult.record.enforcementState !== "ENFORCED"
    || input.constitutionalTelemetryResult.events.some((event) =>
      event.domain === "override_propagation" && event.triggered);
  return Object.freeze({
    domain: "operator_intervention",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Operator intervention superseded simulation paths immediately." : "Operator supremacy remained latent and immediately available.",
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-operator-intervention", {
      simulationId: input.simulationId,
      triggered,
    }),
  });
}
