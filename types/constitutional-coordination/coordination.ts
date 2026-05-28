import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { LifecycleComputation } from "@/types/lifecycle";
import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { MissionGraphSnapshot } from "@/types/mission-graph";
import type { CoordinationContainmentRecord } from "@/types/coordination-containment";
import type { HumanSupremacyRecord } from "@/types/human-supremacy";
import type { ConstitutionalGovernanceBinding } from "./governanceBinding";
import type { ConstitutionalReplayBinding } from "./replayBinding";
import type { ConstitutionalEscalationBinding } from "./escalationBinding";
import type { ConstitutionalCoordinationError, ConstitutionalCoordinationValidation } from "./coordinationValidation";

export type ConstitutionalCoordinationState =
  | "created"
  | "validated"
  | "governance_bound"
  | "replay_bound"
  | "escalation_bound"
  | "coordinated"
  | "restricted"
  | "frozen"
  | "invalid";

export type ConstitutionalCeilingLevel =
  | "strict"
  | "restricted"
  | "frozen";

export interface ConstitutionalCoordinationAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly approvalInheritance: false;
  readonly authorityInheritance: false;
  readonly autonomousIntervention: false;
}

export type ConstitutionalCoordinationLineageEntry = Readonly<{
  entryId: string;
  coordinationId: string;
  coordinationState: ConstitutionalCoordinationState;
  constitutionalCeilingLevel: ConstitutionalCeilingLevel;
  deterministicHash: string;
  createdAt: string;
}>;

export type ConstitutionalCoordinationLineage = Readonly<{
  lineageId: string;
  entries: readonly ConstitutionalCoordinationLineageEntry[];
  lineageHash: string;
}>;

export interface ConstitutionalCoordinationRecord {
  coordinationId: string;
  proposalId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  coordinationState: ConstitutionalCoordinationState;
  constitutionalCeilingLevel: ConstitutionalCeilingLevel;
  lineage: {
    governanceLineageId: string;
    replayLineageId: string;
    escalationLineageId?: string;
  };
  authorityContract: ConstitutionalCoordinationAuthorityContract;
  governanceBinding: ConstitutionalGovernanceBinding;
  replayBinding: ConstitutionalReplayBinding;
  escalationBinding?: ConstitutionalEscalationBinding;
  validation: ConstitutionalCoordinationValidation;
  chronology: ConstitutionalCoordinationLineage;
  deterministicHash: string;
  createdAt: string;
  updatedAt: string;
  warnings: readonly string[];
  errors: readonly ConstitutionalCoordinationError[];
  derivedOnly: true;
}

export type ConstitutionalCoordinationInput = Readonly<{
  coordinationId: string;
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  escalationRecord: GovernanceAwareEscalationRecord;
  missionGraph: MissionGraphSnapshot;
  containmentRecord: CoordinationContainmentRecord;
  humanSupremacyRecord?: HumanSupremacyRecord;
  createdAt: string;
  existingChronology?: ConstitutionalCoordinationLineage;
  metadata?: Readonly<Record<string, unknown>>;
}>;
