import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConfidenceScoringInput, ConfidenceScoringResult } from "@/services/confidence-scoring/types/confidenceScoringTypes";
import type { EvidenceAggregationInput, EvidenceAggregationResult } from "@/services/evidence-aggregation/types/evidenceAggregationTypes";
import type { RecommendationPrioritizationEngineResult, RecommendationPrioritizationInput } from "@/services/recommendation-prioritization/types/prioritizationTypes";
import type { RecommendationConstraintInput, RecommendationConstraintResult } from "@/services/recommendation-constraint/types/recommendationConstraintTypes";
import type { RecommendationSynthesisInput, RecommendationSynthesisResult } from "@/services/recommendation-synthesis/types/recommendationSynthesisTypes";

export interface RecommendationReplayEpisode {
  replayId: string;
  recommendationId: string;
  replayTimestamp: string;
  lineage: {
    synthesisEpisodeId: string;
    evidenceLineageId: string;
    governanceLineageId: string;
    confidenceLineageId: string;
    constraintLineageId: string;
    prioritizationLineageId?: string;
  };
  evidenceReplay: {
    evidenceHashes: string[];
    normalizedEvidenceRefs: string[];
    deterministicOrdering: string[];
  };
  governanceReplay: {
    governanceSnapshotId: string;
    policySnapshotId: string;
    containmentState: string;
    escalationState: string;
  };
  confidenceReplay: {
    confidenceModelVersion: string;
    confidenceScore: number;
    weightingLineage: string[];
  };
  constraintReplay: {
    scopeCeiling: string;
    escalationCeiling: string;
    authorityRestrictions: string[];
  };
  validation: {
    deterministicReplayVerified: boolean;
    lineageIntegrityVerified: boolean;
    governanceConsistencyVerified: boolean;
  };
  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;
  operatorReviewRequired: true;
  replayHash: string;
}

export type RecommendationReplayStatus =
  | "COMPLETED"
  | "FROZEN"
  | "FAILED_CLOSED"
  | "INVALID";

export type RecommendationReplayErrorCode =
  | "RECOMMENDATION_REPLAY_INVALID_INPUT"
  | "RECOMMENDATION_REPLAY_MISSING_LINEAGE"
  | "RECOMMENDATION_REPLAY_EVIDENCE_MISMATCH"
  | "RECOMMENDATION_REPLAY_GOVERNANCE_MISMATCH"
  | "RECOMMENDATION_REPLAY_CONFIDENCE_INCONSISTENCY"
  | "RECOMMENDATION_REPLAY_CONSTRAINT_MISMATCH"
  | "RECOMMENDATION_REPLAY_HASH_MISMATCH"
  | "RECOMMENDATION_REPLAY_DRIFT"
  | "RECOMMENDATION_REPLAY_UNKNOWN_STATE"
  | "RECOMMENDATION_REPLAY_HIDDEN_EXECUTION"
  | "RECOMMENDATION_REPLAY_ANTI_EMERGENCE"
  | "RECOMMENDATION_REPLAY_AUDIT_FAILURE"
  | "RECOMMENDATION_REPLAY_OPERATOR_REVIEW_REQUIRED"
  | "RECOMMENDATION_REPLAY_FAIL_CLOSED";

export type RecommendationReplayError = Readonly<{
  code: RecommendationReplayErrorCode;
  message: string;
  path: string;
}>;

export type RecommendationReplayInput = Readonly<{
  replayRunId: string;
  replayTimestamp: string;
  constitutionalVersion: string;
  recommendationId: string;
  recommendationSynthesisInput: RecommendationSynthesisInput;
  recommendationSynthesisResult: RecommendationSynthesisResult;
  evidenceAggregationInput: EvidenceAggregationInput;
  evidenceAggregationResult: EvidenceAggregationResult;
  recommendationConstraintInput: RecommendationConstraintInput;
  recommendationConstraintResult: RecommendationConstraintResult;
  confidenceScoringInput: ConfidenceScoringInput;
  confidenceScoringResult: ConfidenceScoringResult;
  recommendationPrioritizationInput: RecommendationPrioritizationInput;
  recommendationPrioritizationResult: RecommendationPrioritizationEngineResult;
  existingAuditLedger?: readonly RecommendationReplayLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type RecommendationReplayLineageRecord = Readonly<{
  replayId: string;
  recommendationId: string;
  synthesisEpisodeId: string;
  evidenceLineageId: string;
  governanceLineageId: string;
  confidenceLineageId: string;
  constraintLineageId: string;
  prioritizationLineageId?: string;
  lineageHash: string;
}>;

export type RecommendationReplayAuditRecord = Readonly<{
  auditId: string;
  replayId: string;
  recommendationId: string;
  eventType:
    | "REPLAY_REQUESTED"
    | "REPLAY_RECONSTRUCTED"
    | "REPLAY_VALIDATED"
    | "REPLAY_FROZEN"
    | "REPLAY_FAILED_CLOSED"
    | "REPLAY_MISMATCH_DETECTED"
    | "REPLAY_ANTI_EMERGENCE_BLOCKED";
  replayHash: string;
  timestamp: string;
  previousEntryHash?: string;
  entryHash: string;
  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;
  operatorReviewRequired: true;
}>;

export type RecommendationReplayStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type RecommendationReplayFreezeRecord = Readonly<{
  frozen: boolean;
  failedClosed: boolean;
  reasons: readonly RecommendationReplayErrorCode[];
  freezeHash: string;
}>;

export type RecommendationReplayValidationRecord = Readonly<{
  recommendationId: string;
  deterministicReplayVerified: boolean;
  lineageIntegrityVerified: boolean;
  governanceConsistencyVerified: boolean;
  validationHash: string;
}>;

export type RecommendationReplayLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type RecommendationReplayResult = Readonly<{
  status: RecommendationReplayStatus;
  episodes: readonly RecommendationReplayEpisode[];
  lineageRecords: readonly RecommendationReplayLineageRecord[];
  validationRecords: readonly RecommendationReplayValidationRecord[];
  auditRecords: readonly RecommendationReplayAuditRecord[];
  auditLedger: readonly RecommendationReplayLedgerEntry[];
  freeze: RecommendationReplayFreezeRecord;
  stages: readonly RecommendationReplayStageRecord[];
  errors: readonly RecommendationReplayError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
