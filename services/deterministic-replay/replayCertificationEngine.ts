import type { DeterministicReplayError, ReplayCertificationRecord } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function certifyReplay(input: {
  errors: readonly DeterministicReplayError[];
  deterministic: boolean;
  governanceValidated: boolean;
  suppressionValidated: boolean;
}): ReplayCertificationRecord {
  const certified =
    input.errors.length === 0
    && input.deterministic
    && input.governanceValidated
    && input.suppressionValidated;
  const reason = certified
    ? "Historical recommendation reconstructed exactly from immutable constitutional snapshots."
    : "Replay failed closed because historical reconstruction diverged from immutable constitutional truth.";
  return Object.freeze({
    certified,
    reason,
    certificationHash: hashReplayValue("replay-certification", {
      certified,
      reason,
      errorCodes: input.errors.map((error) => error.code),
    }),
  });
}
