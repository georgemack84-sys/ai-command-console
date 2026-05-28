import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectReplayApproximation(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.replayApproximation === true
    || input.metadata?.approximateReplay === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_APPROXIMATION",
      message: "Replay approximation is forbidden; historical reconstruction must be exact.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
