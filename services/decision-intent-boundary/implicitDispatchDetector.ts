import { HIDDEN_DISPATCH_LANGUAGE, matchingIntentTerms } from "./decisionIntentSchemaRegistry";
import type { DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function detectImplicitDispatch(input: DecisionIntentBoundaryInput): IntentSemanticScanRecord {
  const matchedTerms = matchingIntentTerms(input.summary, HIDDEN_DISPATCH_LANGUAGE);
  return Object.freeze({
    matchedTerms,
    triggered: matchedTerms.length > 0,
    deterministicHash: hashIntentValue("decision-intent-implicit-dispatch", matchedTerms),
  });
}
