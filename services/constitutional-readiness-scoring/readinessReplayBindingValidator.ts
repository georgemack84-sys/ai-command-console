import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  ReadinessReplayBinding,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function validateReadinessReplayBinding(input: ConstitutionalReadinessInput): {
  replayBinding: ReadinessReplayBinding;
  errors: readonly ConstitutionalReadinessError[];
} {
  const replayBound =
    input.constitutionalReplayResult.replayBinding.replayBound
    && input.humanSupremacyResult.replayBinding.replayBound
    && input.escalationDeterminismResult.replayBinding.replayBound
    && input.antiEmergenceResult.replayBinding.replayBound
    && input.runtimeAdmissibilityResult.governanceBinding.replayBound;
  const governanceBound = input.constitutionalReplayResult.replayBinding.governanceBound;
  const escalationBound = input.escalationDeterminismResult.replayBinding.replayBound;
  const overrideBound = input.constitutionalReplayResult.overridePropagation.operatorSupremacyPreserved;
  const telemetryBound = input.constitutionalTelemetryResult.replayBinding.replayBound;
  const simulationBound = input.constitutionalRuntimeSimulationResult.replayBinding.replayBound;

  const errors: ConstitutionalReadinessError[] = [];
  if (!replayBound || !telemetryBound || !simulationBound) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_REPLAY_BINDING_INVALID",
      message: "Replay binding chain is incomplete across readiness inputs.",
      path: "replayBinding",
    });
  }

  return Object.freeze({
    replayBinding: Object.freeze({
      bindingId: hashReadinessValue("constitutional-readiness-replay-binding-id", {
        readinessId: input.readinessId,
      }),
      replayBound,
      governanceBound,
      escalationBound,
      overrideBound,
      telemetryBound,
      simulationBound,
      deterministicHash: hashReadinessValue("constitutional-readiness-replay-binding", {
        replayBound,
        governanceBound,
        escalationBound,
        overrideBound,
        telemetryBound,
        simulationBound,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
