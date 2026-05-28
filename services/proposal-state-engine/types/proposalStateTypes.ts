import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalEnforcementResult } from "@/services/constitutional-enforcement/types/constitutionalEnforcementTypes";
import type { ImmutableRecommendationLedgerResult } from "@/services/immutable-recommendation-ledger/types/immutableRecommendationLedgerTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type { RecommendationReplayResult } from "@/services/recommendation-replay/types/recommendationReplayTypes";

export type ProposalLifecycleState =
  | "generated"
  | "validated"
  | "governed"
  | "reviewed"
  | "approved"
  | "denied"
  | "frozen"
  | "revoked"
  | "disputed"
  | "archived";

export interface ProposalTransitionDeclaration {
  transitionId: string;
  proposalId: string;
  sourceState: ProposalLifecycleState;
  targetState: ProposalLifecycleState;
  governanceAuthorityId: string;
  governanceSnapshotId: string;
  replayLineageId: string;
  approvalLineageId?: string;
  dependencyLineageId?: string;
  auditLineageId: string;
  requestedBy:
    | "operator"
    | "governance-system"
    | "proposal-system";
  requestedAt: string;
  reason: string;
}

export type ProposalStateErrorCode =
  | "PROPOSAL_STATE_SOURCE_MISMATCH"
  | "PROPOSAL_STATE_TARGET_ILLEGAL"
  | "PROPOSAL_STATE_GOVERNANCE_BINDING_MISSING"
  | "PROPOSAL_STATE_REPLAY_LINEAGE_MISSING"
  | "PROPOSAL_STATE_APPROVAL_LINEAGE_MISSING"
  | "PROPOSAL_STATE_DEPENDENCY_LINEAGE_INVALID"
  | "PROPOSAL_STATE_AUDIT_APPEND_FAILED"
  | "PROPOSAL_STATE_FROZEN"
  | "PROPOSAL_STATE_REVOKED"
  | "PROPOSAL_STATE_ARCHIVED"
  | "PROPOSAL_STATE_AMBIGUOUS_TRANSITION"
  | "PROPOSAL_STATE_LINEAGE_DISPUTED";

export interface ProposalTransitionResult {
  accepted: boolean;
  resultingState?: ProposalLifecycleState;
  rejectionCode?: ProposalStateErrorCode;
  transitionId: string;
  proposalId: string;
  governanceSnapshotId: string;
  replayLineageId: string;
  auditEventId: string;
  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;
  transitionInferred: false;
}

export interface ProposalLifecycleLineage {
  lineageId: string;
  proposalId: string;
  currentState: ProposalLifecycleState;
  transitionIds: string[];
  governanceSnapshotIds: string[];
  replayLineageIds: string[];
  approvalLineageIds: string[];
  dependencyLineageIds: string[];
  auditEventIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GovernanceBindingRecord {
  bindingId: string;
  proposalId: string;
  transitionId: string;
  governanceSnapshotId: string;
  governancePolicyVersion: string;
  constitutionalRuleSetVersion: string;
  authorityBasis: string;
  enforcementResult:
    | "allowed"
    | "blocked"
    | "frozen"
    | "revoked";
  boundAt: string;
}

export type ProposalStateAuditEventType =
  | "proposal.state.transition.requested"
  | "proposal.state.transition.validated"
  | "proposal.state.transition.rejected"
  | "proposal.state.transition.applied"
  | "proposal.state.frozen"
  | "proposal.state.revoked"
  | "proposal.state.disputed"
  | "proposal.state.archived";

export type ProposalStateError = Readonly<{
  code: ProposalStateErrorCode;
  message: string;
  path: string;
}>;

export type ProposalStateAuditRecord = Readonly<{
  auditEventId: string;
  proposalId: string;
  transitionId: string;
  eventType: ProposalStateAuditEventType;
  timestamp: string;
  inputHash: string;
  outputHash: string;
  previousEntryHash?: string;
  entryHash: string;
  appendOnly: true;
  replayCompatible: true;
  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;
  operatorReviewRequired: true;
}>;

export type ProposalStateStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type ProposalStateFreezeRecord = Readonly<{
  frozen: boolean;
  failedClosed: boolean;
  reasons: readonly ProposalStateErrorCode[];
  freezeHash: string;
}>;

export type ProposalReplayAdmissibilityRecord = Readonly<{
  proposalId: string;
  replayAdmissible: boolean;
  replayLineageId: string;
  governanceSnapshotId: string;
  admissibilityHash: string;
}>;

export type ProposalStateEngineInput = Readonly<{
  stateEngineRunId: string;
  evaluatedAt: string;
  constitutionalVersion: string;
  governancePolicyVersion: string;
  constitutionalRuleSetVersion: string;
  currentState: ProposalLifecycleState;
  transition: ProposalTransitionDeclaration;
  proposalIntegrityResult: ProposalIntegrityResult;
  recommendationReplayResult: RecommendationReplayResult;
  immutableRecommendationLedgerResult: ImmutableRecommendationLedgerResult;
  constitutionalEnforcementResult: ConstitutionalEnforcementResult;
  existingLineage?: ProposalLifecycleLineage;
  existingGovernanceBindings?: readonly GovernanceBindingRecord[];
  existingAuditLedger?: readonly ProposalStateAuditLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type ProposalStateAuditLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ProposalStateEngineResult = Readonly<{
  status: "COMPLETED" | "FROZEN" | "FAILED_CLOSED";
  transitionResult: ProposalTransitionResult;
  lineage: ProposalLifecycleLineage;
  governanceBinding: GovernanceBindingRecord;
  replayAdmissibility: ProposalReplayAdmissibilityRecord;
  auditRecords: readonly ProposalStateAuditRecord[];
  auditLedger: readonly ProposalStateAuditLedgerEntry[];
  freeze: ProposalStateFreezeRecord;
  stages: readonly ProposalStateStageRecord[];
  errors: readonly ProposalStateError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
