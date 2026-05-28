import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectRecursiveReplayLoop(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.recursiveReplay === true
    || input.metadata?.recursiveReplayLoop === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_RECURSIVE_LOOP",
      message: "Recursive replay loop detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
