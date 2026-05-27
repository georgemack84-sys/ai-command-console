import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalEnforcementResult } from "@/services/constitutional-enforcement/types/constitutionalEnforcementTypes";
import type { ImmutableRecommendationLedgerResult } from "@/services/immutable-recommendation-ledger/types/immutableRecommendationLedgerTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type {
  ProposalStateEngineInput,
  ProposalStateEngineResult,
} from "@/services/proposal-state-engine/types/proposalStateTypes";
import type { RecommendationReplayResult } from "@/services/recommendation-replay/types/recommendationReplayTypes";

export type ProposalFreezeState =
  | "ACTIVE"
  | "FROZEN"
  | "PERMANENTLY_FROZEN";

export interface ProposalFreezeRecord {
  freezeId: string;
  proposalId: string;
  freezeState: ProposalFreezeState;
  freezeReason:
    | "REPLAY_DRIFT"
    | "GOVERNANCE_MISMATCH"
    | "POLICY_MISMATCH"
    | "AUTHORITY_MISMATCH"
    | "AUDIT_INCONSISTENCY"
    | "DEPENDENCY_CORRUPTION"
    | "APPROVAL_LINEAGE_INSTABILITY"
    | "REPLAY_RECONSTRUCTION_FAILURE";
  governanceSnapshotId: string;
  replaySnapshotId: string;
  evidenceSnapshotIds: string[];
  approvalSnapshotIds: string[];
  dependencySnapshotIds: string[];
  auditEpisodeIds: string[];
  freezeHash: string;
  frozenAt: string;
}

export interface ProposalFreezeEvent {
  freezeEventId: string;
  proposalId: string;
  eventType:
    | "FREEZE_TRIGGERED"
    | "FREEZE_PROPAGATED"
    | "FREEZE_VALIDATED"
    | "FREEZE_REPLAYED"
    | "FREEZE_AUDITED";
  freezeReason: string;
  governanceHash: string;
  replayHash: string;
  lineageHash: string;
  createdAt: string;
}

export const PROPOSAL_FREEZE_STORAGE_TABLES = Object.freeze([
  "proposal_freeze_records",
  "proposal_freeze_events",
  "replay_drift_snapshots",
  "governance_mismatch_snapshots",
  "dependency_integrity_snapshots",
  "approval_lineage_snapshots",
  "freeze_audit_snapshots",
] as const);

export type ProposalFreezeErrorCode =
  | "PROPOSAL_FREEZE_REPLAY_DRIFT"
  | "PROPOSAL_FREEZE_GOVERNANCE_MISMATCH"
  | "PROPOSAL_FREEZE_POLICY_MISMATCH"
  | "PROPOSAL_FREEZE_AUTHORITY_MISMATCH"
  | "PROPOSAL_FREEZE_AUDIT_INCONSISTENCY"
  | "PROPOSAL_FREEZE_DEPENDENCY_CORRUPTION"
  | "PROPOSAL_FREEZE_APPROVAL_LINEAGE_INSTABILITY"
  | "PROPOSAL_FREEZE_REPLAY_RECONSTRUCTION_FAILURE"
  | "PROPOSAL_FREEZE_STATE_BYPASS"
  | "PROPOSAL_FREEZE_UNFREEZE_ATTEMPT"
  | "PROPOSAL_FREEZE_LINEAGE_MUTATION"
  | "PROPOSAL_FREEZE_HIDDEN_EXECUTION"
  | "PROPOSAL_FREEZE_HIDDEN_ORCHESTRATION"
  | "PROPOSAL_FREEZE_SCHEDULER_SEMANTIC"
  | "PROPOSAL_FREEZE_FAIL_CLOSED";

export type ProposalFreezeError = Readonly<{
  code: ProposalFreezeErrorCode;
  message: string;
  path: string;
}>;

export type ProposalFreezeAuditRecord = Readonly<{
  auditId: string;
  freezeId: string;
  proposalId: string;
  eventType: ProposalFreezeEvent["eventType"];
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

export type ProposalFreezePropagationRecord = Readonly<{
  propagationId: string;
  proposalId: string;
  target:
    | "proposal-state-engine"
    | "replay-validators"
    | "governance-registries"
    | "approval-systems"
    | "dependency-registries"
    | "immutable-audit-systems"
    | "operator-visibility-systems";
  blocked: true;
  freezeState: ProposalFreezeState;
  propagationHash: string;
}>;

export type ProposalFreezeLineageEntry = Readonly<{
  lineageEntryId: string;
  proposalId: string;
  freezeId: string;
  freezeEventId: string;
  freezeState: ProposalFreezeState;
  createdAt: string;
  deterministicHash: string;
}>;

export type ProposalFreezeLineageLog = Readonly<{
  lineageId: string;
  proposalId: string;
  entries: readonly ProposalFreezeLineageEntry[];
  lineageHash: string;
}>;

export type ProposalFreezeStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type ProposalFreezeSnapshotRecord = Readonly<{
  tableName: (typeof PROPOSAL_FREEZE_STORAGE_TABLES)[number];
  snapshotId: string;
  proposalId: string;
  snapshotHash: string;
}>;

export type ProposalFreezeInput = Readonly<{
  freezeRunId: string;
  evaluatedAt: string;
  constitutionalVersion: string;
  proposalStateEngineInput: ProposalStateEngineInput;
  proposalStateEngineResult: ProposalStateEngineResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  recommendationReplayResult: RecommendationReplayResult;
  immutableRecommendationLedgerResult: ImmutableRecommendationLedgerResult;
  constitutionalEnforcementResult: ConstitutionalEnforcementResult;
  existingFreezeRecord?: ProposalFreezeRecord;
  existingFreezeEvents?: readonly ProposalFreezeEvent[];
  existingLineage?: ProposalFreezeLineageLog;
  existingAuditLedger?: readonly ProposalFreezeAuditLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type ProposalFreezeAuditLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ProposalFreezeResult = Readonly<{
  status: "ACTIVE" | "FROZEN" | "PERMANENTLY_FROZEN" | "FAILED_CLOSED";
  freezeRecord: ProposalFreezeRecord;
  freezeEvents: readonly ProposalFreezeEvent[];
  propagation: readonly ProposalFreezePropagationRecord[];
  lineage: ProposalFreezeLineageLog;
  snapshots: readonly ProposalFreezeSnapshotRecord[];
  auditRecords: readonly ProposalFreezeAuditRecord[];
  auditLedger: readonly ProposalFreezeAuditLedgerEntry[];
  stages: readonly ProposalFreezeStageRecord[];
  errors: readonly ProposalFreezeError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
