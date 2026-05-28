import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalCertificationResult } from "@/services/constitutional-certification/certificationStateTypes";
import type { RecommendationValidationResult } from "@/services/constitutional-validator/types/recommendationValidationTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { DecisionIntentBoundaryResult } from "@/services/decision-intent-boundary/decisionIntentStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { OperatorAuthorityResult } from "@/services/operator-authority/types/operatorAuthorityTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";
import type { RecommendationLineageResult } from "@/services/recommendation-lineage/recommendationLineageStateTypes";

export interface ReplayRequest {
  replayId: string;
  recommendationId: string;
  replaySnapshotId: string;
  governanceSnapshotId: string;
  validatorSnapshotIds: string[];
  policySnapshotIds: string[];
  approvalDependencyIds: string[];
  evidenceSnapshotIds: string[];
  scoringSnapshotId: string;
  confidenceSnapshotId: string;
  suppressionSnapshotIds: string[];
  requestedBy: string;
  createdAt: string;
}

export interface ReplayResult {
  replayId: string;
  recommendationId: string;
  deterministic: boolean;
  replayHash: string;
  reconstructedRecommendationHash: string;
  originalRecommendationHash: string;
  governanceValidated: boolean;
  suppressionValidated: boolean;
  driftDetected: boolean;
  replayCertified: boolean;
  certificationReason?: string;
  generatedAt: string;
}

export interface ImmutableReplaySnapshot {
  snapshotId: string;
  snapshotType: string;
  snapshotHash: string;
  createdAt: string;
  immutable: true;
  lineageHash: string;
  dependencyHashes: string[];
}

export type DeterministicReplayErrorCode =
  | "DETERMINISTIC_REPLAY_SCHEMA_INVALID"
  | "DETERMINISTIC_REPLAY_MISSING_SNAPSHOT"
  | "DETERMINISTIC_REPLAY_CORRUPTED_LINEAGE"
  | "DETERMINISTIC_REPLAY_MISSING_DEPENDENCY"
  | "DETERMINISTIC_REPLAY_GOVERNANCE_MISMATCH"
  | "DETERMINISTIC_REPLAY_VALIDATOR_MISMATCH"
  | "DETERMINISTIC_REPLAY_SCORING_MISMATCH"
  | "DETERMINISTIC_REPLAY_CONFIDENCE_MISMATCH"
  | "DETERMINISTIC_REPLAY_SUPPRESSION_MISMATCH"
  | "DETERMINISTIC_REPLAY_POLICY_MISMATCH"
  | "DETERMINISTIC_REPLAY_DEPENDENCY_MISMATCH"
  | "DETERMINISTIC_REPLAY_LINEAGE_MISMATCH"
  | "DETERMINISTIC_REPLAY_HASH_MISMATCH"
  | "DETERMINISTIC_REPLAY_RUNTIME_DEPENDENCY"
  | "DETERMINISTIC_REPLAY_LIVE_REGISTRY_ACCESS"
  | "DETERMINISTIC_REPLAY_AUTHORITY_RESTORATION"
  | "DETERMINISTIC_REPLAY_SUPPRESSION_BYPASS"
  | "DETERMINISTIC_REPLAY_RECURSIVE_LOOP"
  | "DETERMINISTIC_REPLAY_APPROXIMATION"
  | "DETERMINISTIC_REPLAY_DYNAMIC_SUBSTITUTION"
  | "DETERMINISTIC_REPLAY_REPAIR_ATTEMPT"
  | "DETERMINISTIC_REPLAY_HIDDEN_MUTATION"
  | "DETERMINISTIC_REPLAY_HISTORICAL_DRIFT"
  | "DETERMINISTIC_REPLAY_FAIL_CLOSED";

export type DeterministicReplayError = Readonly<{
  code: DeterministicReplayErrorCode;
  message: string;
  path: string;
}>;

export type DeterministicReplayInput = Readonly<{
  request: ReplayRequest;
  decisionIntentBoundaryResult: DecisionIntentBoundaryResult;
  recommendationLineageResult: RecommendationLineageResult;
  recommendationValidationResult: RecommendationValidationResult;
  operatorAuthorityResult: OperatorAuthorityResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  constitutionalCertificationResult?: ConstitutionalCertificationResult;
  proposalIntegrityResult?: ProposalIntegrityResult;
  deterministicSeed: string;
  validatorVersionId: string;
  generatedAt: string;
  existingLineage?: DeterministicReplayLineageLedger;
  existingAuditLedger?: readonly DeterministicReplayLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ReplayDependencyNode = Readonly<{
  nodeId: string;
  nodeType:
    | "evidence"
    | "governance"
    | "validator"
    | "policy"
    | "approval"
    | "scoring"
    | "confidence"
    | "suppression"
    | "recommendation"
    | "replay";
  snapshotId: string;
  deterministicHash: string;
}>;

export type ReplayDependencyEdge = Readonly<{
  from: string;
  to: string;
  relation: "depends_on" | "validated_by" | "suppressed_by" | "reconstructed_by";
  deterministicHash: string;
}>;

export type ReplayDependencyGraph = Readonly<{
  nodes: readonly ReplayDependencyNode[];
  edges: readonly ReplayDependencyEdge[];
  graphHash: string;
}>;

export type ReplayGovernanceBinding = Readonly<{
  governanceSnapshotId: string;
  governanceValidated: boolean;
  policySnapshotIds: readonly string[];
  validatorSnapshotIds: readonly string[];
  governanceHash: string;
}>;

export type ReplayPolicyBinding = Readonly<{
  policySnapshotIds: readonly string[];
  policyValidated: boolean;
  policyHash: string;
}>;

export type ReplayValidatorBinding = Readonly<{
  validatorSnapshotIds: readonly string[];
  validatorValidated: boolean;
  validatorHash: string;
}>;

export type ReplayScoringRecord = Readonly<{
  scoringSnapshotId: string;
  scoreFactors: readonly string[];
  scoreWeights: Readonly<Record<string, number>>;
  reconstructedScore: number;
  scoringHash: string;
}>;

export type ReplayConfidenceRecord = Readonly<{
  confidenceSnapshotId: string;
  confidenceScore: number;
  confidenceReasoning: readonly string[];
  uncertaintyFactors: readonly string[];
  confidenceHash: string;
}>;

export type ReplaySuppressionRecord = Readonly<{
  suppressionSnapshotIds: readonly string[];
  suppressionValidated: boolean;
  continuityInvalidated: boolean;
  suppressionHash: string;
}>;

export type ReplayIntegrityRecord = Readonly<{
  deterministic: boolean;
  driftDetected: boolean;
  governanceValidated: boolean;
  suppressionValidated: boolean;
  integrityHash: string;
}>;

export type ReplayCertificationRecord = Readonly<{
  certified: boolean;
  reason: string;
  certificationHash: string;
}>;

export type ReplayEvidenceBundle = Readonly<{
  bundleId: string;
  recommendationId: string;
  evidenceRefs: readonly string[];
  evidenceHash: string;
}>;

export type DeterministicReplaySnapshot = Readonly<{
  snapshotId: string;
  replayId: string;
  recommendationId: string;
  replayHash: string;
  graphHash: string;
  snapshotHash: string;
}>;

export type DeterministicReplayLineageEntry = Readonly<{
  entryId: string;
  replayId: string;
  recommendationId: string;
  replayCertified: boolean;
  generatedAt: string;
  deterministicHash: string;
}>;

export type DeterministicReplayLineageLedger = Readonly<{
  entries: readonly DeterministicReplayLineageEntry[];
  lineageHash: string;
}>;

export type DeterministicReplayLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type DeterministicReplayForensics = Readonly<{
  exportId: string;
  replayId: string;
  replayHash: string;
  evidenceHash: string;
  lineageHash: string;
  exportHash: string;
}>;

export type DeterministicReplayMetrics = Readonly<{
  replayDuration: number;
  replayDeterminismRate: number;
  replayCertificationRate: number;
  replayInvalidationFrequency: number;
  governanceMismatchFrequency: number;
  suppressionMismatchFrequency: number;
  dependencyFailures: number;
  driftFrequency: number;
  metricsHash: string;
}>;

export type DeterministicReplayOutput = Readonly<{
  result: ReplayResult;
  immutableSnapshots: readonly ImmutableReplaySnapshot[];
  dependencyGraph: ReplayDependencyGraph;
  governanceBinding: ReplayGovernanceBinding;
  policyBinding: ReplayPolicyBinding;
  validatorBinding: ReplayValidatorBinding;
  scoring: ReplayScoringRecord;
  confidence: ReplayConfidenceRecord;
  suppression: ReplaySuppressionRecord;
  integrity: ReplayIntegrityRecord;
  certification: ReplayCertificationRecord;
  evidenceBundle: ReplayEvidenceBundle;
  snapshot: DeterministicReplaySnapshot;
  lineage: DeterministicReplayLineageLedger;
  auditLedger: readonly DeterministicReplayLedgerEntry[];
  forensics: DeterministicReplayForensics;
  metrics: DeterministicReplayMetrics;
  errors: readonly DeterministicReplayError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
