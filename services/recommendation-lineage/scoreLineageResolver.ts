import type {
  RecommendationLineageInput,
  ScoringLineageRecord,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function resolveScoreLineage(input: RecommendationLineageInput): ScoringLineageRecord {
  return Object.freeze({
    scoringSnapshotId: input.scoringSnapshot.scoringSnapshotId,
    scoringFactors: Object.freeze(input.scoringSnapshot.scoringFactors),
    scoringWeights: Object.freeze({ ...input.scoringSnapshot.scoringWeights }),
    arbitrationDecisions: Object.freeze(input.scoringSnapshot.arbitrationDecisions),
    thresholdDecisions: Object.freeze(input.scoringSnapshot.thresholdDecisions),
    rankingLogic: Object.freeze(input.scoringSnapshot.rankingLogic),
    confidenceEvolution: Object.freeze([
      ...input.scoringSnapshot.confidenceReasoning,
      ...input.scoringSnapshot.uncertaintyFactors,
    ]),
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-scoring-record", input.scoringSnapshot),
  });
}
