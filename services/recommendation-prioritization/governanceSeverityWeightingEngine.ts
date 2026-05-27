import type { ConfidenceLevel, UncertaintyLevel } from "@/services/confidence-scoring/types/confidenceScoringTypes";
import type { RecommendationPriorityInput } from "./types/prioritizationTypes";

export const PRIORITIZATION_WEIGHTING_VERSION = "recommendation-prioritization-weighting-v1";

const GOVERNANCE_WEIGHTS: Record<RecommendationPriorityInput["governanceSeverity"], number> = {
  NONE: 0,
  LOW: 8,
  MEDIUM: 16,
  HIGH: 24,
  CRITICAL: 30,
};

const REPLAY_WEIGHTS: Record<RecommendationPriorityInput["replayIntegrity"], number> = {
  VALID: 10,
  DEGRADED: -10,
  MISMATCH: -30,
  MISSING: -30,
};

const VALIDATION_WEIGHTS: Record<RecommendationPriorityInput["validationStatus"], number> = {
  PASSED: 10,
  WARNING: 0,
  FAILED: -25,
  MISSING: -25,
};

const ESCALATION_WEIGHTS: Record<RecommendationPriorityInput["escalationRisk"], number> = {
  NONE: 0,
  LOW: 4,
  MEDIUM: 8,
  HIGH: 12,
  CRITICAL: 15,
};

const CONTAINMENT_WEIGHTS: Record<RecommendationPriorityInput["containmentRisk"], number> = {
  NONE: 0,
  LOW: 5,
  MEDIUM: 10,
  HIGH: 15,
  CRITICAL: 20,
};

const APPROVAL_WEIGHTS: Record<RecommendationPriorityInput["approvalDependencyState"], number> = {
  NONE: 0,
  OPTIONAL_REVIEW: 4,
  REQUIRED_REVIEW: 8,
  BLOCKING_REVIEW: 15,
  UNKNOWN: 10,
};

const VISIBILITY_WEIGHTS: Record<RecommendationPriorityInput["operatorVisibilityRequirement"], number> = {
  NONE: 0,
  VISIBLE: 4,
  PROMINENT: 8,
  IMMEDIATE_REVIEW: 12,
  FREEZE_REVIEW: 15,
};

const CONFIDENCE_WEIGHTS: Record<ConfidenceLevel, number> = {
  very_low: -10,
  low: -5,
  moderate: 0,
  high: 5,
  very_high: 10,
};

const UNCERTAINTY_WEIGHTS: Record<UncertaintyLevel, number> = {
  minimal: 0,
  elevated: 8,
  high: 14,
  critical: 20,
};

export type PrioritizationWeights = Readonly<{
  governanceSeverityWeight: number;
  replayIntegrityWeight: number;
  validationStatusWeight: number;
  escalationRiskWeight: number;
  containmentRiskWeight: number;
  approvalDependencyWeight: number;
  operatorVisibilityWeight: number;
  confidenceAdjustmentWeight: number;
  uncertaintyCautionWeight: number;
  total: number;
}>;

export function buildPrioritizationWeights(input: RecommendationPriorityInput): PrioritizationWeights {
  const governanceSeverityWeight = GOVERNANCE_WEIGHTS[input.governanceSeverity];
  const replayIntegrityWeight = REPLAY_WEIGHTS[input.replayIntegrity];
  const validationStatusWeight = VALIDATION_WEIGHTS[input.validationStatus];
  const escalationRiskWeight = ESCALATION_WEIGHTS[input.escalationRisk];
  const containmentRiskWeight = CONTAINMENT_WEIGHTS[input.containmentRisk];
  const approvalDependencyWeight = APPROVAL_WEIGHTS[input.approvalDependencyState];
  const operatorVisibilityWeight = VISIBILITY_WEIGHTS[input.operatorVisibilityRequirement];
  const confidenceAdjustmentWeight = CONFIDENCE_WEIGHTS[(input.confidenceLevel as ConfidenceLevel) in CONFIDENCE_WEIGHTS
    ? input.confidenceLevel as ConfidenceLevel
    : "very_low"];
  const uncertaintyCautionWeight = UNCERTAINTY_WEIGHTS[(input.uncertaintyLevel as UncertaintyLevel) in UNCERTAINTY_WEIGHTS
    ? input.uncertaintyLevel as UncertaintyLevel
    : "critical"];

  return Object.freeze({
    governanceSeverityWeight,
    replayIntegrityWeight,
    validationStatusWeight,
    escalationRiskWeight,
    containmentRiskWeight,
    approvalDependencyWeight,
    operatorVisibilityWeight,
    confidenceAdjustmentWeight,
    uncertaintyCautionWeight,
    total: Number((
      governanceSeverityWeight
      + replayIntegrityWeight
      + validationStatusWeight
      + escalationRiskWeight
      + containmentRiskWeight
      + approvalDependencyWeight
      + operatorVisibilityWeight
      + confidenceAdjustmentWeight
      + uncertaintyCautionWeight
    ).toFixed(3)),
  });
}
