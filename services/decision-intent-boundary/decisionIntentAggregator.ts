import type { IntentAggregationRecord, IntentRiskLevel } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function aggregateIntentBoundary(input: {
  proposalScore: number;
  confidenceScore: number;
  riskLevel: IntentRiskLevel;
  failClosed: boolean;
}): IntentAggregationRecord {
  return Object.freeze({
    proposalScore: input.proposalScore,
    confidenceScore: input.confidenceScore,
    riskLevel: input.riskLevel,
    failClosed: input.failClosed,
    deterministicHash: hashIntentValue("decision-intent-aggregation", input),
  });
}
