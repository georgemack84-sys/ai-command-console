import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectReplayRepair(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.replayRepair === true
    || input.metadata?.repairCorruptedReplay === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_REPAIR_ATTEMPT",
      message: "Replay repair attempts are forbidden.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
