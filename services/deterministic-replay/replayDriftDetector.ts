import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectReplayDrift(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.replayHashMismatch === true
    || input.metadata?.replayCorruption === true
    || !input.recommendationValidationResult.result.replayValidated
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_HASH_MISMATCH",
      message: "Replay hash mismatch or replay corruption detected.",
      path: "replay",
    }])
    : Object.freeze([]);
}
