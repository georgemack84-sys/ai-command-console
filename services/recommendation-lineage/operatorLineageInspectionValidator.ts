import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateOperatorLineageInspection(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  if (input.decisionIntentBoundaryResult.artifact.operatorReviewRequired) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "RECOMMENDATION_LINEAGE_OPERATOR_INTERVENTION_MISSING",
    message: "Operator inspection authority must remain available.",
    path: "operatorReviewRequired",
  }]);
}
