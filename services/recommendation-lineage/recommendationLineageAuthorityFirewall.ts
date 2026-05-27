import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateRecommendationLineageAuthorityFirewall(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  if (input.metadata?.authorityExpansion === true || input.metadata?.dynamicPrivilegeEscalation === true) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_AUTHORITY_EXPANSION",
      message: "Authority expansion markers are forbidden in lineage flows.",
      path: "metadata",
    }]);
  }
  return Object.freeze([]);
}
