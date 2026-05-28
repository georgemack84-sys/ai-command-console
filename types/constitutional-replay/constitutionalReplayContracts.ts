import type { ApprovalConflictResult } from "@/types/approval-conflict";
import type { ConstitutionalReplayEvidenceRecord } from "./constitutionalReplayEvidence";
import type { ConstitutionalReplayError } from "./constitutionalReplayErrors";
import type { ConstitutionalReplayHashes } from "./constitutionalReplayHashes";
import type {
  ConstitutionalReplayLineage,
  ConstitutionalReplayLineageGraph,
} from "./constitutionalReplayLineage";
import type { ConstitutionalReplayDriftRecord } from "./constitutionalReplayDrift";
import type {
  ConstitutionalReplayAttackCategory,
  ConstitutionalReplayAttackState,
} from "./constitutionalReplayStates";
import type { ConstitutionalReplayTopologyRecord } from "./constitutionalReplayTopology";
import type { ConstitutionalReplayViolation } from "./constitutionalReplayViolations";

export interface ConstitutionalReplayAuthorityContract {
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

export type ConstitutionalReplayScenarioRecord = Readonly<{
  scenarioId: string;
  category: ConstitutionalReplayAttackCategory;
  version: "v1";
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  approvalLineageId: string;
  dependencyLineageId: string;
  deterministicSeed: string;
  markers: readonly string[];
  scenarioHash: string;
}>;

export type ConstitutionalReplayInspection = Readonly<{
  replayAttackId: string;
  coordinationId: string;
  replayAttackState: string;
  categories: readonly string[];
  inspectionHash: string;
}>;

export type ConstitutionalReplayDriftInspection = Readonly<{
  replayAttackId: string;
  driftClasses: readonly string[];
  highestSeverity: string;
  inspectionHash: string;
}>;

export type GovernanceReplayAttackInspection = Readonly<{
  governanceSnapshotId: string;
  governanceLinked: boolean;
  inspectionHash: string;
}>;

export type ValidatorReplayInspection = Readonly<{
  validatorVersionId: string;
  validatorDeterministic: boolean;
  inspectionHash: string;
}>;

export type EvidenceReplayInspection = Readonly<{
  evidenceId: string;
  evidenceImmutable: boolean;
  inspectionHash: string;
}>;

export type ReplayBoundaryInspection = Readonly<{
  topologyFrozen: boolean;
  isolationSafe: boolean;
  inspectionHash: string;
}>;

export type ConstitutionalReplayLedgerEntry = Readonly<{
  ledgerId: string;
  previousHash: string | null;
  entryHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalReplayAttackInput = Readonly<{
  replayAttackId: string;
  scenarioCategory: ConstitutionalReplayAttackCategory;
  approvalConflictResult: ApprovalConflictResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: ConstitutionalReplayLineage;
  existingReplayLedger?: readonly ConstitutionalReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalReplayAttackRecord = Readonly<{
  replayAttackId: string;
  coordinationId: string;
  conflictId: string;
  recommendationId: string;
  attackId: string;
  scenarioId: string;
  replayAttackState: ConstitutionalReplayAttackState;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ConstitutionalReplayAttackResult = Readonly<{
  record: ConstitutionalReplayAttackRecord;
  authorityContract: ConstitutionalReplayAuthorityContract;
  scenario: ConstitutionalReplayScenarioRecord;
  drifts: readonly ConstitutionalReplayDriftRecord[];
  violations: readonly ConstitutionalReplayViolation[];
  lineage: ConstitutionalReplayLineage;
  lineageGraph: ConstitutionalReplayLineageGraph;
  topology: ConstitutionalReplayTopologyRecord;
  replayLedger: readonly ConstitutionalReplayLedgerEntry[];
  evidence: ConstitutionalReplayEvidenceRecord;
  hashes: ConstitutionalReplayHashes;
  replayInspection: ConstitutionalReplayInspection;
  driftInspection: ConstitutionalReplayDriftInspection;
  governanceInspection: GovernanceReplayAttackInspection;
  validatorInspection: ValidatorReplayInspection;
  evidenceInspection: EvidenceReplayInspection;
  boundaryInspection: ReplayBoundaryInspection;
  warnings: readonly string[];
  errors: readonly ConstitutionalReplayError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
