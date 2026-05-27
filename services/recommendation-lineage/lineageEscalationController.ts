import type {
  RecommendationLineageError,
  RecommendationLineageInput,
} from "./recommendationLineageStateTypes";

export function validateLineageEscalation(
  input: RecommendationLineageInput,
): readonly RecommendationLineageError[] {
  return input.metadata?.lineageEscalated === true
    ? Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_ESCALATION_REQUIRED",
      message: "Lineage requires escalated oversight.",
      path: "metadata.lineageEscalated",
    }])
    : Object.freeze([]);
}
