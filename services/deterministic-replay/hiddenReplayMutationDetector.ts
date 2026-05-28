import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectHiddenReplayMutation(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.replayMutation === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_HIDDEN_MUTATION",
      message: "Replay mutation attempt detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
