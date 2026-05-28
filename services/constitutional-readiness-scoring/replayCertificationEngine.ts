import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  ReplayCertificationRecord,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function certifyReplayReadiness(input: ConstitutionalReadinessInput): {
  record: ReplayCertificationRecord;
  errors: readonly ConstitutionalReadinessError[];
} {
  const replayDeterministic =
    input.constitutionalReplayResult.record.replayDeterministic
    && input.constitutionalReplayResult.integrityReport.replayDeterministic
    && input.runtimeAdmissibilityResult.record.replaySafe
    && input.constitutionalTelemetryResult.record.replaySafe
    && input.constitutionalRuntimeSimulationResult.replayBinding.replayBound;
  const lineageBound =
    input.constitutionalReplayResult.lineage.entries.length > 0
    && input.constitutionalTelemetryResult.lineage.entries.length > 0
    && input.constitutionalRuntimeSimulationResult.lineage.entries.length > 0;
  const replaySafe = replayDeterministic && lineageBound;
  const score = replaySafe ? 1 : replayDeterministic ? 0.55 : 0.2;

  const errors: ConstitutionalReadinessError[] = [];
  if (!replayDeterministic) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_REPLAY_NONDETERMINISTIC",
      message: "Replay determinism degraded across upstream constitutional systems.",
      path: "constitutionalReplayResult",
    });
  }
  if (!lineageBound) {
    errors.push({
      code: "CONSTITUTIONAL_READINESS_LINEAGE_INCOMPLETE",
      message: "Replay-safe lineage became incomplete.",
      path: "lineage",
    });
  }

  return Object.freeze({
    record: Object.freeze({
      replayId: input.constitutionalReplayResult.record.replayId,
      replayDeterministic,
      replaySafe,
      lineageBound,
      score,
      deterministicHash: hashReadinessValue("constitutional-readiness-replay-certification", {
        replayId: input.constitutionalReplayResult.record.replayId,
        replayDeterministic,
        replaySafe,
        lineageBound,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
