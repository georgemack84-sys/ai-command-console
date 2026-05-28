import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { BoundedOrchestrationRecord } from "@/types/bounded-orchestration-framework";
import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import type { CoordinationReplayResult } from "@/types/coordination-replay";
import type { EscalationAwareCoordinationResult } from "@/types/escalation-aware-coordination";
import type { HumanCoordinationOverrideError } from "./overrideErrors";
import type { OverrideAuditEvent, OverrideEvidenceRecord, OverrideReplayLedgerEntry } from "./overrideAudit";
import type { OverrideLineage } from "./overrideLineage";
import type { CoordinationLineageInspection, EscalationRationaleInspection, ReplayVisibilityInspection } from "./overrideReplay";
import type { CoordinationOverrideType, HumanCoordinationOverrideState } from "./overrideStates";

export interface HumanCoordinationOverrideAuthorityContract {
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

export interface OperatorAuthorizationSnapshot {
  operatorId: string;
  authenticated: boolean;
  governanceAuthorized: boolean;
  roles: readonly string[];
}

export interface HumanCoordinationOverrideRecord {
  overrideId: string;
  coordinationId: string;
  overrideType: CoordinationOverrideType;
  overrideState: HumanCoordinationOverrideState;
  initiatedBy: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  reason: string;
  createdAt: string;
  replaySafe: boolean;
  failClosed: boolean;
}

export type HumanCoordinationOverrideInput = Readonly<{
  overrideId: string;
  overrideType: CoordinationOverrideType;
  operator: OperatorAuthorizationSnapshot;
  reason: string;
  coordinationRecord: ConstitutionalCoordinationRecord;
  routingResult: ApprovalAwareRoutingResult;
  orchestrationRecord: BoundedOrchestrationRecord;
  coordinationReplay: CoordinationReplayResult;
  escalationResult: EscalationAwareCoordinationResult;
  createdAt: string;
  existingLineage?: OverrideLineage;
  existingReplayLedger?: readonly OverrideReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type HumanCoordinationOverrideResult = Readonly<{
  record: HumanCoordinationOverrideRecord;
  authorityContract: HumanCoordinationOverrideAuthorityContract;
  lineage: OverrideLineage;
  replayLedger: readonly OverrideReplayLedgerEntry[];
  auditEvents: readonly OverrideAuditEvent[];
  evidence: OverrideEvidenceRecord;
  replayInspection: ReplayVisibilityInspection;
  coordinationInspection: CoordinationLineageInspection;
  escalationInspection: EscalationRationaleInspection;
  warnings: readonly string[];
  errors: readonly HumanCoordinationOverrideError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
