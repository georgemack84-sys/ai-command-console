import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateBoundedPlanning(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  if (input.intentType !== "bounded_plan") {
    return Object.freeze([]);
  }
  return input.summary.length <= 400
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_SEMANTIC_DRIFT",
      message: "Bounded planning exceeded safe semantic bounds.",
      path: "summary",
    }]);
}
