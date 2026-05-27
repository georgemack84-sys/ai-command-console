import type { ExecutionSemanticDetection, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectSchedulerSemantics(input: RecommendationValidationInput): ExecutionSemanticDetection {
  const text = input.decisionIntentBoundaryResult.artifact.summary.toLowerCase();
  const evidence = ["schedule", "cron", "retry", "background worker"].filter((term) => text.includes(term));
  const detected = evidence.length > 0 || input.metadata?.schedulerPayload === true;
  return Object.freeze({
    detected,
    semanticType: "SCHEDULER_PAYLOAD",
    confidence: detected ? 1 : 0,
    evidence,
    blocked: detected,
  });
}
