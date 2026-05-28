import { EXECUTION_LANGUAGE, matchingIntentTerms } from "./decisionIntentSchemaRegistry";
import type { DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function detectExecutionSemantics(input: DecisionIntentBoundaryInput): IntentSemanticScanRecord {
  const matchedTerms = matchingIntentTerms(input.summary, EXECUTION_LANGUAGE);
  return Object.freeze({
    matchedTerms,
    triggered: matchedTerms.length > 0,
    deterministicHash: hashIntentValue("decision-intent-execution-semantics", matchedTerms),
  });
}
