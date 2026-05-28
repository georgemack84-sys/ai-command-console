import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateIntentReplayBinding(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.constitutionalCertificationResult.record.replaySafe
    && input.constitutionalReadinessResult.record.replaySafe
    && input.constitutionalReplayResult.record.replayDeterministic
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_REPLAY_BINDING_INVALID",
      message: "Intent replay binding is incomplete.",
      path: "replayBinding",
    }]);
}
