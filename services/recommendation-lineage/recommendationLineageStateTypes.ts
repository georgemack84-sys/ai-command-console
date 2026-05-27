import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalCertificationResult } from "@/services/constitutional-certification/certificationStateTypes";
import type { ConstitutionalReadinessResult } from "@/services/constitutional-readiness-scoring/readinessStateTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { DecisionIntentBoundaryResult } from "@/services/decision-intent-boundary/decisionIntentStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { RuntimeAdmissibilityResult } from "@/services/runtime-admissibility/runtimeAdmissibilityStateTypes";

export type RecommendationLineageErrorCode =
  | "RECOMMENDATION_LINEAGE_SCHEMA_INVALID"
  | "RECOMMENDATION_LINEAGE_EVIDENCE_GAP"
  | "RECOMMENDATION_LINEAGE_EVIDENCE_DRIFT"
  | "RECOMMENDATION_LINEAGE_GOVERNANCE_GAP"
  | "RECOMMENDATION_LINEAGE_GOVERNANCE_MISMATCH"
  | "RECOMMENDATION_LINEAGE_SCORING_INCONSISTENT"
  | "RECOMMENDATION_LINEAGE_POLICY_SUBSTITUTION"
  | "RECOMMENDATION_LINEAGE_APPROVAL_AMBIGUOUS"
  | "RECOMMENDATION_LINEAGE_OPERATOR_INTERVENTION_MISSING"
  | "RECOMMENDATION_LINEAGE_REPLAY_INVALID"
  | "RECOMMENDATION_LINEAGE_REPLAY_DRIFT"
  | "RECOMMENDATION_LINEAGE_LINEAGE_MUTATION"
  | "RECOMMENDATION_LINEAGE_SYNTHETIC_ANCESTRY"
  | "RECOMMENDATION_LINEAGE_RUNTIME_LINKED"
  | "RECOMMENDATION_LINEAGE_ORCHESTRATION_LINKED"
  | "RECOMMENDATION_LINEAGE_HIDDEN_COORDINATION"
  | "RECOMMENDATION_LINEAGE_AUTHORITY_EXPANSION"
  | "RECOMMENDATION_LINEAGE_CONTAINMENT_FAILURE"
  | "RECOMMENDATION_LINEAGE_GOVERNANCE_BINDING_INVALID"
  | "RECOMMENDATION_LINEAGE_REPLAY_BINDING_INVALID"
  | "RECOMMENDATION_LINEAGE_ISOLATION_VIOLATION"
  | "RECOMMENDATION_LINEAGE_EXECUTION_BLOCKED"
  | "RECOMMENDATION_LINEAGE_FREEZE_REQUIRED"
  | "RECOMMENDATION_LINEAGE_REVOCATION_REQUIRED"
  | "RECOMMENDATION_LINEAGE_ESCALATION_REQUIRED"
  | "RECOMMENDATION_LINEAGE_NONDETERMINISTIC";

export type RecommendationLineageError = Readonly<{
  code: RecommendationLineageErrorCode;
  message: string;
  path: string;
}>;

export type RecommendationEvidenceSnapshot = Readonly<{
  snapshotId: string;
  evidenceHash: string;
  provenanceRef: string;
  sourceVersion: string;
  acquiredAt: string;
}>;

export type RecommendationScoringSnapshot = Readonly<{
  scoringSnapshotId: string;
  scoringFactors: readonly string[];
  scoringWeights: Readonly<Record<string, number>>;
  arbitrationDecisions: readonly string[];
  thresholdDecisions: readonly string[];
  rankingLogic: readonly string[];
  confidenceReasoning: readonly string[];
  uncertaintyFactors: readonly string[];
}>;

export type RecommendationPolicySnapshot = Readonly<{
  policySnapshotId: string;
  applicablePolicies: readonly string[];
  inheritedPolicies: readonly string[];
  overriddenPolicies: readonly string[];
  conflictPolicies: readonly string[];
}>;

export type RecommendationApprovalSnapshot = Readonly<{
  approvalSnapshotId: string;
  approvalDependencies: readonly string[];
  escalationApprovals: readonly string[];
  approvalRevocations: readonly string[];
  overrideHistory: readonly string[];
  operatorInterventions: readonly string[];
}>;

export type RecommendationLineageInput = Readonly<{
  recommendationId: string;
  lineageId: string;
  evidenceSnapshots: readonly RecommendationEvidenceSnapshot[];
  scoringSnapshot: RecommendationScoringSnapshot;
  policySnapshot: RecommendationPolicySnapshot;
  approvalSnapshot: RecommendationApprovalSnapshot;
  constitutionalCertificationResult: ConstitutionalCertificationResult;
  constitutionalReadinessResult: ConstitutionalReadinessResult;
  runtimeAdmissibilityResult: RuntimeAdmissibilityResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  decisionIntentBoundaryResult: DecisionIntentBoundaryResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  deterministicSeed: string;
  validatorVersionId: string;
  createdAt: string;
  existingLineage?: RecommendationLineageLedger;
  existingReplayLedger?: readonly RecommendationLineageLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export interface RecommendationLineageArtifact {
  recommendationId: string;
  lineageId: string;
  evidenceSnapshotIds: string[];
  governanceSnapshotId: string;
  scoringSnapshotId: string;
  policySnapshotId: string;
  approvalSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  interventionSnapshotId?: string;
  lineageHash: string;
  replayHash: string;
  governanceHash: string;
  approvalHash: string;
  createdAt: string;
  advisoryOnly: true;
  executable: false;
  executionAuthorized: false;
  orchestrationAllowed: false;
  runtimeMutationAllowed: false;
  authorityMutationAllowed: false;
  governanceMutationAllowed: false;
  schedulerRegistrationAllowed: false;
  operatorReviewRequired: true;
}

export type RecommendationLineageNode = Readonly<{
  nodeId: string;
  nodeType:
    | "evidence"
    | "governance"
    | "scoring"
    | "policy"
    | "approval"
    | "recommendation"
    | "escalation"
    | "intervention"
    | "replay";
  snapshotId: string;
  deterministicHash: string;
}>;

export type RecommendationLineageEdge = Readonly<{
  from: string;
  to: string;
  relation:
    | "depends_on"
    | "validated_by"
    | "reviewed_by"
    | "escalated_by"
    | "replayed_by";
  deterministicHash: string;
}>;

export type RecommendationLineageGraph = Readonly<{
  nodes: readonly RecommendationLineageNode[];
  edges: readonly RecommendationLineageEdge[];
  graphHash: string;
}>;

export type RecommendationLineageSnapshot = Readonly<{
  snapshotId: string;
  recommendationId: string;
  lineageId: string;
  evidenceSnapshotIds: readonly string[];
  governanceSnapshotId: string;
  scoringSnapshotId: string;
  policySnapshotId: string;
  approvalSnapshotId: string;
  replaySnapshotId: string;
  escalationSnapshotId?: string;
  interventionSnapshotId?: string;
  snapshotHash: string;
}>;

export type RecommendationLineageMetrics = Readonly<{
  lineageIntegrityFailures: number;
  replayDriftEvents: number;
  governanceLineageMismatches: number;
  approvalLineageConflicts: number;
  evidenceSnapshotFailures: number;
  lineageReconstructionTime: number;
  lineageHashMismatches: number;
  policyLineageDivergence: number;
  confidenceLineageDrift: number;
  metricsHash: string;
}>;

export type EvidenceLineageRecord = Readonly<{
  snapshotIds: readonly string[];
  evidenceHashes: readonly string[];
  provenanceRefs: readonly string[];
  sourceVersions: readonly string[];
  acquiredAt: readonly string[];
  deterministicHash: string;
}>;

export type GovernanceLineageRecord = Readonly<{
  governanceSnapshotId: string;
  governanceBound: boolean;
  constitutionalBindings: readonly string[];
  validatorVersions: readonly string[];
  governanceEscalationState: string;
  policyEnforcementState: string;
  deterministicHash: string;
}>;

export type ScoringLineageRecord = Readonly<{
  scoringSnapshotId: string;
  scoringFactors: readonly string[];
  scoringWeights: Readonly<Record<string, number>>;
  arbitrationDecisions: readonly string[];
  thresholdDecisions: readonly string[];
  rankingLogic: readonly string[];
  confidenceEvolution: readonly string[];
  deterministicHash: string;
}>;

export type PolicyLineageRecord = Readonly<{
  policySnapshotId: string;
  applicablePolicies: readonly string[];
  inheritedPolicies: readonly string[];
  overriddenPolicies: readonly string[];
  conflictPolicies: readonly string[];
  deterministicHash: string;
}>;

export type ReplayLineageRecord = Readonly<{
  replaySnapshotId: string;
  replayDependencies: readonly string[];
  replayCertified: boolean;
  replayDivergenceDetected: boolean;
  replayReconstructionState: string;
  deterministicHash: string;
}>;

export type ApprovalLineageRecord = Readonly<{
  approvalSnapshotId: string;
  approvalDependencies: readonly string[];
  escalationApprovals: readonly string[];
  operatorInterventions: readonly string[];
  approvalRevocations: readonly string[];
  overrideHistory: readonly string[];
  deterministicHash: string;
}>;

export type RecommendationLineageEvidence = Readonly<{
  evidenceId: string;
  recommendationId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export type RecommendationLineageEntry = Readonly<{
  entryId: string;
  recommendationId: string;
  lineageId: string;
  createdAt: string;
  lineageHash: string;
  failClosed: boolean;
  deterministicHash: string;
}>;

export type RecommendationLineageLedger = Readonly<{
  entries: readonly RecommendationLineageEntry[];
  lineageHash: string;
}>;

export type RecommendationLineageLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type RecommendationLineageResult = Readonly<{
  artifact: RecommendationLineageArtifact;
  graph: RecommendationLineageGraph;
  snapshot: RecommendationLineageSnapshot;
  metrics: RecommendationLineageMetrics;
  evidenceLineage: EvidenceLineageRecord;
  governanceLineage: GovernanceLineageRecord;
  scoringLineage: ScoringLineageRecord;
  policyLineage: PolicyLineageRecord;
  replayLineage: ReplayLineageRecord;
  approvalLineage: ApprovalLineageRecord;
  evidence: RecommendationLineageEvidence;
  lineage: RecommendationLineageLedger;
  replayLedger: readonly RecommendationLineageLedgerEntry[];
  warnings: readonly string[];
  errors: readonly RecommendationLineageError[];
  deterministicHash: string;
  derivedOnly: true;
}>;
