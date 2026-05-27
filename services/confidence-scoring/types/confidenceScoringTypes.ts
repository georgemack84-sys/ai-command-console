import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { EvidenceAggregationResult } from "@/services/evidence-aggregation/types/evidenceAggregationTypes";
import type { RecommendationConstraintResult } from "@/services/recommendation-constraint/types/recommendationConstraintTypes";
import type { RecommendationSynthesisInput, RecommendationSynthesisResult } from "@/services/recommendation-synthesis/types/recommendationSynthesisTypes";

export type ConfidenceLevel =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

export type UncertaintyLevel =
  | "minimal"
  | "elevated"
  | "high"
  | "critical";

export type ConfidenceFactor = Readonly<{
  factorId: string;
  factorType:
    | "evidence_quality"
    | "replay_consistency"
    | "governance_alignment"
    | "validation_success"
    | "policy_stability"
    | "telemetry_completeness";
  score: number;
  weight: number;
  reason: string;
  deterministicHash: string;
}>;

export type GovernanceImpactScore = Readonly<{
  governanceSnapshotId: string;
  policySnapshotIds: readonly string[];
  alignmentScore: number;
  cautionAmplified: boolean;
  deterministicHash: string;
}>;

export type ReplayMetadata = Readonly<{
  replayId: string;
  replaySnapshotId: string;
  replayHash: string;
  replayCertified: boolean;
  replayDeterministic: boolean;
  deterministicHash: string;
}>;

export type ConfidenceLineage = Readonly<{
  lineageId: string;
  confidenceId: string;
  parentLineageRefs: readonly string[];
  evidenceRefs: readonly string[];
  lineageHash: string;
}>;

export interface ConfidenceScore {
  confidenceId: string;
  recommendationId: string;
  overallConfidence: number;
  confidenceLevel: ConfidenceLevel;
  uncertaintyLevel: UncertaintyLevel;
  scoringFactors: ConfidenceFactor[];
  governanceImpact: GovernanceImpactScore;
  replayMetadata: ReplayMetadata;
  lineage: ConfidenceLineage;
  executionAuthorized: false;
  operatorDecisionRequired: true;
  createdAt: string;
}

export type ConfidenceScoringErrorCode =
  | "CONFIDENCE_SCORING_INVALID_INPUT"
  | "CONFIDENCE_SCORING_REPLAY_MISMATCH"
  | "CONFIDENCE_SCORING_GOVERNANCE_AMBIGUITY"
  | "CONFIDENCE_SCORING_LINEAGE_CORRUPTION"
  | "CONFIDENCE_SCORING_SERIALIZATION_INSTABILITY"
  | "CONFIDENCE_SCORING_MISSING_EVIDENCE"
  | "CONFIDENCE_SCORING_VALIDATOR_INCONSISTENCY"
  | "CONFIDENCE_SCORING_SCORING_DRIFT"
  | "CONFIDENCE_SCORING_TELEMETRY_CORRUPTION"
  | "CONFIDENCE_SCORING_IMMUTABLE_AUDIT_FAILURE"
  | "CONFIDENCE_SCORING_HIDDEN_EXECUTION"
  | "CONFIDENCE_SCORING_ANTI_EMERGENCE"
  | "CONFIDENCE_SCORING_OPERATOR_SUPPRESSED"
  | "CONFIDENCE_SCORING_AUTHORITY_COUPLING"
  | "CONFIDENCE_SCORING_WEIGHT_MUTATION"
  | "CONFIDENCE_SCORING_FAIL_CLOSED";

export type ConfidenceScoringError = Readonly<{
  code: ConfidenceScoringErrorCode;
  message: string;
  path: string;
}>;

export type ConfidenceAuditRecord = Readonly<{
  auditId: string;
  confidenceId: string;
  recommendationId: string;
  event: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  createdAt: string;
  auditHash: string;
}>;

export type ConfidenceSerializationRecord = Readonly<{
  serializationId: string;
  canonicalForm: string;
  serializationHash: string;
}>;

export type ConfidenceReplayRecord = Readonly<{
  replayId: string;
  replaySnapshotId: string;
  replayHash: string;
  replayRestricted: boolean;
  replayRecordHash: string;
}>;

export type DeterministicWeightRecord = Readonly<{
  weightId: string;
  weights: Readonly<Record<ConfidenceFactor["factorType"], number>>;
  deterministicHash: string;
}>;

export type ConfidenceClassificationRecord = Readonly<{
  confidenceLevel: ConfidenceLevel;
  uncertaintyLevel: UncertaintyLevel;
  classificationHash: string;
}>;

export type ConfidenceFreezeRecord = Readonly<{
  frozen: boolean;
  reducedConfidence: boolean;
  cautionAmplified: boolean;
  reasons: readonly ConfidenceScoringErrorCode[];
  freezeHash: string;
}>;

export type ConfidenceLineageEntry = Readonly<{
  entryId: string;
  confidenceId: string;
  recommendationId: string;
  createdAt: string;
  deterministicHash: string;
}>;

export type ConfidenceLineageLedger = Readonly<{
  entries: readonly ConfidenceLineageEntry[];
  lineageHash: string;
}>;

export type ConfidenceScoringStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type ConfidenceScoringLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ConfidenceScoringInput = Readonly<{
  confidenceSessionId: string;
  createdAt: string;
  constitutionalVersion: string;
  validatorVersionId: string;
  recommendationSynthesisInput: RecommendationSynthesisInput;
  recommendationSynthesisResult: RecommendationSynthesisResult;
  recommendationConstraintResult: RecommendationConstraintResult;
  evidenceAggregationResult: EvidenceAggregationResult;
  existingLineage?: ConfidenceLineageLedger;
  existingAuditLedger?: readonly ConfidenceScoringLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type ConfidenceScoringResult = Readonly<{
  confidenceScores: readonly ConfidenceScore[];
  replayRecords: readonly ConfidenceReplayRecord[];
  weightRecord: DeterministicWeightRecord;
  classificationRecords: readonly ConfidenceClassificationRecord[];
  serializationRecords: readonly ConfidenceSerializationRecord[];
  lineage: ConfidenceLineageLedger;
  auditRecords: readonly ConfidenceAuditRecord[];
  auditLedger: readonly ConfidenceScoringLedgerEntry[];
  freeze: ConfidenceFreezeRecord;
  stages: readonly ConfidenceScoringStageRecord[];
  errors: readonly ConfidenceScoringError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
