import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalEnforcementResult } from "@/services/constitutional-enforcement/types/constitutionalEnforcementTypes";
import type { ProposalFreezeResult } from "@/services/proposal-freeze-layer/types/proposalFreezeTypes";
import type { ProposalGovernanceBinding, GovernanceSnapshot, ApprovalRequirementBinding, AuthorityBoundary, ValidatorVersionSet, GovernanceBindingResult } from "@/services/proposal-governance-binding/governanceBindingTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type { ProposalRevocationResult } from "@/services/proposal-revocation-engine/proposalRevocationTypes";
import type { ProposalStateEngineInput, ProposalStateEngineResult } from "@/services/proposal-state-engine/types/proposalStateTypes";
import type { RecommendationReplayResult } from "@/services/recommendation-replay/types/recommendationReplayTypes";

export interface ProposalReplay {
  readonly replayId: string;
  readonly proposalId: string;
  readonly proposalSnapshotId: string;
  readonly governanceSnapshotId: string;
  readonly policySnapshotId: string;
  readonly validatorSnapshotIds: readonly string[];
  readonly approvalSnapshotIds: readonly string[];
  readonly dependencySnapshotIds: readonly string[];
  readonly authoritySnapshotId: string;
  readonly replayContractId: string;
  readonly reconstructedLifecycle: readonly string[];
  readonly reconstructedGovernance: readonly string[];
  readonly reconstructedApprovals: readonly string[];
  readonly reconstructedDependencies: readonly string[];
  readonly reconstructedAuthority: readonly string[];
  readonly replayHash: string;
  readonly deterministic: boolean;
  readonly replayedAt: string;
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

export type ProposalReplayErrorCode =
  | "PROPOSAL_REPLAY_MISSING_PROPOSAL_SNAPSHOT"
  | "PROPOSAL_REPLAY_MISSING_GOVERNANCE_SNAPSHOT"
  | "PROPOSAL_REPLAY_MISSING_POLICY_SNAPSHOT"
  | "PROPOSAL_REPLAY_MISSING_REPLAY_CONTRACT"
  | "PROPOSAL_REPLAY_VALIDATOR_VERSION_UNAVAILABLE"
  | "PROPOSAL_REPLAY_APPROVAL_SNAPSHOT_MISSING"
  | "PROPOSAL_REPLAY_DEPENDENCY_SNAPSHOT_MISSING"
  | "PROPOSAL_REPLAY_AUTHORITY_SNAPSHOT_MISSING"
  | "PROPOSAL_REPLAY_GOVERNANCE_MISMATCH"
  | "PROPOSAL_REPLAY_VALIDATOR_MISMATCH"
  | "PROPOSAL_REPLAY_DEPENDENCY_MISMATCH"
  | "PROPOSAL_REPLAY_APPROVAL_MISMATCH"
  | "PROPOSAL_REPLAY_AUTHORITY_MISMATCH"
  | "PROPOSAL_REPLAY_AUDIT_HASH_MISMATCH"
  | "PROPOSAL_REPLAY_LINEAGE_CORRUPTED"
  | "PROPOSAL_REPLAY_DETERMINISM_UNPROVEN"
  | "PROPOSAL_REPLAY_EXECUTION_SEMANTIC"
  | "PROPOSAL_REPLAY_ORCHESTRATION_SEMANTIC"
  | "PROPOSAL_REPLAY_SCHEDULER_SEMANTIC"
  | "PROPOSAL_REPLAY_RUNTIME_MUTATION"
  | "PROPOSAL_REPLAY_REVOKED"
  | "PROPOSAL_REPLAY_FROZEN"
  | "PROPOSAL_REPLAY_FAIL_CLOSED";

export type ProposalReplayError = Readonly<{
  code: ProposalReplayErrorCode;
  message: string;
  path: string;
}>;

export type ProposalReplayStatus =
  | "COMPLETED"
  | "FROZEN"
  | "FAILED_CLOSED";

export type ProposalReplayAuditEventType =
  | "replay.started"
  | "replay.snapshot.loaded"
  | "replay.governance.bound"
  | "replay.validator.bound"
  | "replay.dependencies.bound"
  | "replay.authority.bound"
  | "replay.drift.detected"
  | "replay.certified"
  | "replay.failed";

export type ProposalReplayAuditRecord = Readonly<{
  auditId: string;
  replayId: string;
  proposalId: string;
  eventType: ProposalReplayAuditEventType;
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

export type ProposalReplayLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ProposalReplayStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type ProposalReplayCertification = Readonly<{
  certified: boolean;
  deterministicOrderingVerified: boolean;
  governanceReconstructionVerified: boolean;
  approvalReconstructionVerified: boolean;
  dependencyReconstructionVerified: boolean;
  authorityReconstructionVerified: boolean;
  validatorReconstructionVerified: boolean;
  replayHashStable: boolean;
  auditReproducible: boolean;
  certificationHash: string;
}>;

export type ProposalReplayLineageRecord = Readonly<{
  proposalId: string;
  stateLineageId: string;
  governanceBindingId: string;
  freezeLineageId?: string;
  revocationLineageId?: string;
  proposalLineageHash: string;
  replayLineageHash: string;
}>;

export type ProposalReplayInput = Readonly<{
  replayRunId: string;
  replayedAt: string;
  constitutionalVersion: string;
  proposalStateEngineInput: ProposalStateEngineInput;
  proposalStateEngineResult: ProposalStateEngineResult;
  proposalFreezeResult: ProposalFreezeResult;
  proposalRevocationResult: ProposalRevocationResult;
  proposalGovernanceBindingResult: GovernanceBindingResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  recommendationReplayResult: RecommendationReplayResult;
  constitutionalEnforcementResult: ConstitutionalEnforcementResult;
  existingAuditLedger?: readonly ProposalReplayLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type ProposalReplaySnapshotBundle = Readonly<{
  proposalSnapshotId: string;
  governanceSnapshot: GovernanceSnapshot;
  governanceBinding: ProposalGovernanceBinding;
  authorityBoundary: AuthorityBoundary;
  validatorVersionSet: ValidatorVersionSet;
  approvalRequirementBinding: ApprovalRequirementBinding;
  proposalSnapshotHash: string;
}>;

export type ProposalReplayResult = Readonly<{
  status: ProposalReplayStatus;
  replay: ProposalReplay;
  drifts: readonly ReplayDrift[];
  lineage: ProposalReplayLineageRecord;
  snapshotBundle: ProposalReplaySnapshotBundle;
  auditRecords: readonly ProposalReplayAuditRecord[];
  auditLedger: readonly ProposalReplayLedgerEntry[];
  certification: ProposalReplayCertification;
  errors: readonly ProposalReplayError[];
  warnings: readonly string[];
  stages: readonly ProposalReplayStageRecord[];
  deterministicHash: string;
  derivedOnly: true;
}>;
