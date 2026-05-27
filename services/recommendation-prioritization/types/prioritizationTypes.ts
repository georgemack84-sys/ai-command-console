import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConfidenceScoringResult } from "@/services/confidence-scoring/types/confidenceScoringTypes";
import type { RecommendationConstraintResult } from "@/services/recommendation-constraint/types/recommendationConstraintTypes";
import type { RecommendationSynthesisResult } from "@/services/recommendation-synthesis/types/recommendationSynthesisTypes";

export type PriorityTier =
  | "CRITICAL_VISIBILITY"
  | "HIGH_VISIBILITY"
  | "ELEVATED_VISIBILITY"
  | "NORMAL_VISIBILITY"
  | "LOW_VISIBILITY"
  | "INFORMATIONAL";

export type PrioritizationStatus =
  | "PRIORITIZED"
  | "FROZEN"
  | "FAILED_CLOSED"
  | "INVALID";

export interface RecommendationPriorityInput {
  prioritizationId: string;
  recommendationId: string;
  proposalId?: string;

  governanceSnapshotId: string;
  replaySnapshotId: string;
  confidenceScoreId: string;
  constraintEvaluationId: string;

  governanceSeverity: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  replayIntegrity: "VALID" | "DEGRADED" | "MISMATCH" | "MISSING";
  validationStatus: "PASSED" | "WARNING" | "FAILED" | "MISSING";
  escalationRisk: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  containmentRisk: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  approvalDependencyState:
    | "NONE"
    | "OPTIONAL_REVIEW"
    | "REQUIRED_REVIEW"
    | "BLOCKING_REVIEW"
    | "UNKNOWN";

  operatorVisibilityRequirement:
    | "NONE"
    | "VISIBLE"
    | "PROMINENT"
    | "IMMEDIATE_REVIEW"
    | "FREEZE_REVIEW";

  confidenceLevel: string;
  uncertaintyLevel: string;

  upstreamFrozen: boolean;
  upstreamFailedClosed: boolean;

  executionAuthorized: false;
  runtimeMutationAllowed: false;
  schedulingAllowed: false;
  authorityMutationAllowed: false;
}

export interface RecommendationPriority {
  prioritizationId: string;
  recommendationId: string;
  proposalId?: string;

  status: PrioritizationStatus;
  priorityTier: PriorityTier;
  priorityScore: number;

  governanceSeverityWeight: number;
  replayIntegrityWeight: number;
  validationStatusWeight: number;
  escalationRiskWeight: number;
  containmentRiskWeight: number;
  approvalDependencyWeight: number;
  operatorVisibilityWeight: number;
  confidenceAdjustmentWeight: number;
  uncertaintyCautionWeight: number;

  orderingRank: number;
  deterministicOrderingKey: string;

  operatorReviewRequired: true;

  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;

  prioritizationHash: string;
  auditHash: string;
}

export interface PrioritizationResult {
  prioritizationRunId: string;
  status: "COMPLETED" | "FROZEN" | "FAILED_CLOSED";

  priorities: RecommendationPriority[];

  frozenRecommendationIds: string[];
  failedClosedRecommendationIds: string[];

  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;

  resultHash: string;
  auditHash: string;
}

export type PrioritizationErrorCode =
  | "PRIORITIZATION_INVALID_INPUT"
  | "PRIORITIZATION_MISSING_GOVERNANCE_SNAPSHOT"
  | "PRIORITIZATION_MISSING_REPLAY_SNAPSHOT"
  | "PRIORITIZATION_MISSING_CONFIDENCE_SCORE"
  | "PRIORITIZATION_MISSING_CONSTRAINT_EVALUATION"
  | "PRIORITIZATION_INVALID_AUTHORITY_FLAGS"
  | "PRIORITIZATION_UNKNOWN_STATE"
  | "PRIORITIZATION_GOVERNANCE_AMBIGUITY"
  | "PRIORITIZATION_REPLAY_MISMATCH"
  | "PRIORITIZATION_CONFIDENCE_FROZEN"
  | "PRIORITIZATION_UPSTREAM_FAILED_CLOSED"
  | "PRIORITIZATION_HIDDEN_EXECUTION"
  | "PRIORITIZATION_ANTI_EMERGENCE"
  | "PRIORITIZATION_AUTHORITY_EXPANSION"
  | "PRIORITIZATION_SCHEDULER_REFERENCE"
  | "PRIORITIZATION_RUNTIME_MUTATOR_REFERENCE"
  | "PRIORITIZATION_ORCHESTRATION_REFERENCE"
  | "PRIORITIZATION_NON_DETERMINISTIC_ORDERING"
  | "PRIORITIZATION_RECOMMENDATION_HASH_MISMATCH"
  | "PRIORITIZATION_FAIL_CLOSED";

export type PrioritizationError = Readonly<{
  code: PrioritizationErrorCode;
  message: string;
  path: string;
}>;

export type PrioritizationAuditEventType =
  | "PRIORITIZATION_REQUESTED"
  | "PRIORITIZATION_VALIDATED"
  | "PRIORITIZATION_WEIGHTED"
  | "PRIORITIZATION_ORDERED"
  | "PRIORITIZATION_COMPLETED"
  | "PRIORITIZATION_FROZEN"
  | "PRIORITIZATION_FAILED_CLOSED"
  | "HIDDEN_EXECUTION_DETECTED"
  | "AUTHORITY_EXPANSION_BLOCKED"
  | "REPLAY_MISMATCH_DETECTED";

export type PrioritizationAuditEvent = Readonly<{
  eventId: string;
  prioritizationId: string;
  recommendationId: string;
  eventType: PrioritizationAuditEventType;
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
  entryHash: string;
  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;
}>;

export type PrioritizationReplayRecord = Readonly<{
  recommendationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  confidenceScoreId: string;
  constraintEvaluationId: string;
  weightingVersion: string;
  orderingVersion: string;
  prioritizationHash: string;
  replayRecordHash: string;
}>;

export type PrioritizationLineageRecord = Readonly<{
  lineageId: string;
  recommendationId: string;
  sourceRecommendationId: string;
  sourceConstraintResultHash: string;
  sourceConfidenceResultHash: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  weightsUsed: Readonly<Record<string, number>>;
  orderingKey: string;
  finalPrioritizationHash: string;
  lineageHash: string;
}>;

export type PrioritizationSerializationRecord = Readonly<{
  prioritizationId: string;
  canonicalForm: string;
  serializationHash: string;
}>;

export type PrioritizationStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type PrioritizationFreezeRecord = Readonly<{
  frozen: boolean;
  failedClosed: boolean;
  reasons: readonly PrioritizationErrorCode[];
  freezeHash: string;
}>;

export type RecommendationPrioritizationInput = Readonly<{
  prioritizationRunId: string;
  createdAt: string;
  constitutionalVersion: string;
  weightingVersion: string;
  orderingVersion: string;
  inputs: readonly RecommendationPriorityInput[];
  recommendationSynthesisResult: RecommendationSynthesisResult;
  recommendationConstraintResult: RecommendationConstraintResult;
  confidenceScoringResult: ConfidenceScoringResult;
  existingAuditLedger?: readonly PrioritizationLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type PrioritizationLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type RecommendationPrioritizationEngineResult = Readonly<{
  result: PrioritizationResult;
  replayRecords: readonly PrioritizationReplayRecord[];
  lineageRecords: readonly PrioritizationLineageRecord[];
  serializationRecords: readonly PrioritizationSerializationRecord[];
  auditEvents: readonly PrioritizationAuditEvent[];
  auditLedger: readonly PrioritizationLedgerEntry[];
  freeze: PrioritizationFreezeRecord;
  stages: readonly PrioritizationStageRecord[];
  errors: readonly PrioritizationError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
