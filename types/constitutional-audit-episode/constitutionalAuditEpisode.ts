import type { FutureAutonomyResult } from "@/types/future-autonomy";
import type { ApprovalDependency } from "./constitutionalAuditApprovals";
import type { ConstitutionalDisputeRecord } from "./constitutionalAuditDisputes";
import type { ConstitutionalAuditEvidence } from "./constitutionalAuditEvidence";
import type { ConstitutionalAuditError } from "./constitutionalAuditErrors";
import type { ConstitutionalAuditHashes } from "./constitutionalAuditHashes";
import type {
  ConstitutionalAuditLedgerEntry,
  ConstitutionalAuditLineageGraph,
  ConstitutionalAuditLineageLedger,
  ConstitutionalRiskAnalysisRecord,
  LineageRef,
} from "./constitutionalAuditLineage";
import type { EscalationDecision } from "./constitutionalAuditEscalation";
import type { GovernanceValidationRecord } from "./constitutionalAuditGovernance";
import type { OutcomeRecord, OperatorIntervention } from "./constitutionalAuditOutcome";
import type { ReplayVerificationResult } from "./constitutionalAuditReplay";

export interface ConstitutionalAuditAuthorityContract {
  readonly executionAuthority: false;
  readonly orchestrationAuthority: false;
  readonly schedulingAuthority: false;
  readonly runtimeMutationAuthority: false;
  readonly governanceMutationAuthority: false;
  readonly authorityInheritance: false;
  readonly adaptiveAutonomyAuthority: false;
  readonly workflowContinuation: false;
}

export type ConstitutionalAuditEpisodeRecord = Readonly<{
  episodeId: string;
  coordinationId: string;
  simulationId: string;
  driftId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  episodeState: "verified" | "frozen" | "blocked" | "disputed";
  replaySafe: boolean;
  failClosed: boolean;
  createdAt: string;
}>;

export type ConstitutionalAuditEpisode = Readonly<{
  episodeId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  observationLineage: readonly LineageRef[];
  interpretationLineage: readonly LineageRef[];
  recommendationLineage: readonly LineageRef[];
  riskAnalysis: readonly ConstitutionalRiskAnalysisRecord[];
  escalationDecisions: readonly EscalationDecision[];
  approvalDependencies: readonly ApprovalDependency[];
  governanceValidation: readonly GovernanceValidationRecord[];
  operatorInterventions: readonly OperatorIntervention[];
  outcomes: readonly OutcomeRecord[];
  replayVerification: ReplayVerificationResult;
  constitutionalStateHash: string;
  createdAt: string;
}>;

export type ConstitutionalAuditEpisodeInput = Readonly<{
  episodeId: string;
  futureAutonomyResult: FutureAutonomyResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: ConstitutionalAuditLineageLedger;
  existingReplayLedger?: readonly ConstitutionalAuditLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ConstitutionalAuditEpisodeResult = Readonly<{
  record: ConstitutionalAuditEpisodeRecord;
  authorityContract: ConstitutionalAuditAuthorityContract;
  episode: ConstitutionalAuditEpisode;
  disputes: readonly ConstitutionalDisputeRecord[];
  lineage: ConstitutionalAuditLineageLedger;
  lineageGraph: ConstitutionalAuditLineageGraph;
  replayLedger: readonly ConstitutionalAuditLedgerEntry[];
  evidence: ConstitutionalAuditEvidence;
  hashes: ConstitutionalAuditHashes;
  warnings: readonly string[];
  errors: readonly ConstitutionalAuditError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
