import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectDynamicDependencySubstitution(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.dynamicDependencySubstitution === true
    || input.metadata?.dependencySubstitution === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_DYNAMIC_SUBSTITUTION",
      message: "Replay dependency substitution attempt detected.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
