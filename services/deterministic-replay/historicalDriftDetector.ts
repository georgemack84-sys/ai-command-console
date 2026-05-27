import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectHistoricalDrift(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.historicalDrift === true
    || input.metadata?.presentStateSubstitution === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_HISTORICAL_DRIFT",
      message: "Historical drift or present-state substitution detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
