import type { ConstitutionalReplayAttackResult } from "@/types/constitutional-replay";
import type { GovernanceDriftEvidenceRecord } from "./governanceDriftEvidence";
import type { GovernanceDriftError } from "./governanceDriftErrors";
import type { GovernanceDriftHashes } from "./governanceDriftHashes";
import type {
  GovernanceDriftLineage,
  GovernanceDriftLineageGraph,
  GovernanceDriftReplayLedgerEntry,
} from "./governanceDriftLineage";
import type { GovernanceDriftSeverity } from "./governanceDriftSeverity";
import type { GovernanceDriftState } from "./governanceDriftStates";
import type { GovernanceDriftTopologyRecord } from "./governanceDriftTopology";
import type { GovernanceDriftViolation } from "./governanceDriftViolations";

export interface GovernanceDriftAuthorityContract {
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

export type GovernanceDriftRecord = Readonly<{
  driftId: string;
  coordinationId: string;
  replayAttackId: string;
  conflictId: string;
  recommendationId: string;
  driftState: GovernanceDriftState;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type GovernanceDriftInput = Readonly<{
  driftId: string;
  replayAttackResult: ConstitutionalReplayAttackResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: GovernanceDriftLineage;
  existingReplayLedger?: readonly GovernanceDriftReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type GovernanceDriftFinding = Readonly<{
  findingId: string;
  driftId: string;
  category:
    | "GOVERNANCE_DRIFT"
    | "REPLAY_DRIFT"
    | "CONFIDENCE_DRIFT"
    | "ESCALATION_DRIFT"
    | "DEPENDENCY_DRIFT"
    | "RECOMMENDATION_DRIFT";
  severity: GovernanceDriftSeverity;
  rationale: string;
  advisoryOnly: true;
  deterministicHash: string;
}>;

export type GovernanceDriftInspection = Readonly<{
  driftId: string;
  coordinationId: string;
  driftState: string;
  categories: readonly string[];
  inspectionHash: string;
}>;

export type ReplayDriftInspection = Readonly<{
  replayId: string;
  replayDeterministic: boolean;
  replayState: string;
  replayLedgerId: string;
  inspectionHash: string;
}>;

export type ConfidenceDriftInspection = Readonly<{
  confidenceLinked: boolean;
  confidenceSafe: boolean;
  inspectionHash: string;
}>;

export type EscalationDriftInspection = Readonly<{
  escalationId: string;
  escalationState: string;
  escalationLineageId: string;
  inspectionHash: string;
}>;

export type DependencyDriftInspection = Readonly<{
  dependencyLineageId: string;
  dependencySafe: boolean;
  inspectionHash: string;
}>;

export type RecommendationDriftInspection = Readonly<{
  recommendationId: string;
  recommendationState: string;
  recommendationLinked: boolean;
  inspectionHash: string;
}>;

export type GovernanceDriftBoundaryInspection = Readonly<{
  topologyFrozen: boolean;
  isolationSafe: boolean;
  inspectionHash: string;
}>;

export type GovernanceDriftResult = Readonly<{
  record: GovernanceDriftRecord;
  authorityContract: GovernanceDriftAuthorityContract;
  findings: readonly GovernanceDriftFinding[];
  violations: readonly GovernanceDriftViolation[];
  lineage: GovernanceDriftLineage;
  lineageGraph: GovernanceDriftLineageGraph;
  topology: GovernanceDriftTopologyRecord;
  replayLedger: readonly GovernanceDriftReplayLedgerEntry[];
  evidence: GovernanceDriftEvidenceRecord;
  hashes: GovernanceDriftHashes;
  driftInspection: GovernanceDriftInspection;
  replayInspection: ReplayDriftInspection;
  confidenceInspection: ConfidenceDriftInspection;
  escalationInspection: EscalationDriftInspection;
  dependencyInspection: DependencyDriftInspection;
  recommendationInspection: RecommendationDriftInspection;
  boundaryInspection: GovernanceDriftBoundaryInspection;
  warnings: readonly string[];
  errors: readonly GovernanceDriftError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
