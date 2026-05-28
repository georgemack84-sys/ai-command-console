import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function simulateGovernanceConflict(
  input: ConstitutionalRuntimeSimulationInput,
): SimulationSignal {
  const triggered = !input.runtimeAdmissibilityResult.governanceBinding.governanceBound
    || input.constitutionalTelemetryResult.events.some((event) =>
      event.domain === "governance_violation" && event.triggered);
  return Object.freeze({
    domain: "governance_conflict",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Governance conflict or stale governance truth required operator review." : "Governance supremacy remained absolute in simulation.",
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-governance-conflict", {
      simulationId: input.simulationId,
      triggered,
    }),
  });
}
