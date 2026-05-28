import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { BoundedOrchestrationRecord } from "@/types/bounded-orchestration-framework";
import type { CoordinationReplayResult } from "@/types/coordination-replay";
import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import type { ProposalApproval } from "@/types/proposal-lifecycle-engine";
import type { EscalationAuditRecord, EscalationReplayLedgerEntry } from "./escalationAudit";
import type { EscalationAwareCoordinationError } from "./escalationErrors";
import type { EscalationLineage } from "./escalationLineage";
import type { CoordinationRiskProfile } from "./escalationRisk";
import type { EscalationReason, EscalationState } from "./escalationStates";

export interface EscalationAwareCoordinationAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly approvalInheritance: false;
  readonly authorityInheritance: false;
  readonly autonomousIntervention: false;
  readonly workflowContinuation: false;
}

export interface EscalationRecord {
  escalationId: string;
  coordinationId: string;
  escalationState: EscalationState;
  escalationReason: EscalationReason;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  approvalSnapshotId: string;
  escalationTimestamp: string;
  lineageHash: string;
  replaySafe: boolean;
  failClosed: boolean;
}

export type EscalationAwareCoordinationInput = Readonly<{
  escalationId: string;
  coordinationRecord: ConstitutionalCoordinationRecord;
  routingResult: ApprovalAwareRoutingResult;
  orchestrationRecord: BoundedOrchestrationRecord;
  coordinationReplay: CoordinationReplayResult;
  approval: ProposalApproval;
  createdAt: string;
  existingLineage?: EscalationLineage;
  existingReplayLedger?: readonly EscalationReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type EscalationAwareCoordinationResult = Readonly<{
  record: EscalationRecord;
  authorityContract: EscalationAwareCoordinationAuthorityContract;
  target: ApprovalAwareRoutingResult["target"];
  risk: CoordinationRiskProfile;
  lineage: EscalationLineage;
  audit: EscalationAuditRecord;
  replayLedger: readonly EscalationReplayLedgerEntry[];
  warnings: readonly string[];
  errors: readonly EscalationAwareCoordinationError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
