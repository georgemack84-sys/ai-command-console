import type {
  ConstitutionalRuntimeSimulationError,
  ConstitutionalRuntimeSimulationInput,
  SimulationReplayBinding,
} from "./simulationStateTypes";
import { hashSimulationValue } from "./simulationTraceHasher";

export function validateSimulationReplayBinding(
  input: ConstitutionalRuntimeSimulationInput,
): Readonly<{
  replayBinding: SimulationReplayBinding;
  errors: readonly ConstitutionalRuntimeSimulationError[];
}> {
  const replayBound = input.constitutionalReplayResult.record.replayDeterministic;
  const telemetryBound = input.constitutionalTelemetryResult.record.replaySafe;
  const runtimeBound = input.runtimeAdmissibilityResult.record.replaySafe;
  const governanceBound = input.constitutionalReplayResult.record.governanceSnapshotId
    === input.constitutionalTelemetryResult.record.governanceSnapshotId;
  const errors = replayBound && telemetryBound && runtimeBound && governanceBound
    ? []
    : [Object.freeze({
      code: "CONSTITUTIONAL_RUNTIME_SIMULATION_REPLAY_MISMATCH" as const,
      message: "Simulation requires immutable replay and telemetry bindings with no present-state substitution.",
      path: "constitutionalReplayResult.record.replayDeterministic",
    })];
  return Object.freeze({
    replayBinding: Object.freeze({
      bindingId: hashSimulationValue("constitutional-runtime-simulation-replay-binding-id", input.simulationId),
      replayBound,
      telemetryBound,
      runtimeBound,
      governanceBound,
      deterministicHash: hashSimulationValue("constitutional-runtime-simulation-replay-binding", {
        replayBound,
        telemetryBound,
        runtimeBound,
        governanceBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
