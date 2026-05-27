import type { DeterministicReplayError, DeterministicReplayInput } from "./types/deterministicReplayTypes";

export function detectSuppressionBypass(input: DeterministicReplayInput): readonly DeterministicReplayError[] {
  return input.metadata?.suppressionBypass === true
    || input.metadata?.restoreSuppressedRecommendation === true
    || input.operatorAuthorityResult.suppression.suppressed !== true
    ? Object.freeze([{
      code: "DETERMINISTIC_REPLAY_SUPPRESSION_BYPASS",
      message: "Replay attempted to bypass or weaken historical suppression state.",
      path: "suppression",
    }])
    : Object.freeze([]);
}
