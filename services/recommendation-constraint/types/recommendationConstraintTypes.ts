import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { EvidenceAggregationResult } from "@/services/evidence-aggregation/types/evidenceAggregationTypes";
import type { Recommendation, RecommendationEnvelope, RecommendationSynthesisInput, RecommendationSynthesisResult } from "@/services/recommendation-synthesis/types/recommendationSynthesisTypes";

export interface ConstraintAuditRecord {
  auditId: string;
  recommendationId: string;
  constraintPhase: string;
  constraintType:
    | "scope"
    | "governance"
    | "authority"
    | "escalation"
    | "replay"
    | "containment"
    | "sanitization";
  evaluationResult:
    | "allowed"
    | "restricted"
    | "blocked"
    | "sanitized"
    | "frozen";
  governanceSnapshotId: string;
  policySnapshotId: string;
  replaySnapshotId: string;
  evidenceReferences: string[];
  createdAt: string;
}

export type RecommendationConstraintErrorCode =
  | "RECOMMENDATION_CONSTRAINT_INVALID_INPUT"
  | "RECOMMENDATION_CONSTRAINT_SCOPE_CEILING_EXCEEDED"
  | "RECOMMENDATION_CONSTRAINT_GOVERNANCE_AMBIGUITY"
  | "RECOMMENDATION_CONSTRAINT_AUTHORITY_AMBIGUITY"
  | "RECOMMENDATION_CONSTRAINT_ESCALATION_OVERFLOW"
  | "RECOMMENDATION_CONSTRAINT_REPLAY_MISMATCH"
  | "RECOMMENDATION_CONSTRAINT_CONTAINMENT_VIOLATION"
  | "RECOMMENDATION_CONSTRAINT_EXECUTION_SEMANTIC"
  | "RECOMMENDATION_CONSTRAINT_SCHEDULING_SEMANTIC"
  | "RECOMMENDATION_CONSTRAINT_HIDDEN_ORCHESTRATION"
  | "RECOMMENDATION_CONSTRAINT_CONSTRAINT_CORRUPTION"
  | "RECOMMENDATION_CONSTRAINT_MISSING_LINEAGE"
  | "RECOMMENDATION_CONSTRAINT_POLICY_MISMATCH"
  | "RECOMMENDATION_CONSTRAINT_RECURSIVE_ESCALATION"
  | "RECOMMENDATION_CONSTRAINT_CAPABILITY_EXPANSION"
  | "RECOMMENDATION_CONSTRAINT_CANONICALIZATION_MISMATCH"
  | "RECOMMENDATION_CONSTRAINT_FAIL_CLOSED";

export type RecommendationConstraintError = Readonly<{
  code: RecommendationConstraintErrorCode;
  message: string;
  path: string;
}>;

export type RecommendationConstraintInput = Readonly<{
  constraintSessionId: string;
  constrainedAt: string;
  constitutionalVersion: string;
  validatorVersionId: string;
  recommendationSynthesisInput: RecommendationSynthesisInput;
  recommendationSynthesisResult: RecommendationSynthesisResult;
  evidenceAggregationResult: EvidenceAggregationResult;
  existingAuditLedger?: readonly RecommendationConstraintLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type RecommendationConstraintStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type RecommendationConstraintFreezeRecord = Readonly<{
  frozen: boolean;
  blocked: boolean;
  restricted: boolean;
  reasons: readonly RecommendationConstraintErrorCode[];
  freezeHash: string;
}>;

export type RecommendationScopeConstraintRecord = Readonly<{
  recommendationId: string;
  scopeCeilingRespected: boolean;
  approvalCeilingRespected: boolean;
  escalationCeilingRespected: boolean;
  constraintHash: string;
}>;

export type RecommendationGovernanceConstraintRecord = Readonly<{
  recommendationId: string;
  governanceSnapshotId: string;
  policySnapshotId: string;
  governanceBound: boolean;
  constraintHash: string;
}>;

export type RecommendationAuthorityConstraintRecord = Readonly<{
  recommendationId: string;
  operatorSupremacyPreserved: boolean;
  authorityExpansionDetected: boolean;
  constraintHash: string;
}>;

export type RecommendationReplayConstraintRecord = Readonly<{
  recommendationId: string;
  replaySnapshotId: string;
  replayHash: string;
  replayRestricted: boolean;
  constraintHash: string;
}>;

export type RecommendationContainmentRecord = Readonly<{
  recommendationId: string;
  hiddenExecutionBlocked: boolean;
  orchestrationBlocked: boolean;
  schedulingBlocked: boolean;
  containmentHash: string;
}>;

export type RecommendationSanitizationRecord = Readonly<{
  recommendationId: string;
  sanitizedSummary: string;
  sanitizedRationale: string;
  sanitized: boolean;
  sanitizationHash: string;
}>;

export type ConstrainedRecommendationEnvelope = Readonly<{
  originalEnvelopeHash: string;
  constrainedRecommendation: Recommendation;
  sanitizationRecord: RecommendationSanitizationRecord;
  constraintAuditIds: readonly string[];
  constraintHash: string;
  executionAuthorized: false;
}>;

export type RecommendationConstraintLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type RecommendationConstraintResult = Readonly<{
  constrainedRecommendations: readonly ConstrainedRecommendationEnvelope[];
  scopeRecords: readonly RecommendationScopeConstraintRecord[];
  governanceRecords: readonly RecommendationGovernanceConstraintRecord[];
  authorityRecords: readonly RecommendationAuthorityConstraintRecord[];
  replayRecords: readonly RecommendationReplayConstraintRecord[];
  containmentRecords: readonly RecommendationContainmentRecord[];
  auditRecords: readonly ConstraintAuditRecord[];
  freeze: RecommendationConstraintFreezeRecord;
  auditLedger: readonly RecommendationConstraintLedgerEntry[];
  stages: readonly RecommendationConstraintStageRecord[];
  errors: readonly RecommendationConstraintError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;

