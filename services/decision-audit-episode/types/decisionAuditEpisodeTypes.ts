import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { RecommendationValidationResult } from "@/services/constitutional-validator/types/recommendationValidationTypes";
import type { DecisionIntentBoundaryResult } from "@/services/decision-intent-boundary/decisionIntentStateTypes";
import type { DeterministicReplayOutput } from "@/services/deterministic-replay/types/deterministicReplayTypes";
import type { HiddenExecutionDetectionResult } from "@/services/hidden-execution-detection/types/hiddenExecutionDetectionTypes";
import type { OperatorAuthorityResult } from "@/services/operator-authority/types/operatorAuthorityTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type { RecommendationLineageResult } from "@/services/recommendation-lineage/recommendationLineageStateTypes";

export interface DecisionAuditEpisode {
  episodeId: string;
  createdAt: string;
  observationSnapshotId: string;
  contextResolutionSnapshotId: string;
  governanceSnapshotId: string;
  riskClassificationSnapshotId: string;
  proposalSnapshotId: string;
  approvalDependencySnapshotId: string;
  operatorVisibilitySnapshotId: string;
  outcomeSnapshotId: string;
  lineageHash: string;
  governanceHash: string;
  proposalHash: string;
  replayHash: string;
  auditHash: string;
  constitutionalVersion: string;
  replayCertified: boolean;
  executionAuthorized: false;
}

export type DecisionAuditEpisodeErrorCode =
  | "DECISION_AUDIT_EPISODE_MISSING_GOVERNANCE_SNAPSHOT"
  | "DECISION_AUDIT_EPISODE_MISSING_PROPOSAL_SNAPSHOT"
  | "DECISION_AUDIT_EPISODE_MISSING_APPROVAL_LINEAGE"
  | "DECISION_AUDIT_EPISODE_REPLAY_MISMATCH"
  | "DECISION_AUDIT_EPISODE_HASH_MISMATCH"
  | "DECISION_AUDIT_EPISODE_VISIBILITY_MISMATCH"
  | "DECISION_AUDIT_EPISODE_LINEAGE_CORRUPTION"
  | "DECISION_AUDIT_EPISODE_REPLAY_DRIFT"
  | "DECISION_AUDIT_EPISODE_SYNTHETIC_REPLAY"
  | "DECISION_AUDIT_EPISODE_AUTHORITY_AMBIGUITY"
  | "DECISION_AUDIT_EPISODE_HIDDEN_EXECUTION"
  | "DECISION_AUDIT_EPISODE_RECURSIVE_REPLAY"
  | "DECISION_AUDIT_EPISODE_RUNTIME_MUTATION"
  | "DECISION_AUDIT_EPISODE_EXECUTION_METADATA"
  | "DECISION_AUDIT_EPISODE_FAIL_CLOSED";

export type DecisionAuditEpisodeError = Readonly<{
  code: DecisionAuditEpisodeErrorCode;
  message: string;
  path: string;
}>;

export type EpisodeSnapshotRecord = Readonly<{
  snapshotId: string;
  snapshotType:
    | "observation"
    | "context_resolution"
    | "governance"
    | "risk_classification"
    | "proposal"
    | "approval_dependency"
    | "operator_visibility"
    | "outcome";
  snapshotHash: string;
  lineageHash: string;
  immutable: true;
}>;

export type DecisionAuditEpisodeLineageEntry = Readonly<{
  entryId: string;
  episodeId: string;
  recommendationId: string;
  replayCertified: boolean;
  createdAt: string;
  deterministicHash: string;
}>;

export type DecisionAuditEpisodeLineageLedger = Readonly<{
  entries: readonly DecisionAuditEpisodeLineageEntry[];
  lineageHash: string;
}>;

export type DecisionAuditEpisodeLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type DecisionAuditEpisodeInput = Readonly<{
  episodeId: string;
  createdAt: string;
  constitutionalVersion: string;
  validatorVersionId: string;
  decisionIntentBoundaryResult: DecisionIntentBoundaryResult;
  recommendationLineageResult: RecommendationLineageResult;
  recommendationValidationResult: RecommendationValidationResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  deterministicReplayResult: DeterministicReplayOutput;
  hiddenExecutionDetectionResult: HiddenExecutionDetectionResult;
  operatorAuthorityResult: OperatorAuthorityResult;
  existingLineage?: DecisionAuditEpisodeLineageLedger;
  existingAuditLedger?: readonly DecisionAuditEpisodeLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type DecisionAuditEpisodeMetrics = Readonly<{
  replayFreezeTriggered: number;
  failClosedTriggered: number;
  hiddenExecutionDetected: number;
  governancePreserved: number;
  lineageIntegrityPreserved: number;
  metricsHash: string;
}>;

export type DecisionAuditEpisodeExport = Readonly<{
  exportId: string;
  episodeId: string;
  replayHash: string;
  auditHash: string;
  lineageHash: string;
  exportHash: string;
}>;

export type DecisionAuditEpisodeResult = Readonly<{
  episode: DecisionAuditEpisode;
  snapshots: readonly EpisodeSnapshotRecord[];
  lineage: DecisionAuditEpisodeLineageLedger;
  auditLedger: readonly DecisionAuditEpisodeLedgerEntry[];
  metrics: DecisionAuditEpisodeMetrics;
  exportRecord: DecisionAuditEpisodeExport;
  errors: readonly DecisionAuditEpisodeError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
