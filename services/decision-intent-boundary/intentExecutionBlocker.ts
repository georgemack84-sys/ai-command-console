import type {
  DecisionIntentBoundaryError,
  IntentSemanticScanRecord,
} from "./decisionIntentStateTypes";

export function blockIntentExecution(input: {
  executionSemantics: IntentSemanticScanRecord;
  hiddenExecutionIntent: IntentSemanticScanRecord;
  implicitDispatch: IntentSemanticScanRecord;
}): readonly DecisionIntentBoundaryError[] {
  const errors: DecisionIntentBoundaryError[] = [];
  if (input.executionSemantics.triggered) {
    errors.push({
      code: "DECISION_INTENT_EXECUTION_BLOCKED",
      message: "Execution semantics are constitutionally forbidden in decision intent.",
      path: "summary",
    });
  }
  if (input.hiddenExecutionIntent.triggered || input.implicitDispatch.triggered) {
    errors.push({
      code: "DECISION_INTENT_HIDDEN_EXECUTION",
      message: "Hidden execution or implicit dispatch semantics were detected.",
      path: "summary",
    });
  }
  return Object.freeze(errors);
}
