import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectLiveRegistryResolution(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.liveRegistryAccess === true
    || input.metadata?.dynamicRegistryLookup === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_LIVE_REGISTRY_ACCESS",
      message: "Replay attempted live registry resolution instead of immutable snapshot binding.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
