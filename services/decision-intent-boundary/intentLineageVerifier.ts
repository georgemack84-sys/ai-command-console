import type { DecisionIntentBoundaryError, DecisionIntentBoundaryInput } from "./decisionIntentStateTypes";

export function verifyIntentLineage(
  input: DecisionIntentBoundaryInput,
): readonly DecisionIntentBoundaryError[] {
  return input.evidenceLineage.length > 0
    && input.governanceLineage.length > 0
    && input.proposalLineage.length > 0
    && input.replayLineage.length > 0
    ? Object.freeze([])
    : Object.freeze([{
      code: "DECISION_INTENT_LINEAGE_GAP",
      message: "Intent lineage is incomplete.",
      path: "lineage",
    }]);
}
