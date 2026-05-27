import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
  ReplayCertificationRecord,
} from "./certificationStateTypes";
import { hashCertificationValue } from "./certificationTraceHasher";

export function certifyDeterministicReplay(input: ConstitutionalCertificationInput): {
  record: ReplayCertificationRecord;
  errors: readonly ConstitutionalCertificationError[];
} {
  const deterministic =
    input.constitutionalReadinessResult.replayCertification.replayDeterministic
    && input.constitutionalReplayResult.record.replayDeterministic
    && input.constitutionalTelemetryResult.record.replaySafe
    && input.constitutionalRuntimeSimulationResult.replayBinding.replayBound;
  const lineageComplete =
    input.constitutionalReadinessResult.replayCertification.lineageBound
    && input.constitutionalReplayResult.lineage.entries.length > 0;
  const score = deterministic && lineageComplete ? 1 : deterministic ? 0.45 : 0.1;
  const errors: ConstitutionalCertificationError[] = [];
  if (!deterministic) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_REPLAY_NONDETERMINISM",
      message: "Replay determinism could not be certified.",
      path: "replay",
    });
  }
  if (!lineageComplete) {
    errors.push({
      code: "CONSTITUTIONAL_CERTIFICATION_LINEAGE_GAP",
      message: "Replay lineage is incomplete for certification.",
      path: "replayLineage",
    });
  }
  return Object.freeze({
    record: Object.freeze({
      replayId: input.constitutionalReadinessResult.record.replayId,
      deterministic,
      lineageComplete,
      score,
      deterministicHash: hashCertificationValue("constitutional-certification-replay", {
        replayId: input.constitutionalReadinessResult.record.replayId,
        deterministic,
        lineageComplete,
        score,
      }),
    }),
    errors: Object.freeze(errors),
  });
}
