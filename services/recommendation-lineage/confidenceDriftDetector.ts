import type {
  RecommendationLineageError,
  RecommendationLineageInput,
  ScoringLineageRecord,
} from "./recommendationLineageStateTypes";

export function detectConfidenceDrift(input: {
  lineageInput: RecommendationLineageInput;
  record: ScoringLineageRecord;
}): readonly RecommendationLineageError[] {
  if (input.lineageInput.metadata?.confidenceDrift === true || input.record.confidenceEvolution.length === 0) {
    return Object.freeze([{
      code: "RECOMMENDATION_LINEAGE_SCORING_INCONSISTENT",
      message: "Confidence lineage drift was detected.",
      path: "scoringSnapshot",
    }]);
  }
  return Object.freeze([]);
}
