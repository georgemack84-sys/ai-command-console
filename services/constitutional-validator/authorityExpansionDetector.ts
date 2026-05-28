import type { ExecutionSemanticDetection, RecommendationValidationInput } from "./types/recommendationValidationTypes";

export function detectRecommendationAuthorityExpansion(
  input: RecommendationValidationInput,
): ExecutionSemanticDetection {
  const detected =
    input.metadata?.authorityExpansion === true
    || input.metadata?.privilegeElevation === true
    || input.recommendationLineageResult.errors.some((error) => error.code === "RECOMMENDATION_LINEAGE_AUTHORITY_EXPANSION");
  return Object.freeze({
    detected,
    semanticType: "AUTHORITY_ESCALATION",
    confidence: detected ? 1 : 0,
    evidence: detected ? ["authorityExpansion"] : [],
    blocked: detected,
  });
}
