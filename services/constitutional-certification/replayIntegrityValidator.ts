import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateReplayIntegrity(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  if (
    input.constitutionalReplayResult.integrityReport.replayDeterministic
    && input.constitutionalReadinessResult.record.replaySafe
  ) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "CONSTITUTIONAL_CERTIFICATION_REPLAY_MISMATCH",
    message: "Replay integrity validation failed.",
    path: "constitutionalReplayResult.integrityReport",
  }]);
}
