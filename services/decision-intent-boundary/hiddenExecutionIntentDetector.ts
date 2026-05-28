import { HIDDEN_AUTHORITY_LANGUAGE, matchingIntentTerms } from "./decisionIntentSchemaRegistry";
import type { DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function detectHiddenExecutionIntent(input: DecisionIntentBoundaryInput): IntentSemanticScanRecord {
  const matchedTerms = matchingIntentTerms(input.summary, HIDDEN_AUTHORITY_LANGUAGE);
  return Object.freeze({
    matchedTerms,
    triggered: matchedTerms.length > 0,
    deterministicHash: hashIntentValue("decision-intent-hidden-execution-intent", matchedTerms),
  });
}
