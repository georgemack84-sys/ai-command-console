import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { RecommendationSynthesisInput, RecommendationSynthesisResult } from "@/services/recommendation-synthesis/types/recommendationSynthesisTypes";

export interface EvidenceReference {
  evidenceId: string;
  evidenceType:
    | "telemetry"
    | "replay"
    | "validation"
    | "governance"
    | "integrity"
    | "policy"
    | "operator";
  sourceId: string;
  sourceHash: string;
  canonicalHash: string;
  schemaVersion: string;
  collectedAt: string;
  governanceSnapshotId?: string;
  replaySessionId?: string;
  integrityStatus:
    | "verified"
    | "conflicted"
    | "incomplete"
    | "unknown";
  lineage: {
    parentEvidenceIds: string[];
    sourceSnapshots: string[];
  };
}

export interface EvidenceAggregationSession {
  aggregationSessionId: string;
  startedAt: string;
  completedAt?: string;
  aggregationStatus:
    | "running"
    | "completed"
    | "failed"
    | "frozen";
  evidenceReferences: string[];
  canonicalAggregationHash: string;
  governanceSnapshotId: string;
  replaySessionId?: string;
  integrityStatus:
    | "verified"
    | "conflicted"
    | "incomplete";
  deterministicOrderingVersion: string;
}

export type EvidenceAggregationErrorCode =
  | "EVIDENCE_AGGREGATION_INVALID_INPUT"
  | "EVIDENCE_AGGREGATION_MISSING_LINEAGE"
  | "EVIDENCE_AGGREGATION_UNSTABLE_ORDERING"
  | "EVIDENCE_AGGREGATION_REPLAY_DRIFT"
  | "EVIDENCE_AGGREGATION_GOVERNANCE_AMBIGUITY"
  | "EVIDENCE_AGGREGATION_HASH_INSTABILITY"
  | "EVIDENCE_AGGREGATION_TIMESTAMP_INCONSISTENCY"
  | "EVIDENCE_AGGREGATION_UNRESOLVED_CONFLICT"
  | "EVIDENCE_AGGREGATION_SERIALIZATION_INSTABILITY"
  | "EVIDENCE_AGGREGATION_REPLAY_RECONSTRUCTION_MISMATCH"
  | "EVIDENCE_AGGREGATION_HIDDEN_EXECUTION"
  | "EVIDENCE_AGGREGATION_OPERATOR_SUPPRESSED"
  | "EVIDENCE_AGGREGATION_AUTHORITY_AMBIGUITY"
  | "EVIDENCE_AGGREGATION_CANONICALIZATION_MISMATCH"
  | "EVIDENCE_AGGREGATION_ANTI_EMERGENCE"
  | "EVIDENCE_AGGREGATION_FAIL_CLOSED";

export type EvidenceAggregationError = Readonly<{
  code: EvidenceAggregationErrorCode;
  message: string;
  path: string;
}>;

export type EvidenceConflictRecord = Readonly<{
  conflictId: string;
  evidenceIds: readonly string[];
  conflictType: "hash_mismatch" | "timestamp_inconsistency" | "lineage_instability" | "integrity_conflict";
  visible: true;
  conflictHash: string;
}>;

export type EvidenceConflictVisibilityRecord = Readonly<{
  visibleConflictIds: readonly string[];
  unresolvedConflictCount: number;
  visibilityHash: string;
}>;

export type EvidenceReplayRecord = Readonly<{
  replaySessionId?: string;
  replayHash: string;
  replaySnapshotId: string;
  replayDeterministic: boolean;
  replayCertified: boolean;
  replayRecordHash: string;
}>;

export type EvidenceGovernanceRecord = Readonly<{
  governanceSnapshotId: string;
  governanceHash: string;
  policySnapshotIds: readonly string[];
  governanceRecordHash: string;
}>;

export type EvidenceIntegrityRecord = Readonly<{
  integrityStateId: string;
  integrityStatus: EvidenceAggregationSession["integrityStatus"];
  recommendationDeterministic: boolean;
  integrityHash: string;
}>;

export type EvidenceAncestryNode = Readonly<{
  evidenceId: string;
  parentEvidenceIds: readonly string[];
  sourceSnapshots: readonly string[];
  nodeHash: string;
}>;

export type EvidenceAncestryGraph = Readonly<{
  nodes: readonly EvidenceAncestryNode[];
  graphHash: string;
}>;

export type EvidenceAggregationStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type EvidenceAggregationLineageEntry = Readonly<{
  entryId: string;
  aggregationSessionId: string;
  evidenceId: string;
  createdAt: string;
  deterministicHash: string;
}>;

export type EvidenceAggregationLineageLedger = Readonly<{
  entries: readonly EvidenceAggregationLineageEntry[];
  lineageHash: string;
}>;

export type EvidenceAggregationAuditLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type EvidenceAggregationFreezeRecord = Readonly<{
  frozen: boolean;
  escalated: boolean;
  reasons: readonly EvidenceAggregationErrorCode[];
  freezeHash: string;
}>;

export type EvidenceAggregationAuditRecord = Readonly<{
  recordId: string;
  aggregationSessionId: string;
  evidenceCount: number;
  lineageHash: string;
  auditHash: string;
}>;

export type EvidenceAggregationInput = Readonly<{
  aggregationSessionId: string;
  startedAt: string;
  completedAt?: string;
  deterministicOrderingVersion: string;
  recommendationSynthesisInput: RecommendationSynthesisInput;
  recommendationSynthesisResult: RecommendationSynthesisResult;
  existingLineage?: EvidenceAggregationLineageLedger;
  existingAuditLedger?: readonly EvidenceAggregationAuditLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type EvidenceAggregationResult = Readonly<{
  session: EvidenceAggregationSession;
  evidenceReferences: readonly EvidenceReference[];
  replayRecord: EvidenceReplayRecord;
  governanceRecord: EvidenceGovernanceRecord;
  integrityRecord: EvidenceIntegrityRecord;
  conflicts: readonly EvidenceConflictRecord[];
  conflictVisibility: EvidenceConflictVisibilityRecord;
  ancestryGraph: EvidenceAncestryGraph;
  freeze: EvidenceAggregationFreezeRecord;
  auditRecord: EvidenceAggregationAuditRecord;
  lineage: EvidenceAggregationLineageLedger;
  auditLedger: readonly EvidenceAggregationAuditLedgerEntry[];
  stages: readonly EvidenceAggregationStageRecord[];
  errors: readonly EvidenceAggregationError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;

