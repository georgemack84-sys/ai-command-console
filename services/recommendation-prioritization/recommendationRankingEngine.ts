import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import { buildPrioritizationWeights } from "./governanceSeverityWeightingEngine";
import type {
  PriorityTier,
  PrioritizationStatus,
  RecommendationPriority,
  RecommendationPriorityInput,
} from "./types/prioritizationTypes";

function tierForScore(score: number): PriorityTier {
  if (score >= 85) return "CRITICAL_VISIBILITY";
  if (score >= 70) return "HIGH_VISIBILITY";
  if (score >= 50) return "ELEVATED_VISIBILITY";
  if (score >= 30) return "NORMAL_VISIBILITY";
  if (score >= 10) return "LOW_VISIBILITY";
  return "INFORMATIONAL";
}

export function derivePrioritizationStatus(input: RecommendationPriorityInput): PrioritizationStatus {
  if (input.upstreamFailedClosed) {
    return "FAILED_CLOSED";
  }
  if (input.upstreamFrozen || input.replayIntegrity === "MISMATCH" || input.replayIntegrity === "MISSING" || input.validationStatus === "FAILED" || input.validationStatus === "MISSING") {
    return "FROZEN";
  }
  return "PRIORITIZED";
}

export function rankRecommendationForVisibility(
  input: RecommendationPriorityInput,
): RecommendationPriority {
  const status = derivePrioritizationStatus(input);
  const weights = buildPrioritizationWeights(input);
  const priorityScore = status === "FAILED_CLOSED"
    ? 0
    : status === "FROZEN"
      ? Number(Math.max(weights.total, 85).toFixed(3))
      : weights.total;
  const priorityTier = status === "FAILED_CLOSED"
    ? "CRITICAL_VISIBILITY"
    : status === "FROZEN"
      ? "CRITICAL_VISIBILITY"
      : tierForScore(priorityScore);

  const prioritizationHash = hashRecommendationValue("recommendation-prioritization-priority", {
    prioritizationId: input.prioritizationId,
    recommendationId: input.recommendationId,
    status,
    priorityTier,
    priorityScore,
    weights,
  });

  return Object.freeze({
    prioritizationId: input.prioritizationId,
    recommendationId: input.recommendationId,
    proposalId: input.proposalId,
    status,
    priorityTier,
    priorityScore,
    governanceSeverityWeight: weights.governanceSeverityWeight,
    replayIntegrityWeight: weights.replayIntegrityWeight,
    validationStatusWeight: weights.validationStatusWeight,
    escalationRiskWeight: weights.escalationRiskWeight,
    containmentRiskWeight: weights.containmentRiskWeight,
    approvalDependencyWeight: weights.approvalDependencyWeight,
    operatorVisibilityWeight: weights.operatorVisibilityWeight,
    confidenceAdjustmentWeight: weights.confidenceAdjustmentWeight,
    uncertaintyCautionWeight: weights.uncertaintyCautionWeight,
    orderingRank: 0,
    deterministicOrderingKey: "",
    operatorReviewRequired: true as const,
    executionAuthorized: false as const,
    runtimeMutationOccurred: false as const,
    scheduledActionCreated: false as const,
    authorityChanged: false as const,
    prioritizationHash,
    auditHash: hashRecommendationValue("recommendation-prioritization-audit-hash", {
      prioritizationId: input.prioritizationId,
      recommendationId: input.recommendationId,
      status,
      priorityScore,
    }),
  });
}
