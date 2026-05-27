import type { ProposalApproval } from "@/types/proposal-lifecycle-engine";
import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import type { BoundedOrchestrationRecord } from "@/types/bounded-orchestration-framework";
import type { CoordinationReplayError } from "./coordinationReplayErrors";
import type { CoordinationReplayAuditArtifact } from "./coordinationReplayAudit";
import type { ImmutableReplayLineageLedger } from "./coordinationReplayLineage";

export interface CoordinationReplayAuthorityContract {
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

export type CoordinationReplayState =
  | "reconstructed"
  | "restricted"
  | "frozen"
  | "invalid"
  | "fail_closed";

export type CoordinationReplayInput = Readonly<{
  replayId: string;
  coordinationRecord: ConstitutionalCoordinationRecord;
  routingResult: ApprovalAwareRoutingResult;
  orchestrationRecord: BoundedOrchestrationRecord;
  approval: ProposalApproval;
  createdAt: string;
  existingLedger?: ImmutableReplayLineageLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type GovernanceReplayView = Readonly<{
  governanceSnapshotId: string;
  governanceSnapshotHash: string;
  governanceLineageId: string;
  readinessHash: string;
  valid: boolean;
  bindingHash: string;
}>;

export type ApprovalReplayView = Readonly<{
  approvalId: string;
  status: ProposalApproval["status"];
  explicit: boolean;
  approvers: readonly string[];
  scopeHash: string;
  governanceDecisionHash: string;
  valid: boolean;
  chronologyHash: string;
}>;

export type EscalationReplayView = Readonly<{
  escalationSnapshotId?: string;
  escalationLineageId?: string;
  escalationSnapshotHash?: string;
  replaySafe: boolean;
  bindingHash?: string;
}>;

export type OrchestrationReplayView = Readonly<{
  orchestrationId: string;
  orchestrationState: string;
  ceiling: string;
  containmentState: string;
  topologyHash: string;
  isolationHash: string;
  deterministicHash: string;
}>;

export type CoordinationReplayResult = Readonly<{
  replayId: string;
  coordinationId: string;
  proposalId: string;
  state: CoordinationReplayState;
  authorityContract: CoordinationReplayAuthorityContract;
  governance: GovernanceReplayView;
  approval: ApprovalReplayView;
  routing: ApprovalAwareRoutingResult["replayLog"];
  escalation: EscalationReplayView;
  orchestration: OrchestrationReplayView;
  ledger: ImmutableReplayLineageLedger;
  audit: CoordinationReplayAuditArtifact;
  deterministicHash: string;
  warnings: readonly string[];
  errors: readonly CoordinationReplayError[];
  derivedOnly: true;
}>;
