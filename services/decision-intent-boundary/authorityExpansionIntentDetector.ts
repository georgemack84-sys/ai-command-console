import type { DecisionIntentBoundaryInput, IntentSemanticScanRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function detectAuthorityExpansionIntent(input: DecisionIntentBoundaryInput): IntentSemanticScanRecord {
  const matches = Object.freeze([
    ...(input.metadata?.["authorityGrant"] === true ? ["authority-grant"] : []),
    ...(input.metadata?.["privilegeExpansion"] === true ? ["privilege-expansion"] : []),
  ]);
  return Object.freeze({
    matchedTerms: matches,
    triggered: matches.length > 0,
    deterministicHash: hashIntentValue("decision-intent-authority-expansion", matches),
  });
}
