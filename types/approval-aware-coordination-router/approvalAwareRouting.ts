import type { ProposalApprovalStatus } from "@/types/proposal-lifecycle-engine";
import type { ConstitutionalRoutingAuthority } from "./routingAuthority";
import type { RoutingContainmentState } from "./routingContainment";
import type { RoutingLineage } from "./routingLineage";
import type { RoutingReplayLog } from "./routingReplay";
import type { CoordinationRouteTarget, CoordinationRoutingDecision } from "./routingTransitions";

export type ApprovalStateSnapshot = Readonly<{
  approvalId: string;
  status: ProposalApprovalStatus;
  explicit: boolean;
  approvers: readonly string[];
  scopeHash: string;
  governanceDecisionHash: string;
  valid: boolean;
}>;

export interface ApprovalAwareRoutingInput {
  proposalId: string;
  coordinationId: string;
  requestedTransition: string;
  currentCoordinationState: string;
  targetCoordinationState: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  containmentState: RoutingContainmentState;
  approvalState: ApprovalStateSnapshot;
  priorRoutingLineageIds: string[];
  timestamp: string;
  existingLineage?: RoutingLineage;
  existingReplayLogs?: readonly RoutingReplayLog[];
  metadata?: Readonly<Record<string, unknown>>;
}

export interface ApprovalAwareRoutingResult {
  decision: CoordinationRoutingDecision;
  allowed: boolean;
  target: CoordinationRouteTarget;
  blockedReasons: string[];
  lineageRecordId: string;
  replayLogId: string;
  deterministicHash: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  authorityContract: ConstitutionalRoutingAuthority;
  lineage: RoutingLineage;
  replayLog: RoutingReplayLog;
  warnings: readonly string[];
  errors: readonly string[];
  derivedOnly: true;
}
