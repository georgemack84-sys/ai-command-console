import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { BoundedOrchestrationRecord } from "@/types/bounded-orchestration-framework";
import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import type { CoordinationReplayResult } from "@/types/coordination-replay";
import type { EscalationAwareCoordinationResult } from "@/types/escalation-aware-coordination";
import type { HumanCoordinationOverrideResult } from "@/types/human-coordination-override";
import type { BoundaryReplayLedgerEntry, BoundaryEvidenceRecord, BoundaryViolationInspection, OrchestrationBoundaryInspection, RecursiveWorkflowInspection } from "./boundaryReplay";
import type { BoundaryLineage } from "./boundaryLineage";
import type { CoordinationBoundaryError } from "./boundaryErrors";
import type { BoundaryViolation } from "./boundaryViolations";
import type { CoordinationBoundaryState, CoordinationBoundaryVerdict } from "./boundaryStates";

export interface CoordinationBoundaryAuthorityContract {
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

export type CoordinationBoundaryInput = Readonly<{
  boundaryId: string;
  coordinationRecord: ConstitutionalCoordinationRecord;
  routingResult: ApprovalAwareRoutingResult;
  orchestrationRecord: BoundedOrchestrationRecord;
  coordinationReplay: CoordinationReplayResult;
  escalationResult: EscalationAwareCoordinationResult;
  overrideResult: HumanCoordinationOverrideResult;
  createdAt: string;
  existingLineage?: BoundaryLineage;
  existingReplayLedger?: readonly BoundaryReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CoordinationBoundaryRecord = Readonly<{
  boundaryId: string;
  coordinationId: string;
  verdict: CoordinationBoundaryVerdict;
  boundaryState: CoordinationBoundaryState;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type CoordinationBoundaryResult = Readonly<{
  record: CoordinationBoundaryRecord;
  authorityContract: CoordinationBoundaryAuthorityContract;
  violations: readonly BoundaryViolation[];
  lineage: BoundaryLineage;
  replayLedger: readonly BoundaryReplayLedgerEntry[];
  evidence: BoundaryEvidenceRecord;
  orchestrationInspection: OrchestrationBoundaryInspection;
  recursiveInspection: RecursiveWorkflowInspection;
  violationInspection: BoundaryViolationInspection;
  warnings: readonly string[];
  errors: readonly CoordinationBoundaryError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
