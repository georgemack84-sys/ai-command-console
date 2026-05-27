import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { BoundedOrchestrationRecord } from "@/types/bounded-orchestration-framework";
import type { CoordinationReplayResult } from "@/types/coordination-replay";
import type { EscalationAwareCoordinationResult } from "@/types/escalation-aware-coordination";
import type { HumanCoordinationOverrideResult } from "@/types/human-coordination-override";
import type { CoordinationBoundaryResult } from "@/types/coordination-boundary-enforcement";
import type { CertificationEvidenceRecord } from "./certificationEvidence";
import type { CoordinationReadinessCertificationError } from "./certificationErrors";
import type { CertificationLineage } from "./certificationLineage";
import type {
  BoundaryCertificationInspection,
  CertificationInspection,
  CertificationReplayLedgerEntry,
  EscalationCertificationInspection,
  GovernanceCertificationInspection,
  ReplayCertificationInspection,
} from "./certificationReplay";
import type { CoordinationReadinessCertificationState } from "./certificationStates";
import type { CoordinationReadinessViolation } from "./certificationViolations";

export interface CoordinationReadinessAuthorityContract {
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

export type CoordinationReadinessCertificationInput = Readonly<{
  certificationId: string;
  coordinationRecord: ConstitutionalCoordinationRecord;
  routingResult: ApprovalAwareRoutingResult;
  orchestrationRecord: BoundedOrchestrationRecord;
  coordinationReplay: CoordinationReplayResult;
  escalationResult: EscalationAwareCoordinationResult;
  overrideResult: HumanCoordinationOverrideResult;
  boundaryResult: CoordinationBoundaryResult;
  createdAt: string;
  existingLineage?: CertificationLineage;
  existingReplayLedger?: readonly CertificationReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CoordinationReadinessCertificationRecord = Readonly<{
  certificationId: string;
  coordinationId: string;
  certificationState: CoordinationReadinessCertificationState;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type CoordinationReadinessCertificationResult = Readonly<{
  record: CoordinationReadinessCertificationRecord;
  authorityContract: CoordinationReadinessAuthorityContract;
  violations: readonly CoordinationReadinessViolation[];
  lineage: CertificationLineage;
  replayLedger: readonly CertificationReplayLedgerEntry[];
  evidence: CertificationEvidenceRecord;
  certificationInspection: CertificationInspection;
  replayInspection: ReplayCertificationInspection;
  governanceInspection: GovernanceCertificationInspection;
  escalationInspection: EscalationCertificationInspection;
  boundaryInspection: BoundaryCertificationInspection;
  warnings: readonly string[];
  errors: readonly CoordinationReadinessCertificationError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
