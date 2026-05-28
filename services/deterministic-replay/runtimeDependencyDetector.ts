import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectRuntimeDependency(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.runtimeDependency === true
    || input.metadata?.liveRuntimeLookup === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_RUNTIME_DEPENDENCY",
      message: "Replay attempted to resolve dependencies from runtime state.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
