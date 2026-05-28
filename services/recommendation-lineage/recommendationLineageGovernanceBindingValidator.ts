import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateRecommendationLineageGovernanceBinding(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  if (
    input.constitutionalCertificationResult.record.governanceBound
    && input.constitutionalReadinessResult.record.governanceBound
    && input.humanSupremacyResult.record.governanceBound
  ) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "RECOMMENDATION_LINEAGE_GOVERNANCE_BINDING_INVALID",
    message: "Recommendation lineage governance binding is incomplete.",
    path: "governanceBinding",
  }]);
}
