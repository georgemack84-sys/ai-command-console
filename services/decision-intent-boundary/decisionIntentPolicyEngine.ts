import type { IntentPolicyRecord } from "./decisionIntentStateTypes";
import { hashIntentValue } from "./intentTraceHasher";

export function buildDecisionIntentPolicy(): IntentPolicyRecord {
  return Object.freeze({
    advisoryOnly: true as const,
    operatorReviewRequired: true as const,
    failClosedOnDetection: true as const,
    deterministicHash: hashIntentValue("decision-intent-policy", {
      advisoryOnly: true,
      operatorReviewRequired: true,
      failClosedOnDetection: true,
    }),
  });
}
