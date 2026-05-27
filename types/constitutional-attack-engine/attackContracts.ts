import type { ApprovalAwareRoutingResult } from "@/types/approval-aware-coordination-router";
import type { BoundedOrchestrationRecord } from "@/types/bounded-orchestration-framework";
import type { CoordinationBoundaryResult } from "@/types/coordination-boundary-enforcement";
import type { CoordinationReadinessCertificationResult } from "@/types/coordination-readiness-certification";
import type { CoordinationReplayResult } from "@/types/coordination-replay";
import type { ConstitutionalCoordinationRecord } from "@/types/constitutional-coordination";
import type { EscalationAwareCoordinationResult } from "@/types/escalation-aware-coordination";
import type { HumanCoordinationOverrideResult } from "@/types/human-coordination-override";
import type { AttackEvidenceRecord } from "./attackEvidence";
import type { ConstitutionalAttackError } from "./attackErrors";
import type { AttackLineage } from "./attackLineage";
import type {
  AttackReplayLedgerEntry,
  AttackSimulationInspection,
  ConfidenceAttackInspection,
  ConstitutionalWeaknessInspection,
  DependencyAttackInspection,
  EscalationAttackInspection,
  GovernanceAttackInspection,
  ReplayAttackInspection,
} from "./attackReplay";
import type { AttackScenarioCategory, AttackSimulationState } from "./attackStates";
import type { AttackVector, AdversarialScenarioRecord } from "./attackVectors";
import type { AttackViolation } from "./attackViolations";
import type { ConstitutionalWeakness } from "./attackWeaknesses";

export interface ConstitutionalAttackAuthorityContract {
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

export type ConstitutionalAttackEngineInput = Readonly<{
  attackId: string;
  scenarioCategory: AttackScenarioCategory;
  deterministicSeed: string;
  coordinationRecord: ConstitutionalCoordinationRecord;
  routingResult: ApprovalAwareRoutingResult;
  orchestrationRecord: BoundedOrchestrationRecord;
  coordinationReplay: CoordinationReplayResult;
  escalationResult: EscalationAwareCoordinationResult;
  overrideResult: HumanCoordinationOverrideResult;
  boundaryResult: CoordinationBoundaryResult;
  readinessResult: CoordinationReadinessCertificationResult;
  createdAt: string;
  existingLineage?: AttackLineage;
  existingReplayLedger?: readonly AttackReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalAttackRecord = Readonly<{
  attackId: string;
  coordinationId: string;
  readinessCertificationId: string;
  scenarioId: string;
  scenarioCategory: AttackScenarioCategory;
  attackState: AttackSimulationState;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ConstitutionalAttackResult = Readonly<{
  record: ConstitutionalAttackRecord;
  authorityContract: ConstitutionalAttackAuthorityContract;
  scenario: AdversarialScenarioRecord;
  vector: AttackVector;
  weaknesses: readonly ConstitutionalWeakness[];
  violations: readonly AttackViolation[];
  lineage: AttackLineage;
  replayLedger: readonly AttackReplayLedgerEntry[];
  evidence: AttackEvidenceRecord;
  attackInspection: AttackSimulationInspection;
  governanceInspection: GovernanceAttackInspection;
  escalationInspection: EscalationAttackInspection;
  dependencyInspection: DependencyAttackInspection;
  confidenceInspection: ConfidenceAttackInspection;
  replayInspection: ReplayAttackInspection;
  weaknessInspection: ConstitutionalWeaknessInspection;
  warnings: readonly string[];
  errors: readonly ConstitutionalAttackError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
