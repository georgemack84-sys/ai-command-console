import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateLineageRevocation(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  return input.metadata?.lineageRevoked === true
    ? Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_REVOCATION_REQUIRED",
      message: "Lineage validity has been revoked by operator or governance state.",
      path: "metadata.lineageRevoked",
    }])
    : Object.freeze([]);
}
