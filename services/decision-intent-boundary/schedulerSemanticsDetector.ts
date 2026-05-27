import { SCHEDULER_LANGUAGE, matchingIntentTerms } from "./decisionIntentSchemaRegistry";
import type { DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function detectSchedulerSemantics(input: DecisionIntentBoundaryInput): IntentSemanticScanRecord {
  const matchedTerms = matchingIntentTerms(input.summary, SCHEDULER_LANGUAGE);
  return Object.freeze({
    matchedTerms,
    triggered: matchedTerms.length > 0,
    deterministicHash: hashIntentValue("decision-intent-scheduler-semantics", matchedTerms),
  });
}
