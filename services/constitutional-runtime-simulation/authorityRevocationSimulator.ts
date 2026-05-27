import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function simulateAuthorityRevocation(
  input: ConstitutionalRuntimeSimulationInput,
): SimulationSignal {
  const triggered = input.humanSupremacyResult.authorityRevocation.authorityRevoked
    || input.constitutionalAuthorityBoundaryResult.revocation.revoked;
  return Object.freeze({
    domain: "authority_revocation",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Authority revocation propagated immediately and stale authority did not persist." : "Authority remained bounded but revocable in simulation.",
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-authority-revocation", {
      simulationId: input.simulationId,
      triggered,
    }),
  });
}
