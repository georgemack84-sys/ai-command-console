import { hashReplayValue } from "./replayHashEngine";
import type { RecommendationReplayInput, RecommendationReplayLineageRecord } from "./types/recommendationReplayTypes";

export function reconstructRecommendationLineage(
  input: RecommendationReplayInput,
): RecommendationReplayLineageRecord {
  const confidence = input.confidenceScoringResult.confidenceScores.find((score) => score.recommendationId === input.recommendationId);
  const constraint = input.recommendationConstraintResult.constrainedRecommendations.find((item) => item.constrainedRecommendation.recommendationId === input.recommendationId);
  const prioritization = input.recommendationPrioritizationResult.lineageRecords.find((item) => item.recommendationId === input.recommendationId);

  const record = {
    replayId: `${input.replayRunId}:${input.recommendationId}`,
    recommendationId: input.recommendationId,
    synthesisEpisodeId: input.recommendationSynthesisInput.synthesisId,
    evidenceLineageId: input.evidenceAggregationResult.lineage.lineageHash,
    governanceLineageId: `governance:${input.recommendationSynthesisInput.recommendationValidationResult.result.governanceSnapshotId}`,
    confidenceLineageId: confidence?.lineage.lineageHash ?? "",
    constraintLineageId: constraint?.constraintHash ?? "",
    prioritizationLineageId: prioritization?.lineageId,
  } satisfies Omit<RecommendationReplayLineageRecord, "lineageHash">;

  return Object.freeze({
    ...record,
    lineageHash: hashReplayValue("recommendation-replay-lineage", record),
  });
}
