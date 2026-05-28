import type { ExecutionSemanticDetection, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectRecursiveCoordination(
  input: RecommendationValidationInput,
): ExecutionSemanticDetection {
  const detected =
    input.metadata?.recursiveCoordination === true
    || input.metadata?.recursivePlanning === true;
  return Object.freeze({
    detected,
    semanticType: "RETRY_COORDINATION",
    confidence: detected ? 1 : 0,
    evidence: detected ? ["recursiveCoordination"] : [],
    blocked: detected,
  });
}
