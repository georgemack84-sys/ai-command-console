import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { ProposalFreshnessEvaluation } from "@/services/freshness/proposalFreshnessEngine";
import type { LifecycleComputation } from "@/types/lifecycle";
import type { MissionGraphSnapshot } from "@/types/mission-graph";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { CoordinationOverride } from "./CoordinationOverride";
import type { EmergencyFreeze } from "./EmergencyFreeze";
import type { HumanSupremacyError } from "./HumanSupremacyErrors";
import type { InterventionLineage } from "./InterventionLineage";
import type { InterventionSnapshot } from "./InterventionSnapshot";
import type { HumanSupremacyAction, HumanSupremacyAuthorityContract } from "./OverrideContracts";
import type { HumanSupremacyState } from "./HumanSupremacyState";

export type RationaleInspection = Readonly<{
  rationaleSnapshotId: string;
  coordinationId: string;
  operatorReason: string;
  warnings: readonly string[];
  rationaleHash: string;
}>;

export type GovernanceInspection = Readonly<{
  governanceLineageId: string;
  coordinationId: string;
  governanceSnapshotHash: string;
  readinessHash: string;
  governanceVisible: true;
  inspectionHash: string;
}>;

export type ReplayInspection = Readonly<{
  replayLineageId: string;
  coordinationId: string;
  replayHashes: readonly string[];
  replaySafe: boolean;
  inspectionHash: string;
}>;

export type EscalationInspection = Readonly<{
  escalationLineageId: string;
  coordinationId: string;
  escalationId: string;
  severity: import("@/types/escalation").EscalationSeverity;
  state: import("@/types/escalation").EscalationState;
  inspectionHash: string;
}>;

export type ConfidenceInspection = Readonly<{
  confidenceLineageId: string;
  coordinationId: string;
  confidenceScore: number;
  uncertaintyScore: number;
  driftRiskScore: number;
  inspectionHash: string;
}>;

export type HumanSupremacyInput = Readonly<{
  coordinationId: string;
  operatorId: string;
  action: HumanSupremacyAction;
  overrideType: CoordinationOverride["overrideType"];
  reason: string;
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  freshnessEvaluation: ProposalFreshnessEvaluation;
  escalationRecord: GovernanceAwareEscalationRecord;
  missionGraph: MissionGraphSnapshot;
  createdAt: string;
  existingLineage?: InterventionLineage;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type HumanSupremacyRecord = Readonly<{
  coordinationId: string;
  state: HumanSupremacyState;
  action: HumanSupremacyAction;
  authorityContract: HumanSupremacyAuthorityContract;
  override?: CoordinationOverride;
  emergencyFreeze?: EmergencyFreeze;
  snapshot: InterventionSnapshot;
  lineage: InterventionLineage;
  rationaleInspection: RationaleInspection;
  governanceInspection: GovernanceInspection;
  replayInspection: ReplayInspection;
  escalationInspection: EscalationInspection;
  confidenceInspection: ConfidenceInspection;
  warnings: readonly string[];
  errors: readonly HumanSupremacyError[];
  interventionHash: string;
  derivedOnly: true;
}>;
