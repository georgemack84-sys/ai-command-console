import type {
  ConstitutionalCertificationError,
  ConstitutionalCertificationInput,
} from "./certificationStateTypes";

export function validateReplayDrift(
  input: ConstitutionalCertificationInput,
): readonly ConstitutionalCertificationError[] {
  return input.constitutionalReplayResult.integrityReport.driftDetected
    ? Object.freeze([{
      code: "CONSTITUTIONAL_CERTIFICATION_REPLAY_MISMATCH",
      message: "Replay drift was detected.",
      path: "constitutionalReplayResult.integrityReport.driftDetected",
    }])
    : Object.freeze([]);
}
