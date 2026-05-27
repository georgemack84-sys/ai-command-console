import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentReplay(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.constitutionalReplayResult.record.replayDeterministic
    && input.constitutionalReadinessResult.record.replaySafe
    && input.constitutionalCertificationResult.record.replaySafe
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_REPLAY_INVALID",
      message: "Intent replay binding failed deterministic validation.",
      path: "replay",
    }]);
}
