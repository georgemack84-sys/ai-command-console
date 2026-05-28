import { hashRecommendationValue } from "@/services/recommendation-synthesis/recommendationHashEngine";
import type {
  RecommendationPriority,
  RecommendationPriorityInput,
} from "./types/prioritizationTypes";

const STATUS_ORDER: Record<RecommendationPriority["status"], number> = {
  FAILED_CLOSED: 0,
  FROZEN: 1,
  INVALID: 2,
  PRIORITIZED: 3,
};

const LEVEL_ORDER = {
  governanceSeverity: { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 },
  risk: { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 },
  visibility: { FREEZE_REVIEW: 0, IMMEDIATE_REVIEW: 1, PROMINENT: 2, VISIBLE: 3, NONE: 4 },
  replay: { MISMATCH: 0, MISSING: 1, DEGRADED: 2, VALID: 3 },
  validation: { FAILED: 0, MISSING: 1, WARNING: 2, PASSED: 3 },
  uncertainty: { critical: 0, high: 1, elevated: 2, minimal: 3 },
  confidence: { very_low: 0, low: 1, moderate: 2, high: 3, very_high: 4 },
} as const;

export function buildDeterministicOrderingKey(
  input: RecommendationPriorityInput,
  priority: RecommendationPriority,
): string {
  return hashRecommendationValue("recommendation-prioritization-ordering-key", {
    status: priority.status,
    governanceSeverity: input.governanceSeverity,
    containmentRisk: input.containmentRisk,
    escalationRisk: input.escalationRisk,
    operatorVisibilityRequirement: input.operatorVisibilityRequirement,
    replayIntegrity: input.replayIntegrity,
    validationStatus: input.validationStatus,
    uncertaintyLevel: input.uncertaintyLevel,
    confidenceLevel: input.confidenceLevel,
    prioritizationHash: priority.prioritizationHash,
  });
}

export function orderPrioritiesDeterministically(
  inputs: readonly RecommendationPriorityInput[],
  priorities: readonly RecommendationPriority[],
): RecommendationPriority[] {
  const inputByRecommendationId = new Map(inputs.map((input) => [input.recommendationId, input]));
  const ordered = [...priorities].sort((left, right) => {
    const leftInput = inputByRecommendationId.get(left.recommendationId);
    const rightInput = inputByRecommendationId.get(right.recommendationId);
    if (!leftInput || !rightInput) {
      return left.prioritizationHash.localeCompare(right.prioritizationHash);
    }

    const comparisons = [
      STATUS_ORDER[left.status] - STATUS_ORDER[right.status],
      LEVEL_ORDER.governanceSeverity[leftInput.governanceSeverity] - LEVEL_ORDER.governanceSeverity[rightInput.governanceSeverity],
      LEVEL_ORDER.risk[leftInput.containmentRisk] - LEVEL_ORDER.risk[rightInput.containmentRisk],
      LEVEL_ORDER.risk[leftInput.escalationRisk] - LEVEL_ORDER.risk[rightInput.escalationRisk],
      LEVEL_ORDER.visibility[leftInput.operatorVisibilityRequirement] - LEVEL_ORDER.visibility[rightInput.operatorVisibilityRequirement],
      LEVEL_ORDER.replay[leftInput.replayIntegrity] - LEVEL_ORDER.replay[rightInput.replayIntegrity],
      LEVEL_ORDER.validation[leftInput.validationStatus] - LEVEL_ORDER.validation[rightInput.validationStatus],
      LEVEL_ORDER.uncertainty[leftInput.uncertaintyLevel as keyof typeof LEVEL_ORDER.uncertainty] - LEVEL_ORDER.uncertainty[rightInput.uncertaintyLevel as keyof typeof LEVEL_ORDER.uncertainty],
      LEVEL_ORDER.confidence[leftInput.confidenceLevel as keyof typeof LEVEL_ORDER.confidence] - LEVEL_ORDER.confidence[rightInput.confidenceLevel as keyof typeof LEVEL_ORDER.confidence],
      left.prioritizationHash.localeCompare(right.prioritizationHash),
    ];

    return comparisons.find((value) => value !== 0) ?? 0;
  });

  return ordered.map((priority, index) => {
    const input = inputByRecommendationId.get(priority.recommendationId);
    const deterministicOrderingKey = input
      ? buildDeterministicOrderingKey(input, priority)
      : priority.prioritizationHash;
    return Object.freeze({
      ...priority,
      orderingRank: index + 1,
      deterministicOrderingKey,
    });
  });
}
