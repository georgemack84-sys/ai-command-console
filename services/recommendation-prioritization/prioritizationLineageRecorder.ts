import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type { PrioritizationLineageRecord, RecommendationPriority, RecommendationPriorityInput } from "./types/prioritizationTypes";

export function recordPrioritizationLineage(input: {
  priorityInput: RecommendationPriorityInput;
  priority: RecommendationPriority;
  sourceConstraintResultHash: string;
  sourceConfidenceResultHash: string;
}): PrioritizationLineageRecord {
  const weightsUsed = Object.freeze({
    governanceSeverityWeight: input.priority.governanceSeverityWeight,
    replayIntegrityWeight: input.priority.replayIntegrityWeight,
    validationStatusWeight: input.priority.validationStatusWeight,
    escalationRiskWeight: input.priority.escalationRiskWeight,
    containmentRiskWeight: input.priority.containmentRiskWeight,
    approvalDependencyWeight: input.priority.approvalDependencyWeight,
    operatorVisibilityWeight: input.priority.operatorVisibilityWeight,
    confidenceAdjustmentWeight: input.priority.confidenceAdjustmentWeight,
    uncertaintyCautionWeight: input.priority.uncertaintyCautionWeight,
  });
  const lineageHash = hashRecommendationValue("recommendation-prioritization-lineage", {
    recommendationId: input.priorityInput.recommendationId,
    sourceConstraintResultHash: input.sourceConstraintResultHash,
    sourceConfidenceResultHash: input.sourceConfidenceResultHash,
    governanceSnapshotId: input.priorityInput.governanceSnapshotId,
    replaySnapshotId: input.priorityInput.replaySnapshotId,
    weightsUsed,
    orderingKey: input.priority.deterministicOrderingKey,
    prioritizationHash: input.priority.prioritizationHash,
  });

  return Object.freeze({
    lineageId: `${input.priorityInput.prioritizationId}:lineage`,
    recommendationId: input.priorityInput.recommendationId,
    sourceRecommendationId: input.priorityInput.recommendationId,
    sourceConstraintResultHash: input.sourceConstraintResultHash,
    sourceConfidenceResultHash: input.sourceConfidenceResultHash,
    governanceSnapshotId: input.priorityInput.governanceSnapshotId,
    replaySnapshotId: input.priorityInput.replaySnapshotId,
    weightsUsed,
    orderingKey: input.priority.deterministicOrderingKey,
    finalPrioritizationHash: input.priority.prioritizationHash,
    lineageHash,
  });
}
