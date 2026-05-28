import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { RecommendationValidationResult } from "@/services/constitutional-validator/types/recommendationValidationTypes";
import type { ConstitutionalTransitionResult } from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";
import type { DecisionAuditEpisodeResult } from "@/services/decision-audit-episode/types/decisionAuditEpisodeTypes";
import type { DeterministicReplayOutput } from "@/services/deterministic-replay/types/deterministicReplayTypes";
import type { HiddenExecutionDetectionResult } from "@/services/hidden-execution-detection/types/hiddenExecutionDetectionTypes";
import type { OperatorAuthorityResult } from "@/services/operator-authority/types/operatorAuthorityTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";

export interface DecisionReadinessCertification {
  certificationId: string;
  recommendationSystemId: string;
  replayDeterminismVerified: boolean;
  governanceLineageVerified: boolean;
  proposalLineageVerified: boolean;
  approvalDependencyReplayVerified: boolean;
  operatorSupremacyVerified: boolean;
  capabilityContainmentVerified: boolean;
  hiddenExecutionPreventionVerified: boolean;
  transitionVisibilityVerified: boolean;
  immutableAuditabilityVerified: boolean;
  failClosedEnforcementVerified: boolean;
  executionAuthorized: false;
  certificationHash: string;
  evidenceHash: string;
  certifiedAt: string;
}

export type DecisionReadinessCertificationErrorCode =
  | "DECISION_READINESS_REPLAY_MISMATCH"
  | "DECISION_READINESS_GOVERNANCE_AMBIGUITY"
  | "DECISION_READINESS_MISSING_LINEAGE"
  | "DECISION_READINESS_APPROVAL_INCONSISTENCY"
  | "DECISION_READINESS_TRANSITION_AMBIGUITY"
  | "DECISION_READINESS_HIDDEN_EXECUTION"
  | "DECISION_READINESS_AUDIT_CORRUPTION"
  | "DECISION_READINESS_CONTAINMENT_INSTABILITY"
  | "DECISION_READINESS_OPERATOR_OVERRIDE_FAILURE"
  | "DECISION_READINESS_CANONICALIZATION_MISMATCH"
  | "DECISION_READINESS_REPLAY_DRIFT"
  | "DECISION_READINESS_UNKNOWN_CERTIFICATION_STATE"
  | "DECISION_READINESS_ANTI_EMERGENCE";

export type DecisionReadinessCertificationError = Readonly<{
  code: DecisionReadinessCertificationErrorCode;
  message: string;
  path: string;
}>;

export type DecisionReadinessCertificationInput = Readonly<{
  certificationId: string;
  recommendationSystemId: string;
  certifiedAt: string;
  constitutionalVersion: string;
  validatorVersionId: string;
  deterministicReplayResult: DeterministicReplayOutput;
  decisionAuditEpisodeResult: DecisionAuditEpisodeResult;
  hiddenExecutionDetectionResult: HiddenExecutionDetectionResult;
  operatorAuthorityResult: OperatorAuthorityResult;
  constitutionalTransitionResult: ConstitutionalTransitionResult;
  recommendationValidationResult: RecommendationValidationResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  existingLineage?: DecisionReadinessCertificationLineageLedger;
  existingAuditLedger?: readonly DecisionReadinessCertificationLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type DecisionReadinessCertificationStage = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type DecisionReadinessFreezeRecord = Readonly<{
  frozen: boolean;
  escalated: boolean;
  reasons: readonly DecisionReadinessCertificationErrorCode[];
  freezeHash: string;
}>;

export type DecisionReadinessEvidence = Readonly<{
  evidenceId: string;
  recommendationSystemId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type DecisionReadinessCertificationLineageEntry = Readonly<{
  entryId: string;
  certificationId: string;
  recommendationSystemId: string;
  certified: boolean;
  certifiedAt: string;
  deterministicHash: string;
}>;

export type DecisionReadinessCertificationLineageLedger = Readonly<{
  entries: readonly DecisionReadinessCertificationLineageEntry[];
  lineageHash: string;
}>;

export type DecisionReadinessCertificationLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type DecisionReadinessReplayRecord = Readonly<{
  replayHash: string;
  replayDeterministic: boolean;
  replayCertified: boolean;
  recommendationHash: string;
  replayRecordHash: string;
}>;

export type DecisionReadinessGovernanceRecord = Readonly<{
  governanceSnapshotId: string;
  governanceHash: string;
  governanceLineageVerified: boolean;
  governanceRecordHash: string;
}>;

export type DecisionReadinessProposalRecord = Readonly<{
  proposalId: string;
  proposalHash: string;
  proposalLineageVerified: boolean;
  proposalRecordHash: string;
}>;

export type DecisionReadinessApprovalRecord = Readonly<{
  approvalDependencyIds: readonly string[];
  approvalDependencyReplayVerified: boolean;
  approvalRecordHash: string;
}>;

export type DecisionReadinessContainmentRecord = Readonly<{
  capabilityContainmentVerified: boolean;
  transitionVisibilityVerified: boolean;
  hiddenExecutionPreventionVerified: boolean;
  containmentHash: string;
}>;

export type DecisionReadinessOperatorRecord = Readonly<{
  operatorSupremacyVerified: boolean;
  suppressionContinuityVerified: boolean;
  operatorHash: string;
}>;

export type DecisionReadinessAuditRecord = Readonly<{
  immutableAuditabilityVerified: boolean;
  failClosedEnforcementVerified: boolean;
  auditHash: string;
}>;

export type DecisionReadinessCertificationResult = Readonly<{
  certification: DecisionReadinessCertification;
  replayRecord: DecisionReadinessReplayRecord;
  governanceRecord: DecisionReadinessGovernanceRecord;
  proposalRecord: DecisionReadinessProposalRecord;
  approvalRecord: DecisionReadinessApprovalRecord;
  containmentRecord: DecisionReadinessContainmentRecord;
  operatorRecord: DecisionReadinessOperatorRecord;
  auditRecord: DecisionReadinessAuditRecord;
  evidence: DecisionReadinessEvidence;
  freeze: DecisionReadinessFreezeRecord;
  stages: readonly DecisionReadinessCertificationStage[];
  lineage: DecisionReadinessCertificationLineageLedger;
  auditLedger: readonly DecisionReadinessCertificationLedgerEntry[];
  errors: readonly DecisionReadinessCertificationError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
