import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateHistoricalIntentReplay(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  if (
    input.metadata?.["presentStateSubstitution"] === true
    || input.metadata?.["replayRepair"] === true
    || input.metadata?.["syntheticLineage"] === true
  ) {
    return Object.freeze([{
      code: "DECISION_INTENT_HISTORICAL_REPLAY_INVALID",
      message: "Historical replay validation rejected present-state or synthetic reconstruction.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
