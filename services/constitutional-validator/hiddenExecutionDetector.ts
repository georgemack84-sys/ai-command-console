import type { ExecutionSemanticDetection, RecommendationValidationInput } from "./types/recommendationValidationTypes";
import { EXECUTION_SEMANTIC_TERMS } from "./constants/executionSemanticTerms";
import { hashValidationValue } from "./validationHashEngine";

export function detectHiddenExecution(input: RecommendationValidationInput): ExecutionSemanticDetection {
  const text = `${input.decisionIntentBoundaryResult.artifact.summary} ${input.metadata?.freeText ?? ""}`.toLowerCase();
  const evidence = EXECUTION_SEMANTIC_TERMS.filter((term) => text.includes(term));
  const detected = evidence.some((term) => ["execute", "dispatch", "invoke", "runtime", "trigger execution"].includes(term))
    || input.metadata?.executionPayload === true;
  return Object.freeze({
    detected,
    semanticType: "EXECUTION_DISPATCH",
    confidence: detected ? 1 : 0,
    evidence,
    blocked: detected,
  });
}
