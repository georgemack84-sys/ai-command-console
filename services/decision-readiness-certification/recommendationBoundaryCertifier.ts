import type { DecisionReadinessCertificationInput, DecisionReadinessCertificationError } from "./types/decisionReadinessCertificationTypes";

export function certifyRecommendationBoundary(input: DecisionReadinessCertificationInput): readonly DecisionReadinessCertificationError[] {
  const unstable =
    !input.recommendationValidationResult.result.containmentValidated
    || input.recommendationValidationResult.result.executionRiskDetected
    || !input.recommendationValidationResult.result.advisoryOnly;
  return unstable
    ? Object.freeze([{
      code: "DECISION_READINESS_CONTAINMENT_INSTABILITY" as const,
      message: "Recommendation boundary containment did not remain stable.",
      path: "recommendationValidationResult.result",
    }])
    : Object.freeze([]);
}
