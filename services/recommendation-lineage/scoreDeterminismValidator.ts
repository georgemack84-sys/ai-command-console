import type {
  RecommendationLineageError,
  ScoringLineageRecord,
} from "./recommendationLineageStateTypes";

export function validateScoreDeterminism(
  record: ScoringLineageRecord,
): readonly RecommendationLineageError[] {
  if (record.scoringFactors.length > 0 && Object.keys(record.scoringWeights).length > 0) {
    return Object.freeze([]);
  }
  return Object.freeze([{
    code: "RECOMMENDATION_LINEAGE_SCORING_INCONSISTENT",
    message: "Scoring lineage is incomplete or nondeterministic.",
    path: "scoringSnapshot",
  }]);
}
