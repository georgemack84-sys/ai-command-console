import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalEnforcementResult } from "@/services/constitutional-enforcement/types/constitutionalEnforcementTypes";
import type { ProposalFreezeResult } from "@/services/proposal-freeze-layer/types/proposalFreezeTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type { ProposalRevocationResult } from "@/services/proposal-revocation-engine/proposalRevocationTypes";
import type { ProposalStateEngineInput, ProposalStateEngineResult } from "@/services/proposal-state-engine/types/proposalStateTypes";
import type { RecommendationReplayResult } from "@/services/recommendation-replay/types/recommendationReplayTypes";

export interface ProposalGovernanceBinding {
  bindingId: string;
  proposalId: string;
  governanceSnapshotId: string;
  policySnapshotId: string;
  authorityBoundaryId: string;
  replayContractId: string;
  validatorVersionSetId: string;
  approvalRequirementSetId: string;
  bindingStatus:
    | "BOUND"
    | "FROZEN"
    | "REVOKED"
    | "INVALID"
    | "DISPUTED";
  immutable: true;
  bindingHash: string;
  lineageHash: string;
  createdAt: string;
}

export interface GovernanceSnapshot {
  governanceSnapshotId: string;
  governanceVersion: string;
  policySnapshotId: string;
  authorityBoundaryId: string;
  replayContractId: string;
  validatorVersionSetId: string;
  approvalRequirementSetId: string;
  constitutionalRulesHash: string;
  createdAt: string;
}

export interface AuthorityBoundary {
  authorityBoundaryId: string;
  proposalId: string;
  allowedScopes: readonly string[];
  forbiddenScopes: readonly string[];
  executionAllowed: false;
  schedulingAllowed: false;
  runtimeMutationAllowed: false;
  maxAuthorityLevel:
    | "NONE"
    | "RECOMMENDATION"
    | "PROPOSAL"
    | "REVIEW_ONLY";
  createdAt: string;
}

export interface ValidatorVersionSet {
  validatorVersionSetId: string;
  transitionValidatorVersion: string;
  policyValidatorVersion: string;
  authorityValidatorVersion: string;
  approvalValidatorVersion: string;
  replayValidatorVersion: string;
  freezeValidatorVersion: string;
  revocationValidatorVersion: string;
  createdAt: string;
}

export interface ApprovalRequirementBinding {
  approvalRequirementSetId: string;
  requiredApproverRoles: readonly string[];
  requiredApprovalCount: number;
  escalationRequired: boolean;
  operatorOverrideAllowed: boolean;
  createdAt: string;
}

export interface GovernanceLineageEvent {
  eventId: string;
  proposalId: string;
  bindingId: string;
  eventType:
    | "GOVERNANCE_BINDING_CREATED"
    | "GOVERNANCE_BINDING_VALIDATED"
    | "GOVERNANCE_BINDING_REPLAYED"
    | "GOVERNANCE_BINDING_FROZEN"
    | "GOVERNANCE_BINDING_REVOKED"
    | "GOVERNANCE_BINDING_DISPUTED";
  governanceSnapshotId: string;
  policySnapshotId: string;
  authorityBoundaryId: string;
  replayContractId: string;
  validatorVersionSetId: string;
  previousHash?: string;
  eventHash: string;
  createdAt: string;
}

export type ProposalGovernanceBindingErrorCode =
  | "PROPOSAL_GOVERNANCE_BINDING_MISSING_GOVERNANCE_SNAPSHOT"
  | "PROPOSAL_GOVERNANCE_BINDING_MISSING_POLICY_SNAPSHOT"
  | "PROPOSAL_GOVERNANCE_BINDING_MISSING_AUTHORITY_BOUNDARY"
  | "PROPOSAL_GOVERNANCE_BINDING_MISSING_REPLAY_CONTRACT"
  | "PROPOSAL_GOVERNANCE_BINDING_VALIDATOR_VERSION_MISMATCH"
  | "PROPOSAL_GOVERNANCE_BINDING_APPROVAL_REQUIREMENT_MISMATCH"
  | "PROPOSAL_GOVERNANCE_BINDING_LINEAGE_CORRUPTED"
  | "PROPOSAL_GOVERNANCE_BINDING_HASH_MISMATCH"
  | "PROPOSAL_GOVERNANCE_BINDING_REPLAY_AMBIGUITY"
  | "PROPOSAL_GOVERNANCE_BINDING_GOVERNANCE_MIGRATION"
  | "PROPOSAL_GOVERNANCE_BINDING_AUTHORITY_EXPANSION"
  | "PROPOSAL_GOVERNANCE_BINDING_EXECUTION_SEMANTIC"
  | "PROPOSAL_GOVERNANCE_BINDING_ORCHESTRATION_SEMANTIC"
  | "PROPOSAL_GOVERNANCE_BINDING_SCHEDULER_SEMANTIC"
  | "PROPOSAL_GOVERNANCE_BINDING_RUNTIME_MUTATION"
  | "PROPOSAL_GOVERNANCE_BINDING_DUPLICATE"
  | "PROPOSAL_GOVERNANCE_BINDING_FAIL_CLOSED";

export type ProposalGovernanceBindingError = Readonly<{
  code: ProposalGovernanceBindingErrorCode;
  message: string;
  path: string;
}>;

export type GovernanceBindingAuditRecord = Readonly<{
  auditId: string;
  bindingId: string;
  proposalId: string;
  eventType: GovernanceLineageEvent["eventType"];
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

export type GovernanceBindingAuditLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type GovernanceBindingStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type GovernanceBindingInput = Readonly<{
  bindingRunId: string;
  evaluatedAt: string;
  constitutionalVersion: string;
  governanceVersion: string;
  policySnapshotId: string;
  authorityBoundary: AuthorityBoundary;
  replayContractId: string;
  validatorVersionSet: ValidatorVersionSet;
  approvalRequirementBinding: ApprovalRequirementBinding;
  proposalStateEngineInput: ProposalStateEngineInput;
  proposalStateEngineResult: ProposalStateEngineResult;
  proposalFreezeResult: ProposalFreezeResult;
  proposalRevocationResult: ProposalRevocationResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  recommendationReplayResult: RecommendationReplayResult;
  constitutionalEnforcementResult: ConstitutionalEnforcementResult;
  existingBinding?: ProposalGovernanceBinding;
  existingLineageEvents?: readonly GovernanceLineageEvent[];
  existingAuditLedger?: readonly GovernanceBindingAuditLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type GovernanceBindingResult = Readonly<{
  status:
    | "BOUND"
    | "FROZEN"
    | "REVOKED"
    | "INVALID"
    | "DISPUTED"
    | "FAILED_CLOSED";
  binding: ProposalGovernanceBinding;
  snapshot: GovernanceSnapshot;
  authorityBoundary: AuthorityBoundary;
  validatorVersionSet: ValidatorVersionSet;
  approvalRequirementBinding: ApprovalRequirementBinding;
  lineageEvents: readonly GovernanceLineageEvent[];
  auditRecords: readonly GovernanceBindingAuditRecord[];
  auditLedger: readonly GovernanceBindingAuditLedgerEntry[];
  errors: readonly ProposalGovernanceBindingError[];
  warnings: readonly string[];
  stages: readonly GovernanceBindingStageRecord[];
  deterministicHash: string;
  derivedOnly: true;
}>;
