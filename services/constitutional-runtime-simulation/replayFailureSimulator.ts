import type {
  ConstitutionalRuntimeSimulationInput,
  SimulationSignal,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function simulateReplayFailure(
  input: ConstitutionalRuntimeSimulationInput,
): SimulationSignal {
  const triggered = !input.constitutionalReplayResult.record.replayDeterministic
    || input.constitutionalTelemetryResult.events.some((event) =>
      event.domain === "replay_instability" && event.triggered);
  return Object.freeze({
    domain: "replay_failure",
    triggered,
    severity: triggered ? "critical" : "none",
    reason: triggered ? "Replay failure simulation preserved historical truth and rejected present-state substitution." : "Replay remained historical and deterministic in simulation.",
    deterministicHash: hashSimulationValue("constitutional-runtime-simulation-replay-failure", {
      simulationId: input.simulationId,
      triggered,
    }),
  });
}
