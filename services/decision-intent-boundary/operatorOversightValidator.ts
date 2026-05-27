import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function validateOperatorOversight(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.humanSupremacyResult.record.enforcementState !== "INVALID"
    && input.humanSupremacyResult.record.enforcementState !== "DISPUTED"
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_OPERATOR_OVERSIGHT_MISSING",
      message: "Operator oversight could not be certified for decision intent.",
      path: "humanSupremacyResult.record.enforcementState",
    }]);
}
