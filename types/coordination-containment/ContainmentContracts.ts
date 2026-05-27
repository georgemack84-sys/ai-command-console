import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import type { ProposalFreshnessEvaluation } from "@/services/freshness/proposalFreshnessEngine";
import type { LifecycleComputation } from "@/types/lifecycle";
import type { MissionGraphSnapshot } from "@/types/mission-graph";
import type { HumanSupremacyRecord, InterventionSnapshot } from "@/types/human-supremacy";
import type { ContainmentError } from "./ContainmentErrors";
import type { ContainmentState } from "./ContainmentState";

export interface CoordinationContainmentAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly approvalInheritance: false;
  readonly authorityInheritance: false;
  readonly autonomousIntervention: false;
}

export interface ContainmentViolation {
  violationId: string;
  category:
    | "hidden_orchestration"
    | "recursive_coordination"
    | "authority_expansion"
    | "runtime_mutation"
    | "replay_violation"
    | "workflow_synthesis"
    | "silent_retry"
    | "undocumented_transition";
  severity:
    | "low"
    | "elevated"
    | "high"
    | "critical";
  replaySafe: boolean;
  deterministic: boolean;
  containmentRequired: boolean;
  reason: string;
  evidence: readonly string[];
}

export interface AntiEmergenceValidationResult {
  allowed: boolean;
  containmentState: ContainmentState;
  violations: readonly ContainmentViolation[];
  replaySafe: boolean;
  deterministic: boolean;
  governanceEscalationRequired: boolean;
  failClosed: boolean;
}

export type ContainmentLedgerEntry = Readonly<{
  entryId: string;
  coordinationId: string;
  containmentState: ContainmentState;
  violationIds: readonly string[];
  createdAt: string;
  containmentHash: string;
}>;

export type ContainmentLedger = Readonly<{
  ledgerId: string;
  entries: readonly ContainmentLedgerEntry[];
  ledgerHash: string;
}>;

export type ContainmentReplaySnapshot = Readonly<{
  replayId: string;
  coordinationId: string;
  missionGraphHash: string;
  escalationHash: string;
  freshnessHash: string;
  lifecycleHash: string;
  interventionSnapshotId?: string;
  createdAt: string;
  replayHash: string;
}>;

export type CoordinationContainmentInput = Readonly<{
  coordinationId: string;
  missionGraph: MissionGraphSnapshot;
  escalationRecord: GovernanceAwareEscalationRecord;
  freshnessEvaluation: ProposalFreshnessEvaluation;
  lifecycle: LifecycleComputation;
  humanSupremacyRecord?: HumanSupremacyRecord;
  humanSupremacySnapshot?: InterventionSnapshot;
  createdAt: string;
  existingLedger?: ContainmentLedger;
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type CoordinationContainmentRecord = Readonly<{
  coordinationId: string;
  authorityContract: CoordinationContainmentAuthorityContract;
  validation: AntiEmergenceValidationResult;
  replay: ContainmentReplaySnapshot;
  ledger: ContainmentLedger;
  warnings: readonly string[];
  errors: readonly ContainmentError[];
  containmentHash: string;
  derivedOnly: true;
}>;
