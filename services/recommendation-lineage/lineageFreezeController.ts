import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateLineageFreezeControl(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  return input.metadata?.lineageFrozen === true
    ? Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_FREEZE_REQUIRED",
      message: "Lineage is frozen pending operator review.",
      path: "metadata.lineageFrozen",
    }])
    : Object.freeze([]);
}
