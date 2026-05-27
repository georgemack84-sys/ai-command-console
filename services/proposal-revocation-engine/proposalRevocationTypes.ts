import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalEnforcementResult } from "@/services/constitutional-enforcement/types/constitutionalEnforcementTypes";
import type { ProposalFreezeResult } from "@/services/proposal-freeze-layer/types/proposalFreezeTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type { ProposalStateEngineInput, ProposalStateEngineResult } from "@/services/proposal-state-engine/types/proposalStateTypes";
import type { RecommendationReplayResult } from "@/services/recommendation-replay/types/recommendationReplayTypes";

export interface ProposalRevocationRequest {
  proposalId: string;
  revocationReason:
    | "POLICY_MISMATCH"
    | "AUTHORITY_MISMATCH"
    | "REPLAY_DRIFT"
    | "AUDIT_INCONSISTENCY"
    | "DEPENDENCY_INVALIDATION"
    | "APPROVAL_LINEAGE_FAILURE"
    | "GOVERNANCE_INVALIDATION"
    | "MANUAL_OPERATOR_REVOCATION";
  requestedBy:
    | "SYSTEM"
    | "GOVERNANCE"
    | "OPERATOR";
  governanceSnapshotId: string;
  replaySnapshotId: string;
  auditSnapshotId: string;
  dependencySnapshotId: string;
  executionAuthorized: false;
}

export type ProposalRevocationState =
  | "NOT_REVOKED"
  | "REVOCATION_REQUESTED"
  | "REVOCATION_VALIDATED"
  | "REVOKED"
  | "CASCADE_IN_PROGRESS"
  | "CASCADE_COMPLETED"
  | "FAILED_CLOSED";

export interface ProposalRevocationLineage {
  revocationId: string;
  proposalId: string;
  sourceRevocationId?: string;
  cascadeRootProposalId: string;
  revokedDependencyIds: string[];
  revokedApprovalIds: string[];
  invalidatedReplayIds: string[];
  affectedGovernanceBindingIds: string[];
  revocationReason: string;
  revocationDepth: number;
  lineageHash: string;
  previousLineageHash?: string;
}

export interface RevocationAuditEntry {
  auditEntryId: string;
  revocationId: string;
  proposalId: string;
  eventType:
    | "REVOCATION_REQUESTED"
    | "REVOCATION_VALIDATED"
    | "PROPOSAL_REVOKED"
    | "DEPENDENCY_INVALIDATED"
    | "APPROVAL_REVOKED"
    | "REPLAY_REVOKED"
    | "GOVERNANCE_CONTAINED"
    | "REVOCATION_COMPLETED"
    | "REVOCATION_FAILED_CLOSED";
  timestamp: string;
  inputHash: string;
  outputHash?: string;
  previousAuditHash?: string;
  auditHash: string;
  executionAuthorized: false;
  runtimeMutationOccurred: false;
}

export type ProposalRevocationErrorCode =
  | "PROPOSAL_REVOCATION_PROPOSAL_MISSING"
  | "PROPOSAL_REVOCATION_GOVERNANCE_SNAPSHOT_MISSING"
  | "PROPOSAL_REVOCATION_REPLAY_SNAPSHOT_MISSING"
  | "PROPOSAL_REVOCATION_AUDIT_SNAPSHOT_MISSING"
  | "PROPOSAL_REVOCATION_DEPENDENCY_SNAPSHOT_MISSING"
  | "PROPOSAL_REVOCATION_GOVERNANCE_MISMATCH"
  | "PROPOSAL_REVOCATION_REPLAY_AMBIGUITY"
  | "PROPOSAL_REVOCATION_DEPENDENCY_LINEAGE_INCOMPLETE"
  | "PROPOSAL_REVOCATION_APPROVAL_LINEAGE_INCOMPLETE"
  | "PROPOSAL_REVOCATION_AUDIT_CORRUPTION"
  | "PROPOSAL_REVOCATION_HASH_MISMATCH"
  | "PROPOSAL_REVOCATION_CASCADE_INCONSISTENT"
  | "PROPOSAL_REVOCATION_HISTORICAL_TRUTH_CONFLICT"
  | "PROPOSAL_REVOCATION_EXECUTION_SEMANTIC"
  | "PROPOSAL_REVOCATION_SCHEDULER_SEMANTIC"
  | "PROPOSAL_REVOCATION_ORCHESTRATION_SEMANTIC"
  | "PROPOSAL_REVOCATION_AUTHORITY_RESTORATION"
  | "PROPOSAL_REVOCATION_RESURRECTION_ATTEMPT"
  | "PROPOSAL_REVOCATION_FAIL_CLOSED";

export type ProposalRevocationError = Readonly<{
  code: ProposalRevocationErrorCode;
  message: string;
  path: string;
}>;

export type ProposalRevocationAuditLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ProposalRevocationInvalidationRecord = Readonly<{
  invalidationId: string;
  proposalId: string;
  category: "dependency" | "approval" | "replay" | "governance";
  targetId: string;
  invalidated: true;
  deterministicHash: string;
}>;

export type ProposalRevocationPropagationRecord = Readonly<{
  propagationId: string;
  proposalId: string;
  target:
    | "proposal-state-engine"
    | "proposal-freeze-layer"
    | "approval-systems"
    | "dependency-registries"
    | "replay-systems"
    | "governance-registries"
    | "immutable-audit-systems";
  blocked: true;
  revocationState: ProposalRevocationState;
  propagationHash: string;
}>;

export type ProposalRevocationStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type ProposalRevocationReplayPolicy = Readonly<{
  replayAdmissibleForAudit: true;
  replayAdmissibleForReconstruction: true;
  replayAdmissibleForGovernanceReview: true;
  replayAdmissibleForForensics: true;
  executionRestorationBlocked: true;
  approvalRestorationBlocked: true;
  progressionRestorationBlocked: true;
  orchestrationRestorationBlocked: true;
  policyHash: string;
}>;

export type ProposalRevocationInput = Readonly<{
  revocationRunId: string;
  evaluatedAt: string;
  constitutionalVersion: string;
  request: ProposalRevocationRequest;
  proposalStateEngineInput: ProposalStateEngineInput;
  proposalStateEngineResult: ProposalStateEngineResult;
  proposalFreezeResult: ProposalFreezeResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  recommendationReplayResult: RecommendationReplayResult;
  constitutionalEnforcementResult: ConstitutionalEnforcementResult;
  existingLineage?: ProposalRevocationLineage;
  existingAuditLedger?: readonly ProposalRevocationAuditLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type ProposalRevocationResult = Readonly<{
  status: ProposalRevocationState;
  revocationId: string;
  request: ProposalRevocationRequest;
  lineage: ProposalRevocationLineage;
  invalidations: readonly ProposalRevocationInvalidationRecord[];
  replayPolicy: ProposalRevocationReplayPolicy;
  propagation: readonly ProposalRevocationPropagationRecord[];
  auditEntries: readonly RevocationAuditEntry[];
  auditLedger: readonly ProposalRevocationAuditLedgerEntry[];
  errors: readonly ProposalRevocationError[];
  warnings: readonly string[];
  stages: readonly ProposalRevocationStageRecord[];
  deterministicHash: string;
  derivedOnly: true;
}>;
