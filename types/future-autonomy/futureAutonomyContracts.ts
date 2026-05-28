import type { GovernanceDriftResult } from "@/types/governance-drift";
import type { FutureAutonomyEvidenceRecord } from "./futureAutonomyEvidence";
import type { FutureAutonomyError } from "./futureAutonomyErrors";
import type { FutureAutonomyHashes } from "./futureAutonomyHashes";
import type {
  FutureAutonomyLineage,
  FutureAutonomyLineageGraph,
  FutureAutonomyReplayLedgerEntry,
  FutureAutonomyReplayLineage,
} from "./futureAutonomyLineage";
import type { FutureAutonomySeverity } from "./futureAutonomySeverity";
import type { FutureAutonomySimulationStatus } from "./futureAutonomyStates";
import type { FutureAutonomyTopologyRecord } from "./futureAutonomyTopology";
import type { FutureAutonomyViolation } from "./futureAutonomyViolations";

export interface FutureAutonomyAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly authorityInheritance: false;
  readonly approvalGrantingAuthority: false;
  readonly adaptiveAutonomyAuthority: false;
  readonly workflowContinuation: false;
}

export type FutureAutonomySimulationInput = Readonly<{
  simulationId: string;
  governanceDriftResult: GovernanceDriftResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: FutureAutonomyLineage;
  existingReplayLedger?: readonly FutureAutonomyReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type FutureAutonomyFinding = Readonly<{
  findingId: string;
  simulationId: string;
  category:
    | "BOUNDED_COORDINATION"
    | "ESCALATION_PROPAGATION"
    | "RECOMMENDATION_CHAIN"
    | "APPROVAL_ROUTING"
    | "CONFIDENCE_EVOLUTION"
    | "ORCHESTRATION_TOPOLOGY";
  severity: FutureAutonomySeverity;
  rationale: string;
  advisoryOnly: true;
  deterministicHash: string;
}>;

export type EscalationRequirement = Readonly<{
  requirementId: string;
  simulationId: string;
  reason: string;
  escalationLevel: "elevated" | "critical";
  deterministicHash: string;
}>;

export interface FutureAutonomySimulationResult {
  readonly simulationId: string;
  readonly status: FutureAutonomySimulationStatus;
  readonly riskLevel: FutureAutonomySeverity;
  readonly governanceBound: true;
  readonly replaySafe: true;
  readonly advisoryOnly: true;
  readonly authorityGranted: false;
  readonly runtimeMutationAllowed: false;
  readonly orchestrationAllowed: false;
  readonly findings: readonly FutureAutonomyFinding[];
  readonly violations: readonly FutureAutonomyViolation[];
  readonly escalationRequirements: readonly EscalationRequirement[];
  readonly evidenceHash: string;
  readonly lineageHash: string;
  readonly replayHash: string;
  readonly finalResultHash: string;
}

export type FutureAutonomyRecord = Readonly<{
  simulationId: string;
  coordinationId: string;
  driftId: string;
  replayAttackId: string;
  recommendationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  status: FutureAutonomySimulationStatus;
  riskLevel: FutureAutonomySeverity;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type FutureAutonomyBoundaryInspection = Readonly<{
  topologyFrozen: boolean;
  isolationSafe: boolean;
  inspectionHash: string;
}>;

export type FutureAutonomyRiskReport = Readonly<{
  reportId: string;
  simulationId: string;
  riskLevel: FutureAutonomySeverity;
  findingIds: readonly string[];
  deterministicHash: string;
}>;

export type FutureAutonomyResult = Readonly<{
  record: FutureAutonomyRecord;
  authorityContract: FutureAutonomyAuthorityContract;
  result: FutureAutonomySimulationResult;
  findings: readonly FutureAutonomyFinding[];
  violations: readonly FutureAutonomyViolation[];
  escalationRequirements: readonly EscalationRequirement[];
  lineage: FutureAutonomyLineage;
  replayLineage: FutureAutonomyReplayLineage;
  lineageGraph: FutureAutonomyLineageGraph;
  topology: FutureAutonomyTopologyRecord;
  replayLedger: readonly FutureAutonomyReplayLedgerEntry[];
  evidence: FutureAutonomyEvidenceRecord;
  hashes: FutureAutonomyHashes;
  boundaryInspection: FutureAutonomyBoundaryInspection;
  riskReport: FutureAutonomyRiskReport;
  warnings: readonly string[];
  errors: readonly FutureAutonomyError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
