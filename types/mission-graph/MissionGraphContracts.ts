import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { ProposalFreshnessEvaluation } from "@/services/freshness/proposalFreshnessEngine";
import type { CorrelationComputation } from "@/services/intent-correlation-engine/correlationTypes";
import type { IntentCoordinationGovernanceRecord } from "@/types/intent-coordination-governance-core";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { LifecycleComputation } from "@/types/lifecycle";
import type { MissionGraphError } from "./MissionGraphErrors";
import type { MissionGraphEdge } from "./MissionGraphEdge";
import type { MissionGraphNode } from "./MissionGraphNode";
import type { ProposalLineage } from "./ProposalLineage";
import type { EscalationLineage } from "./EscalationLineage";
import type { GovernanceDependency } from "./GovernanceDependency";
import type { ConfidenceEvolution } from "./ConfidenceEvolution";
import type { ReplayPath } from "./ReplayPath";
import type { LifecycleTopology } from "./LifecycleTopology";

export interface MissionGraphAuthorityContract {
  readonly mayExecute: false;
  readonly mayAuthorizeExecution: false;
  readonly mayAdvanceLifecycle: false;
  readonly mayRepairReplay: false;
  readonly mayRestoreTrust: false;
  readonly mayResumeCoordination: false;
  readonly mayBypassGovernance: false;
  readonly mayGenerateApproval: false;
  readonly mayModifyPolicy: false;
  readonly mayScheduleOperations: false;
  readonly mayDispatchRuntimeActions: false;
  readonly mayInferAuthority: false;
}

export type MissionGraphLedgerEntry = Readonly<{
  entryId: string;
  snapshotId: string;
  graphHash: string;
  createdAt: string;
}>;

export type MissionGraphLedger = Readonly<{
  ledgerId: string;
  entries: readonly MissionGraphLedgerEntry[];
  ledgerHash: string;
}>;

export type SnapshotLineageRecord = Readonly<{
  snapshotId: string;
  sourceHash: string;
  createdAt: string;
}>;

export type MissionGraphSnapshot = Readonly<{
  snapshotId: string;
  missionId: string;
  nodes: readonly MissionGraphNode[];
  edges: readonly MissionGraphEdge[];
  proposalLineages: readonly ProposalLineage[];
  escalationLineages: readonly EscalationLineage[];
  governanceDependencies: readonly GovernanceDependency[];
  confidenceEvolution: readonly ConfidenceEvolution[];
  replayPaths: readonly ReplayPath[];
  lifecycleTopology: readonly LifecycleTopology[];
  snapshotLineage: readonly SnapshotLineageRecord[];
  authorityContract: MissionGraphAuthorityContract;
  visibilityState: "visible" | "frozen";
  governanceEscalationEvidence: readonly string[];
  warnings: readonly string[];
  errors: readonly MissionGraphError[];
  ledger: MissionGraphLedger;
  createdAt: string;
  graphHash: string;
  derivedOnly: true;
}>;

export type MissionGraphInput = Readonly<{
  missionId: string;
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  freshnessEvaluation: ProposalFreshnessEvaluation;
  escalationRecord: GovernanceAwareEscalationRecord;
  correlationComputation: CorrelationComputation;
  coordinationRecord: IntentCoordinationGovernanceRecord;
  createdAt: string;
  existingLedger?: MissionGraphLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;
