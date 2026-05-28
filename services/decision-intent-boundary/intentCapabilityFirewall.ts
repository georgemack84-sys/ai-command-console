import type {
  DecisionIntentBoundaryError,
  IntentSemanticScanRecord,
} from "./decisionIntentStateTypes";

export function enforceIntentCapabilityFirewall(input: {
  capabilityMutation: IntentSemanticScanRecord;
  authorityExpansion: IntentSemanticScanRecord;
}): readonly DecisionIntentBoundaryError[] {
  const errors: DecisionIntentBoundaryError[] = [];
  if (input.capabilityMutation.triggered) {
    errors.push({
      code: "DECISION_INTENT_CAPABILITY_MUTATION",
      message: "Intent attempted capability mutation semantics.",
      path: "summary",
    });
  }
  if (input.authorityExpansion.triggered) {
    errors.push({
      code: "DECISION_INTENT_AUTHORITY_EXPANSION",
      message: "Intent attempted authority expansion semantics.",
      path: "summary",
    });
  }
  return Object.freeze(errors);
}
