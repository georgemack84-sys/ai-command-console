import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectAuthorityRestoration(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.authorityRestoration === true
    || input.metadata?.restoreAuthority === true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_AUTHORITY_RESTORATION",
      message: "Replay attempted to restore historical authority or suppression state.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
