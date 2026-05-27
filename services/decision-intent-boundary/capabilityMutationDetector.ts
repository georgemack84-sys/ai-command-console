import type { DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function detectCapabilityMutation(input: DecisionIntentBoundaryInput): IntentSemanticScanRecord {
  const matches = Object.freeze([
    ...(input.metadata?.["capabilityMutation"] === true ? ["capability-mutation"] : []),
    ...(input.metadata?.["dynamicCapability"] === true ? ["dynamic-capability"] : []),
  ]);
  return Object.freeze({
    matchedTerms: matches,
    triggered: matches.length > 0,
    deterministicHash: hashIntentValue("decision-intent-capability-mutation", matches),
  });
}
