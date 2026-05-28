import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateRecommendationLineageContainmentBoundary(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  if (
    input.constitutionalCertificationResult.record.failClosed
    || input.metadata?.containmentWeakening === true
    || input.metadata?.syntheticAncestryReconstruction === true
  ) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_CONTAINMENT_FAILURE",
      message: "Containment dominance was not preserved for lineage certification.",
      path: "containment",
    }]);
  }
  return Object.freeze([]);
}
