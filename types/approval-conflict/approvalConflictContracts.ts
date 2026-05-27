import type { RecommendationIntegrityResult } from "@/types/recommendation-integrity";
import type { ApprovalConflictEvidenceRecord } from "./approvalConflictEvidence";
import type { ApprovalConflictError } from "./approvalConflictErrors";
import type {
  ApprovalConflictLineage,
  ApprovalConflictLineageGraph,
} from "./approvalConflictLineage";
import type {
  ApprovalConflictInspection,
  ApprovalConflictReplayInspection,
  ApprovalConflictReplayLedgerEntry,
  CircularConflictInspection,
  EscalationConflictInspection,
  GovernanceConflictInspection,
  InheritanceConflictInspection,
} from "./approvalConflictReplay";
import type { ApprovalConflictEscalationRecord } from "./approvalConflictEscalation";
import type { ApprovalConflictState } from "./approvalConflictStates";
import type { ApprovalConflictViolation } from "./approvalConflictViolations";
import type { ApprovalConflictWeakness } from "./approvalConflictWeaknesses";

export interface ApprovalConflictAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly approvalInheritance: false;
  readonly authorityInheritance: false;
  readonly autonomousIntervention: false;
  readonly workflowContinuation: false;
}

export type ApprovalConflictStressInput = Readonly<{
  conflictId: string;
  recommendationResult: RecommendationIntegrityResult;
  deterministicSeed: string;
  createdAt: string;
  existingLineage?: ApprovalConflictLineage;
  existingReplayLedger?: readonly ApprovalConflictReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ApprovalConflictRecord = Readonly<{
  conflictId: string;
  coordinationId: string;
  recommendationId: string;
  attackId: string;
  approvalConflictState: ApprovalConflictState;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ApprovalConflictResult = Readonly<{
  record: ApprovalConflictRecord;
  authorityContract: ApprovalConflictAuthorityContract;
  weaknesses: readonly ApprovalConflictWeakness[];
  violations: readonly ApprovalConflictViolation[];
  lineage: ApprovalConflictLineage;
  lineageGraph: ApprovalConflictLineageGraph;
  replayLedger: readonly ApprovalConflictReplayLedgerEntry[];
  evidence: ApprovalConflictEvidenceRecord;
  escalationRecord: ApprovalConflictEscalationRecord;
  integrityInspection: ApprovalConflictInspection;
  replayInspection: ApprovalConflictReplayInspection;
  governanceInspection: GovernanceConflictInspection;
  escalationInspection: EscalationConflictInspection;
  inheritanceInspection: InheritanceConflictInspection;
  circularInspection: CircularConflictInspection;
  warnings: readonly string[];
  errors: readonly ApprovalConflictError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
