import type { ConstitutionalTelemetryResult } from "@/types/adversarial-telemetry";
import type { ApprovalReadinessRecord } from "./readinessApproval";
import type { ReadinessClassification } from "./readinessClassification";
import type { ContainmentReadinessRecord } from "./readinessContainment";
import type { ReadinessEvidence } from "./readinessEvidence";
import type { ReadinessError } from "./readinessErrors";
import type { EscalationReadinessRecord } from "./readinessEscalation";
import type { ReadinessGovernanceBinding, GovernanceReadinessRecord } from "./readinessGovernance";
import type { ReadinessLedgerEntry, ReadinessLineageGraph, ReadinessLineageLedger } from "./readinessLineage";
import type { ReadinessReplayVerification, ReplayReadinessRecord } from "./readinessReplay";
import type {
  DriftResistanceRecord,
  ReadinessRiskProfile,
  RecommendationReadinessRecord,
} from "./readinessRisk";

export interface ConstitutionalReadinessAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly authorityInheritance: false;
  readonly privilegeEscalationAuthority: false;
  readonly adaptiveAutonomyAuthority: false;
  readonly workflowContinuation: false;
  readonly readinessAuthorization: false;
}

export type ConstitutionalReadinessInput = Readonly<{
  readinessId: string;
  adversarialTelemetryResult: ConstitutionalTelemetryResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: ReadinessLineageLedger;
  existingReplayLedger?: readonly ReadinessLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalReadinessRecord = Readonly<{
  readinessId: string;
  coordinationId: string;
  telemetryId: string;
  episodeId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  readinessClassification: ReadinessClassification;
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ConstitutionalReadinessResult = Readonly<{
  record: ConstitutionalReadinessRecord;
  authorityContract: ConstitutionalReadinessAuthorityContract;
  replayReadiness: ReplayReadinessRecord;
  governanceReadiness: GovernanceReadinessRecord;
  approvalReadiness: ApprovalReadinessRecord;
  escalationReadiness: EscalationReadinessRecord;
  recommendationReadiness: RecommendationReadinessRecord;
  driftResistance: DriftResistanceRecord;
  containmentReadiness: ContainmentReadinessRecord;
  governanceBinding: ReadinessGovernanceBinding;
  replayVerification: ReadinessReplayVerification;
  evidence: ReadinessEvidence;
  lineage: ReadinessLineageLedger;
  lineageGraph: ReadinessLineageGraph;
  replayLedger: readonly ReadinessLedgerEntry[];
  risk: ReadinessRiskProfile;
  warnings: readonly string[];
  errors: readonly ReadinessError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
