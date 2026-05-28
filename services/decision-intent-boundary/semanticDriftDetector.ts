import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function detectSemanticDrift(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.metadata?.["semanticDrift"] === true
    ? Object.freeze([{
      code: "DECISION_INTENT_SEMANTIC_DRIFT",
      message: "Semantic drift marker detected in intent generation.",
      path: "metadata",
    }])
    : Object.freeze([]);
}
