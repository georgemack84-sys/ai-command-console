import type { DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function detectRuntimeBindings(input: DecisionIntentBoundaryInput): IntentSemanticScanRecord {
  const matches = Object.freeze([
    ...(input.metadata?.["runtimeBinding"] === true ? ["runtime-binding"] : []),
    ...(input.metadata?.["runtimeInvocation"] === true ? ["runtime-invocation"] : []),
  ]);
  return Object.freeze({
    matchedTerms: matches,
    triggered: matches.length > 0,
    deterministicHash: hashIntentValue("decision-intent-runtime-bindings", matches),
  });
}
