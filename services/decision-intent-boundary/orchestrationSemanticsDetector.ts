import { ORCHESTRATION_LANGUAGE, matchingIntentTerms } from "./decisionIntentSchemaRegistry";
import type { DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function detectOrchestrationSemantics(input: DecisionIntentBoundaryInput): IntentSemanticScanRecord {
  const matchedTerms = matchingIntentTerms(input.summary, ORCHESTRATION_LANGUAGE);
  return Object.freeze({
    matchedTerms,
    triggered: matchedTerms.length > 0,
    deterministicHash: hashIntentValue("decision-intent-orchestration-semantics", matchedTerms),
  });
}
