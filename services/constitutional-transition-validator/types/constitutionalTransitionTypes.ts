import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { RecommendationValidationResult } from "@/services/constitutional-validator/types/recommendationValidationTypes";
import type { DecisionAuditEpisodeResult } from "@/services/decision-audit-episode/types/decisionAuditEpisodeTypes";
import type { DeterministicReplayOutput } from "@/services/deterministic-replay/types/deterministicReplayTypes";
import type { HiddenExecutionDetectionResult } from "@/services/hidden-execution-detection/types/hiddenExecutionDetectionTypes";
import type { OperatorAuthorityResult } from "@/services/operator-authority/types/operatorAuthorityTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";

export enum ConstitutionalTransitionErrorCode {
  MISSING_SOURCE_STATE = "MISSING_SOURCE_STATE",
  MISSING_TARGET_STATE = "MISSING_TARGET_STATE",
  MISSING_GOVERNANCE_BASIS = "MISSING_GOVERNANCE_BASIS",
  MISSING_AUTHORITY_BASIS = "MISSING_AUTHORITY_BASIS",
  MISSING_REPLAY_LINEAGE = "MISSING_REPLAY_LINEAGE",
  MISSING_APPROVAL_LINEAGE = "MISSING_APPROVAL_LINEAGE",
  REPLAY_DRIFT_DETECTED = "REPLAY_DRIFT_DETECTED",
  HIDDEN_TRANSITION_DETECTED = "HIDDEN_TRANSITION_DETECTED",
  TRANSITION_SYNTHESIS_DETECTED = "TRANSITION_SYNTHESIS_DETECTED",
  AUTHORITY_ESCALATION_DETECTED = "AUTHORITY_ESCALATION_DETECTED",
  RECURSIVE_TRANSITION_CHAIN = "RECURSIVE_TRANSITION_CHAIN",
  SUPPRESSION_CONTINUITY_BROKEN = "SUPPRESSION_CONTINUITY_BROKEN",
  UNDOCUMENTED_TRANSITION = "UNDOCUMENTED_TRANSITION",
  APPEND_ONLY_VIOLATION = "APPEND_ONLY_VIOLATION",
}

export interface ConstitutionalTransition {
  transitionId: string;
  entityId: string;
  entityType:
    | "recommendation"
    | "proposal"
    | "escalation"
    | "governance"
    | "approval"
    | "simulation";
  sourceState: string;
  targetState: string;
  transitionReason: string;
  governanceBasisId: string;
  authorityBasisId: string;
  replayLineageId: string;
  approvalLineageIds: string[];
  auditLineageId: string;
  policySnapshotId: string;
  replaySnapshotId: string;
  operatorVisibilityRequired: boolean;
  overrideCompatible: boolean;
  replayCertified: boolean;
  transitionHash: string;
  replayHash: string;
  governanceHash: string;
  auditHash: string;
  constitutionalVersion: string;
  executionAuthorized: false;
  createdAt: string;
}

export type ConstitutionalTransitionError = Readonly<{
  code: ConstitutionalTransitionErrorCode;
  message: string;
  path: string;
}>;

export type ConstitutionalTransitionLineageEntry = Readonly<{
  entryId: string;
  transitionId: string;
  entityId: string;
  entityType: ConstitutionalTransition["entityType"];
  sourceState: string;
  targetState: string;
  createdAt: string;
  deterministicHash: string;
}>;

export type ConstitutionalTransitionLineageLedger = Readonly<{
  entries: readonly ConstitutionalTransitionLineageEntry[];
  lineageHash: string;
}>;

export type ConstitutionalTransitionLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ConstitutionalTransitionValidationStage = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type ConstitutionalTransitionFreezeRecord = Readonly<{
  frozen: boolean;
  escalated: boolean;
  reasons: readonly ConstitutionalTransitionErrorCode[];
  freezeHash: string;
}>;

export type ConstitutionalTransitionReplayRecord = Readonly<{
  replayLineageId: string;
  replaySnapshotId: string;
  replayHash: string;
  replayCertified: boolean;
  replayDeterministic: boolean;
  reconstructedRecommendationHash: string;
  replayRecordHash: string;
}>;

export type ConstitutionalTransitionGovernanceCorrelation = Readonly<{
  governanceBasisId: string;
  policySnapshotId: string;
  governanceValidated: boolean;
  governanceHash: string;
  correlationHash: string;
}>;

export type ConstitutionalTransitionAuthorityRecord = Readonly<{
  authorityBasisId: string;
  operatorCompatible: boolean;
  suppressed: boolean;
  continuityInvalidated: boolean;
  authorityHash: string;
}>;

export type ConstitutionalTransitionApprovalRecord = Readonly<{
  approvalLineageIds: readonly string[];
  approvalValidated: boolean;
  approvalHash: string;
}>;

export type ConstitutionalTransitionCompatibilityRecord = Readonly<{
  operatorVisibilityRequired: boolean;
  overrideCompatible: boolean;
  pauseAvailable: boolean;
  freezeAvailable: boolean;
  denyAvailable: boolean;
  inspectAvailable: boolean;
  escalateAvailable: boolean;
  emergencyStopAvailable: boolean;
  compatibilityHash: string;
}>;

export type ConstitutionalTransitionStateMachineRecord = Readonly<{
  entityType: ConstitutionalTransition["entityType"];
  sourceState: string;
  targetState: string;
  declared: boolean;
  documentedTargets: readonly string[];
  stateMachineHash: string;
}>;

export type ConstitutionalTransitionInput = Readonly<{
  transitionId: string;
  entityId: string;
  entityType: ConstitutionalTransition["entityType"];
  sourceState: string;
  targetState: string;
  transitionReason: string;
  governanceBasisId: string;
  authorityBasisId: string;
  replayLineageId: string;
  approvalLineageIds: readonly string[];
  auditLineageId: string;
  policySnapshotId: string;
  replaySnapshotId: string;
  operatorVisibilityRequired: boolean;
  overrideCompatible: boolean;
  constitutionalVersion: string;
  createdAt: string;
  validatorVersionId: string;
  decisionAuditEpisodeResult: DecisionAuditEpisodeResult;
  deterministicReplayResult: DeterministicReplayOutput;
  hiddenExecutionDetectionResult: HiddenExecutionDetectionResult;
  operatorAuthorityResult: OperatorAuthorityResult;
  recommendationValidationResult: RecommendationValidationResult;
  proposalIntegrityResult?: ProposalIntegrityResult;
  existingLineage?: ConstitutionalTransitionLineageLedger;
  existingAuditLedger?: readonly ConstitutionalTransitionLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalTransitionForensics = Readonly<{
  exportId: string;
  transitionId: string;
  transitionHash: string;
  replayHash: string;
  governanceHash: string;
  auditHash: string;
  exportHash: string;
}>;

export type ConstitutionalTransitionResult = Readonly<{
  transition: ConstitutionalTransition;
  replayRecord: ConstitutionalTransitionReplayRecord;
  governanceCorrelation: ConstitutionalTransitionGovernanceCorrelation;
  authorityRecord: ConstitutionalTransitionAuthorityRecord;
  approvalRecord: ConstitutionalTransitionApprovalRecord;
  compatibility: ConstitutionalTransitionCompatibilityRecord;
  stateMachine: ConstitutionalTransitionStateMachineRecord;
  stages: readonly ConstitutionalTransitionValidationStage[];
  freeze: ConstitutionalTransitionFreezeRecord;
  lineage: ConstitutionalTransitionLineageLedger;
  auditLedger: readonly ConstitutionalTransitionLedgerEntry[];
  forensics: ConstitutionalTransitionForensics;
  errors: readonly ConstitutionalTransitionError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
