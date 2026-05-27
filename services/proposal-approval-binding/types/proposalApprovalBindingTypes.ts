import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalEnforcementResult } from "@/services/constitutional-enforcement/types/constitutionalEnforcementTypes";
import type {
  AuthorityBoundary,
  ApprovalRequirementBinding,
  GovernanceBindingResult,
  GovernanceSnapshot,
  ValidatorVersionSet,
} from "@/services/proposal-governance-binding/governanceBindingTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type { ProposalReplayResult } from "@/services/proposal-replay/replayTypes";
import type { ProposalRevocationResult } from "@/services/proposal-revocation-engine/proposalRevocationTypes";
import type { ProposalFreezeResult } from "@/services/proposal-freeze-layer/types/proposalFreezeTypes";
import type { ProposalStateEngineResult } from "@/services/proposal-state-engine/types/proposalStateTypes";

export type ApprovalBindingStatus =
  | "BOUND"
  | "FROZEN"
  | "REVOKED"
  | "INVALID"
  | "DISPUTED"
  | "FAILED_CLOSED";

export interface ApprovalBinding {
  readonly bindingId: string;
  readonly proposalId: string;
  readonly governanceSnapshotId: string;
  readonly policySnapshotId: string;
  readonly authorityBoundaryId: string;
  readonly replayId: string;
  readonly approvalRequirementSetId: string;
  readonly validatorVersionSetId: string;
  readonly validityWindowId: string;
  readonly approvalIds: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly overrideBindingIds: readonly string[];
  readonly status: ApprovalBindingStatus;
  readonly immutable: true;
  readonly bindingHash: string;
  readonly lineageHash: string;
  readonly createdAt: string;
}

export interface ApprovalLineage {
  readonly lineageId: string;
  readonly proposalId: string;
  readonly approvalIds: readonly string[];
  readonly dependencyIds: readonly string[];
  readonly replayIds: readonly string[];
  readonly governanceSnapshotIds: readonly string[];
  readonly authorityBoundaryIds: readonly string[];
  readonly overrideBindingIds: readonly string[];
  readonly revocationIds: readonly string[];
  readonly auditEventIds: readonly string[];
  readonly lineageHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ApprovalDependency {
  readonly approvalId: string;
  readonly proposalId: string;
  readonly approverId: string;
  readonly approverRole: string;
  readonly dependencySnapshotId: string;
  readonly governanceSnapshotId: string;
  readonly authorityBoundaryId: string;
  readonly replayLineageId: string;
  readonly grantedAt: string;
  readonly immutable: true;
  readonly dependencyHash: string;
}

export interface ApprovalValidityWindow {
  readonly validityWindowId: string;
  readonly proposalId: string;
  readonly validFrom: string;
  readonly validUntil: string;
  readonly ambiguous: boolean;
  readonly immutable: true;
  readonly windowHash: string;
}

export interface ApprovalRevocation {
  readonly revocationId: string;
  readonly proposalId: string;
  readonly revokedApprovalIds: readonly string[];
  readonly propagatedFromProposalRevocationId?: string;
  readonly reason: string;
  readonly revokedAt: string;
  readonly immutable: true;
  readonly revocationHash: string;
}

export interface ApprovalReplayBinding {
  readonly replayBindingId: string;
  readonly proposalId: string;
  readonly replayId: string;
  readonly replayHash: string;
  readonly replayLineageHash: string;
  readonly admissible: boolean;
  readonly frozen: boolean;
  readonly revoked: boolean;
  readonly immutable: true;
  readonly bindingHash: string;
}

export interface ApprovalGovernanceBinding {
  readonly governanceBindingId: string;
  readonly proposalId: string;
  readonly governanceSnapshotId: string;
  readonly policySnapshotId: string;
  readonly authorityBoundaryId: string;
  readonly approvalRequirementSetId: string;
  readonly validatorVersionSetId: string;
  readonly immutable: true;
  readonly bindingHash: string;
}

export interface OperatorOverrideBinding {
  readonly overrideBindingId: string;
  readonly proposalId: string;
  readonly operatorId: string;
  readonly disposition:
    | "REVIEW_ONLY"
    | "FREEZE"
    | "REVOKE"
    | "DENY_ADMISSIBILITY";
  readonly reason: string;
  readonly governanceSnapshotId: string;
  readonly replayId: string;
  readonly supersedesAutomation: true;
  readonly immutable: true;
  readonly overrideHash: string;
  readonly boundAt: string;
}

export type ApprovalAuditEventType =
  | "approval.bound"
  | "approval.validated"
  | "approval.invalidated"
  | "approval.revoked"
  | "approval.replayed"
  | "approval.rejected"
  | "override.bound"
  | "override.replayed"
  | "override.escalated"
  | "admissibility.denied"
  | "replay.rejected";

export interface ApprovalAuditEntry {
  readonly auditEntryId: string;
  readonly proposalId: string;
  readonly bindingId: string;
  readonly eventType: ApprovalAuditEventType;
  readonly timestamp: string;
  readonly inputHash: string;
  readonly outputHash: string;
  readonly previousEntryHash?: string;
  readonly entryHash: string;
  readonly appendOnly: true;
  readonly replayCompatible: true;
  readonly executionAuthorized: false;
  readonly runtimeMutationOccurred: false;
  readonly scheduledActionCreated: false;
  readonly authorityChanged: false;
  readonly operatorReviewRequired: true;
}

export interface ApprovalReplayResult {
  readonly replayable: boolean;
  readonly replayId: string;
  readonly reconstructedApprovalIds: readonly string[];
  readonly reconstructedGovernanceBindings: readonly string[];
  readonly reconstructedDependencyIds: readonly string[];
  readonly reconstructedValidityWindowIds: readonly string[];
  readonly reconstructedAuthorityBoundaryIds: readonly string[];
  readonly reconstructedOverrideBindingIds: readonly string[];
  readonly reconstructedRevocationIds: readonly string[];
  readonly replayHash: string;
  readonly deterministic: true;
}

export interface ApprovalAdmissibilityResult {
  readonly admissible: boolean;
  readonly status:
    | "ADMISSIBLE"
    | "FROZEN"
    | "REVOKED"
    | "DENIED"
    | "FAILED_CLOSED";
  readonly reasons: readonly string[];
  readonly operatorReviewRequired: true;
  readonly deterministicHash: string;
}

export interface OverrideLineage {
  readonly lineageId: string;
  readonly proposalId: string;
  readonly overrideBindingIds: readonly string[];
  readonly lineageHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type ProposalApprovalBindingErrorCode =
  | "PROPOSAL_APPROVAL_BINDING_MISSING_LINEAGE"
  | "PROPOSAL_APPROVAL_BINDING_REPLAY_DRIFT"
  | "PROPOSAL_APPROVAL_BINDING_AUTHORITY_MISMATCH"
  | "PROPOSAL_APPROVAL_BINDING_GOVERNANCE_MISMATCH"
  | "PROPOSAL_APPROVAL_BINDING_REVOCATION_AMBIGUITY"
  | "PROPOSAL_APPROVAL_BINDING_VALIDITY_WINDOW_AMBIGUOUS"
  | "PROPOSAL_APPROVAL_BINDING_DEPENDENCY_MISSING"
  | "PROPOSAL_APPROVAL_BINDING_OVERRIDE_CORRUPTED"
  | "PROPOSAL_APPROVAL_BINDING_INFERRED_APPROVAL"
  | "PROPOSAL_APPROVAL_BINDING_EXECUTION_SEMANTIC"
  | "PROPOSAL_APPROVAL_BINDING_ORCHESTRATION_SEMANTIC"
  | "PROPOSAL_APPROVAL_BINDING_SCHEDULER_SEMANTIC"
  | "PROPOSAL_APPROVAL_BINDING_RUNTIME_MUTATION"
  | "PROPOSAL_APPROVAL_BINDING_FREEZE_BYPASS"
  | "PROPOSAL_APPROVAL_BINDING_REVOCATION_BYPASS"
  | "PROPOSAL_APPROVAL_BINDING_GOVERNANCE_SUBSTITUTION"
  | "PROPOSAL_APPROVAL_BINDING_DEPENDENCY_FABRICATION"
  | "PROPOSAL_APPROVAL_BINDING_APPROVAL_REGENERATION"
  | "PROPOSAL_APPROVAL_BINDING_OVERRIDE_BYPASS"
  | "PROPOSAL_APPROVAL_BINDING_FAIL_CLOSED";

export type ProposalApprovalBindingError = Readonly<{
  code: ProposalApprovalBindingErrorCode;
  message: string;
  path: string;
}>;

export type ProposalApprovalBindingStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type ProposalApprovalBindingLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ApprovalOverrideRequest = Readonly<{
  overrideId: string;
  operatorId: string;
  disposition:
    | "REVIEW_ONLY"
    | "FREEZE"
    | "REVOKE"
    | "DENY_ADMISSIBILITY";
  reason: string;
  boundAt: string;
  supersedesAutomation: true;
}>;

export type ProposalApprovalBindingInput = Readonly<{
  approvalBindingRunId: string;
  evaluatedAt: string;
  constitutionalVersion: string;
  proposalStateEngineResult: ProposalStateEngineResult;
  proposalFreezeResult: ProposalFreezeResult;
  proposalRevocationResult: ProposalRevocationResult;
  proposalGovernanceBindingResult: GovernanceBindingResult;
  proposalReplayResult: ProposalReplayResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  constitutionalEnforcementResult: ConstitutionalEnforcementResult;
  approvals: readonly ApprovalDependency[];
  validityWindow: ApprovalValidityWindow;
  operatorOverrideRequest?: ApprovalOverrideRequest;
  existingLineage?: ApprovalLineage;
  existingOverrideLineage?: OverrideLineage;
  existingAuditLedger?: readonly ProposalApprovalBindingLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type ProposalApprovalBindingResult = Readonly<{
  status: ApprovalBindingStatus;
  binding: ApprovalBinding;
  governanceBinding: ApprovalGovernanceBinding;
  replayBinding: ApprovalReplayBinding;
  replayResult: ApprovalReplayResult;
  admissibility: ApprovalAdmissibilityResult;
  lineage: ApprovalLineage;
  overrideLineage: OverrideLineage;
  approvals: readonly ApprovalDependency[];
  validityWindow: ApprovalValidityWindow;
  overrideBinding?: OperatorOverrideBinding;
  revocation?: ApprovalRevocation;
  auditEntries: readonly ApprovalAuditEntry[];
  auditLedger: readonly ProposalApprovalBindingLedgerEntry[];
  errors: readonly ProposalApprovalBindingError[];
  warnings: readonly string[];
  stages: readonly ProposalApprovalBindingStageRecord[];
  deterministicHash: string;
  derivedOnly: true;
}>;

export type ApprovalBindingContracts = Readonly<{
  governanceSnapshot: GovernanceSnapshot;
  authorityBoundary: AuthorityBoundary;
  validatorVersionSet: ValidatorVersionSet;
  approvalRequirementBinding: ApprovalRequirementBinding;
}>;
