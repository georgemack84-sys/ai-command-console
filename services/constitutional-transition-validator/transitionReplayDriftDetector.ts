import type { ConstitutionalTransitionError, ConstitutionalTransitionInput } from "./types/constitutionalTransitionTypes";
import { ConstitutionalTransitionErrorCode } from "./types/constitutionalTransitionTypes";

export function detectTransitionReplayDrift(
  input: ConstitutionalTransitionInput,
): readonly ConstitutionalTransitionError[] {
  const replayDriftDetected =
    !input.deterministicReplayResult.result.deterministic
    || !input.deterministicReplayResult.result.replayCertified
    || input.deterministicReplayResult.result.driftDetected
    || input.decisionAuditEpisodeResult.episode.replayHash !== input.deterministicReplayResult.result.replayHash
    || input.metadata?.replayDrift === true
    || input.metadata?.syntheticReplay === true;

  return replayDriftDetected
    ? Object.freeze([{
      code: ConstitutionalTransitionErrorCode.REPLAY_DRIFT_DETECTED,
      message: "Replay drift or replay mismatch was detected.",
      path: "deterministicReplayResult.result",
    }])
    : Object.freeze([]);
}
