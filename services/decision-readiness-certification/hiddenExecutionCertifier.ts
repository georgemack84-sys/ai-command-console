import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function certifyHiddenExecutionPrevention(
  input: DecisionReadinessCertificationInput,
): readonly DecisionReadinessCertificationError[] {
  return input.hiddenExecutionDetectionResult.report.blocked
    ? Object.freeze([{
      code: "DECISION_READINESS_HIDDEN_EXECUTION" as const,
      message: "Hidden execution findings prevent readiness certification.",
      path: "hiddenExecutionDetectionResult.report",
    }])
    : Object.freeze([]);
}
