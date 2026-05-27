import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { RecommendationPriority, RecommendationPriorityInput, PrioritizationReplayRecord } from "./types/prioritizationTypes";

export function bindPrioritizationReplay(
  input: RecommendationPriorityInput,
  priority: RecommendationPriority,
  versions: { weightingVersion: string; orderingVersion: string },
): PrioritizationReplayRecord {
  const replayRecordHash = hashRecommendationValue("recommendation-prioritization-replay-record", {
    recommendationId: input.recommendationId,
    governanceSnapshotId: input.governanceSnapshotId,
    replaySnapshotId: input.replaySnapshotId,
    confidenceScoreId: input.confidenceScoreId,
    constraintEvaluationId: input.constraintEvaluationId,
    weightingVersion: versions.weightingVersion,
    orderingVersion: versions.orderingVersion,
    prioritizationHash: priority.prioritizationHash,
  });

  return Object.freeze({
    recommendationId: input.recommendationId,
    governanceSnapshotId: input.governanceSnapshotId,
    replaySnapshotId: input.replaySnapshotId,
    confidenceScoreId: input.confidenceScoreId,
    constraintEvaluationId: input.constraintEvaluationId,
    weightingVersion: versions.weightingVersion,
    orderingVersion: versions.orderingVersion,
    prioritizationHash: priority.prioritizationHash,
    replayRecordHash,
  });
}
