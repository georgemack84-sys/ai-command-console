import type {
  RecommendationLineageError,
  RecommendationLineageInput,
  ScoringLineageRecord,
} from "./recommendationLineageStateTypes";
import { trackConfidenceLineage } from "./confidenceLineageTracker";
import { resolveScoreLineage } from "./scoreLineageResolver";
import { validateScoreDeterminism } from "./scoreDeterminismValidator";

export function buildScoringLineage(input: RecommendationLineageInput): {
  record: ScoringLineageRecord;
  confidenceHistory: readonly string[];
  errors: readonly RecommendationLineageError[];
} {
  const record = resolveScoreLineage(input);
  return Object.freeze({
    record,
    confidenceHistory: trackConfidenceLineage(input),
    errors: validateScoreDeterminism(record),
  });
}
