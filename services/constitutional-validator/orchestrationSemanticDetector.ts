import type { ExecutionSemanticDetection, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectOrchestrationSemantics(input: RecommendationValidationInput): ExecutionSemanticDetection {
  const text = input.decisionIntentBoundaryResult.artifact.summary.toLowerCase();
  const evidence = ["orchestrate", "workflow", "coordination activation"].filter((term) => text.includes(term));
  const detected = evidence.length > 0 || input.metadata?.orchestrationTrigger === true;
  return Object.freeze({
    detected,
    semanticType: "ORCHESTRATION_TRIGGER",
    confidence: detected ? 1 : 0,
    evidence,
    blocked: detected,
  });
}
