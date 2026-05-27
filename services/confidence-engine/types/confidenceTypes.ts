import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalEnforcementResult } from "@/services/constitutional-enforcement/types/constitutionalEnforcementTypes";
import type { ProposalApprovalBindingResult } from "@/services/proposal-approval-binding/types/proposalApprovalBindingTypes";
import type { GovernanceBindingResult } from "@/services/proposal-governance-binding/governanceBindingTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type { ProposalReplayResult } from "@/services/proposal-replay/replayTypes";
import type { ProposalRevocationResult } from "@/services/proposal-revocation-engine/proposalRevocationTypes";
import type { ProposalFreezeResult } from "@/services/proposal-freeze-layer/types/proposalFreezeTypes";
import type { ProposalStateEngineResult } from "@/services/proposal-state-engine/types/proposalStateTypes";

export type ConfidenceClassification =
  | "very_low"
  | "low"
  | "moderate"
  | "high"
  | "very_high";

export type ConfidenceCautionLevel =
  | "normal"
  | "elevated"
  | "strict"
  | "maximum";

export type ConfidenceLedgerEvent =
  | "CONFIDENCE_GENERATED"
  | "CONFIDENCE_CLASSIFIED"
  | "CONFIDENCE_ADJUSTED"
  | "CONFIDENCE_REPLAYED"
  | "CONFIDENCE_REPLAY_VALIDATED"
  | "CONFIDENCE_REPLAY_FAILED"
  | "CONFIDENCE_REJECTED"
  | "CONFIDENCE_FROZEN";

export type ConfidenceFactorType =
  | "evidence_quality"
  | "evidence_completeness"
  | "replay_consistency"
  | "governance_alignment"
  | "policy_stability"
  | "proposal_integrity"
  | "audit_consistency"
  | "model_validity";

export interface ConfidenceFactorRecord {
  readonly factorType: ConfidenceFactorType;
  readonly score: number;
  readonly weight: number;
  readonly weightedScore: number;
  readonly reason: string;
  readonly deterministicHash: string;
}

export interface DeterministicConfidenceScore {
  readonly confidenceId: string;
  readonly proposalId: string;
  readonly recommendationId?: string;
  readonly score: number;
  readonly classification: ConfidenceClassification;
  readonly cautionLevel: ConfidenceCautionLevel;
  readonly evidenceSnapshotId: string;
  readonly governanceSnapshotId: string;
  readonly policyLineageId: string;
  readonly proposalLineageId: string;
  readonly replayLineageId: string;
  readonly scoringModelVersion: string;
  readonly weightTableVersion: string;
  readonly normalizationVersion: string;
  readonly inputHash: string;
  readonly outputHash: string;
  readonly lineageHash: string;
  readonly generatedAt: string;
  readonly authorityGranted: false;
  readonly executionPermitted: false;
}

export interface ReplayDrift {
  readonly driftId: string;
  readonly replayId: string;
  readonly driftType:
    | "governance_mismatch"
    | "validator_mismatch"
    | "dependency_mismatch"
    | "approval_mismatch"
    | "authority_mismatch"
    | "audit_hash_mismatch";
  readonly severity:
    | "low"
    | "medium"
    | "high"
    | "critical";
  readonly detectedAt: string;
  readonly frozen: boolean;
}

export interface ConfidenceSnapshotBundle {
  readonly evidenceSnapshotId: string;
  readonly governanceSnapshotId: string;
  readonly policyLineageId: string;
  readonly proposalLineageId: string;
  readonly replayLineageId: string;
  readonly authorityBoundaryId: string;
  readonly approvalRequirementSetId: string;
  readonly replayId: string;
  readonly scoringModelVersion: string;
  readonly weightTableVersion: string;
  readonly normalizationVersion: string;
  readonly snapshotHash: string;
}

export interface ConfidenceVersionRecord {
  readonly scoringModelVersion: string;
  readonly normalizationVersion: string;
  readonly weightTableVersion: string;
  readonly validatorVersionSetId: string;
  readonly versionHash: string;
}

export interface ConfidenceReplayBinding {
  readonly replayBindingId: string;
  readonly proposalId: string;
  readonly replayId: string;
  readonly replayLineageId: string;
  readonly replayHash: string;
  readonly admissible: boolean;
  readonly bindingHash: string;
}

export interface ConfidenceLineageRecord {
  readonly lineageId: string;
  readonly confidenceId: string;
  readonly proposalId: string;
  readonly proposalLineageId: string;
  readonly replayLineageId: string;
  readonly governanceSnapshotId: string;
  readonly evidenceSnapshotId: string;
  readonly lineageHash: string;
}

export interface ConfidenceAuditEntry {
  readonly auditEntryId: string;
  readonly confidenceId: string;
  readonly proposalId: string;
  readonly eventType: ConfidenceLedgerEvent;
  readonly timestamp: string;
  readonly inputHash: string;
  readonly outputHash: string;
  readonly previousEntryHash?: string;
  readonly entryHash: string;
  readonly appendOnly: true;
  readonly replayCompatible: true;
  readonly authorityGranted: false;
  readonly executionPermitted: false;
  readonly operatorReviewRequired: true;
}

export interface ConfidenceDeterminismCertification {
  readonly certified: boolean;
  readonly inputHashStable: boolean;
  readonly outputHashStable: boolean;
  readonly lineageHashStable: boolean;
  readonly scoreStable: boolean;
  readonly classificationStable: boolean;
  readonly cautionStable: boolean;
  readonly governanceAdjustmentStable: boolean;
  readonly modelVersionStable: boolean;
  readonly normalizationVersionStable: boolean;
  readonly weightVersionStable: boolean;
  readonly certificationHash: string;
}

export type DeterministicConfidenceStatus =
  | "COMPLETED"
  | "FROZEN"
  | "FAILED_CLOSED";

export type DeterministicConfidenceErrorCode =
  | "DETERMINISTIC_CONFIDENCE_EVIDENCE_SNAPSHOT_MISSING"
  | "DETERMINISTIC_CONFIDENCE_GOVERNANCE_SNAPSHOT_MISSING"
  | "DETERMINISTIC_CONFIDENCE_REPLAY_LINEAGE_MISSING"
  | "DETERMINISTIC_CONFIDENCE_PROPOSAL_LINEAGE_CORRUPTED"
  | "DETERMINISTIC_CONFIDENCE_SCORING_VERSION_UNKNOWN"
  | "DETERMINISTIC_CONFIDENCE_WEIGHT_TABLE_MISMATCH"
  | "DETERMINISTIC_CONFIDENCE_REPLAY_HASH_MISMATCH"
  | "DETERMINISTIC_CONFIDENCE_GOVERNANCE_DRIFT"
  | "DETERMINISTIC_CONFIDENCE_POLICY_LINEAGE_UNRESOLVED"
  | "DETERMINISTIC_CONFIDENCE_CANONICALIZATION_MISMATCH"
  | "DETERMINISTIC_CONFIDENCE_REPLAY_NON_DETERMINISTIC"
  | "DETERMINISTIC_CONFIDENCE_AUTHORITY_ESCALATION"
  | "DETERMINISTIC_CONFIDENCE_EXECUTION_SEMANTIC"
  | "DETERMINISTIC_CONFIDENCE_ORCHESTRATION_SEMANTIC"
  | "DETERMINISTIC_CONFIDENCE_RUNTIME_MUTATION"
  | "DETERMINISTIC_CONFIDENCE_SCHEDULER_SEMANTIC"
  | "DETERMINISTIC_CONFIDENCE_FREEZE_CONTAINMENT"
  | "DETERMINISTIC_CONFIDENCE_REVOKED_CONTAINMENT"
  | "DETERMINISTIC_CONFIDENCE_FAIL_CLOSED";

export type DeterministicConfidenceError = Readonly<{
  code: DeterministicConfidenceErrorCode;
  message: string;
  path: string;
}>;

export type DeterministicConfidenceLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type DeterministicConfidenceStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type DeterministicConfidenceInput = Readonly<{
  confidenceRunId: string;
  generatedAt: string;
  constitutionalVersion: string;
  scoringModelVersion: string;
  normalizationVersion: string;
  weightTableVersion: string;
  proposalStateEngineResult: ProposalStateEngineResult;
  proposalFreezeResult: ProposalFreezeResult;
  proposalRevocationResult: ProposalRevocationResult;
  proposalGovernanceBindingResult: GovernanceBindingResult;
  proposalReplayResult: ProposalReplayResult;
  proposalApprovalBindingResult: ProposalApprovalBindingResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  constitutionalEnforcementResult: ConstitutionalEnforcementResult;
  recommendationId?: string;
  existingAuditLedger?: readonly DeterministicConfidenceLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type DeterministicConfidenceResult = Readonly<{
  status: DeterministicConfidenceStatus;
  score: DeterministicConfidenceScore;
  factors: readonly ConfidenceFactorRecord[];
  snapshotBundle: ConfidenceSnapshotBundle;
  versions: ConfidenceVersionRecord;
  replayBinding: ConfidenceReplayBinding;
  lineage: ConfidenceLineageRecord;
  drifts: readonly ReplayDrift[];
  auditEntries: readonly ConfidenceAuditEntry[];
  auditLedger: readonly DeterministicConfidenceLedgerEntry[];
  certification: ConfidenceDeterminismCertification;
  errors: readonly DeterministicConfidenceError[];
  warnings: readonly string[];
  stages: readonly DeterministicConfidenceStageRecord[];
  deterministicHash: string;
  derivedOnly: true;
}>;
