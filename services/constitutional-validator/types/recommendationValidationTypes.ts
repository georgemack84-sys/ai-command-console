import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { ConstitutionalCertificationResult } from "@/services/constitutional-certification/certificationStateTypes";
import type { ConstitutionalReadinessResult } from "@/services/constitutional-readiness-scoring/readinessStateTypes";
import type { ConstitutionalReplayStabilityResult } from "@/services/constitutional-replay-stability/replayStateTypes";
import type { DecisionIntentBoundaryResult } from "@/services/decision-intent-boundary/decisionIntentStateTypes";
import type { EscalationDeterminismResult } from "@/services/escalation-determinism/escalationStateTypes";
import type { HumanSupremacyEnforcementResult } from "@/services/human-supremacy-enforcement/supremacyStateTypes";
import type { RecommendationLineageResult } from "@/services/recommendation-lineage/recommendationLineageStateTypes";

export type RecommendationAdmissibility =
  | "ADMISSIBLE"
  | "REJECTED"
  | "BLOCKED"
  | "ESCALATED"
  | "DISPUTED";

export interface ExecutionSemanticDetection {
  detected: boolean;
  semanticType:
    | "EXECUTION_DISPATCH"
    | "ORCHESTRATION_TRIGGER"
    | "SCHEDULER_PAYLOAD"
    | "RETRY_COORDINATION"
    | "RUNTIME_INVOCATION"
    | "AUTHORITY_ESCALATION";
  confidence: number;
  evidence: readonly string[];
  blocked: boolean;
}

export type RecommendationValidationErrorCode =
  | "RECOMMENDATION_VALIDATION_GOVERNANCE_INVALID"
  | "RECOMMENDATION_VALIDATION_SCOPE_CEILING_BREACH"
  | "RECOMMENDATION_VALIDATION_APPROVAL_DEPENDENCY_INVALID"
  | "RECOMMENDATION_VALIDATION_REPLAY_INVALID"
  | "RECOMMENDATION_VALIDATION_CONTAINMENT_INVALID"
  | "RECOMMENDATION_VALIDATION_OVERRIDE_INCOMPATIBLE"
  | "RECOMMENDATION_VALIDATION_EXECUTION_RISK"
  | "RECOMMENDATION_VALIDATION_ORCHESTRATION_SEMANTICS"
  | "RECOMMENDATION_VALIDATION_SCHEDULER_SEMANTICS"
  | "RECOMMENDATION_VALIDATION_AUTHORITY_EXPANSION"
  | "RECOMMENDATION_VALIDATION_RECURSIVE_COORDINATION"
  | "RECOMMENDATION_VALIDATION_RUNTIME_LINKAGE"
  | "RECOMMENDATION_VALIDATION_REPLAY_DRIFT"
  | "RECOMMENDATION_VALIDATION_GOVERNANCE_DRIFT"
  | "RECOMMENDATION_VALIDATION_APPROVAL_DRIFT"
  | "RECOMMENDATION_VALIDATION_MUTATION_DETECTED"
  | "RECOMMENDATION_VALIDATION_ISOLATION_VIOLATION"
  | "RECOMMENDATION_VALIDATION_NON_EXECUTION_GUARANTEE_BROKEN"
  | "RECOMMENDATION_VALIDATION_SYNTHETIC_ANCESTRY"
  | "RECOMMENDATION_VALIDATION_FAIL_CLOSED";

export type RecommendationValidationError = Readonly<{
  code: RecommendationValidationErrorCode;
  message: string;
  path: string;
}>;

export type RecommendationValidationInput = Readonly<{
  recommendationId: string;
  decisionIntentBoundaryResult: DecisionIntentBoundaryResult;
  recommendationLineageResult: RecommendationLineageResult;
  constitutionalCertificationResult: ConstitutionalCertificationResult;
  constitutionalReadinessResult: ConstitutionalReadinessResult;
  constitutionalReplayResult: ConstitutionalReplayStabilityResult;
  humanSupremacyResult: HumanSupremacyEnforcementResult;
  escalationDeterminismResult: EscalationDeterminismResult;
  deterministicSeed: string;
  validatorVersionId: string;
  validatedAt: string;
  existingLineage?: RecommendationValidationLineageLedger;
  existingAuditLedger?: readonly RecommendationValidationLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type RecommendationValidationStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type RecommendationValidationLineageEntry = Readonly<{
  entryId: string;
  recommendationId: string;
  admissibility: RecommendationAdmissibility;
  validatedAt: string;
  deterministicHash: string;
}>;

export type RecommendationValidationLineageLedger = Readonly<{
  entries: readonly RecommendationValidationLineageEntry[];
  lineageHash: string;
}>;

export type RecommendationValidationLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type RecommendationValidationEvidence = Readonly<{
  evidenceId: string;
  recommendationId: string;
  evidenceRefs: readonly string[];
  reasons: readonly string[];
  evidenceHash: string;
}>;

export interface RecommendationAdmissibilityResult {
  recommendationId: string;
  admissibility: RecommendationAdmissibility;
  governanceValidated: boolean;
  replayValidated: boolean;
  containmentValidated: boolean;
  overrideCompatible: boolean;
  executionRiskDetected: boolean;
  escalationRequired: boolean;
  constitutionalViolations: readonly string[];
  governanceSnapshotId: string;
  replaySnapshotId: string;
  validationHash: string;
  replayHash: string;
  auditHash: string;
  deterministicHash: string;
  advisoryOnly: true;
  executable: false;
  executionAuthorized: false;
  operatorReviewRequired: true;
  validatedAt: string;
}

export type RecommendationValidationSnapshot = Readonly<{
  snapshotId: string;
  recommendationId: string;
  governanceSnapshotId: string;
  replaySnapshotId: string;
  validationHash: string;
  snapshotHash: string;
}>;

export type RecommendationValidationForensicExport = Readonly<{
  exportId: string;
  recommendationId: string;
  validationHash: string;
  replayHash: string;
  auditHash: string;
  lineageHash: string;
  exportHash: string;
}>;

export type RecommendationValidationMetrics = Readonly<{
  replayDeterminismScore: number;
  governanceComplianceRate: number;
  containmentViolationRate: number;
  overridePropagationLatency: number;
  executionSemanticDetectionRate: number;
  escalationTriggerFrequency: number;
  admissibilitySuccessRate: number;
  validationDriftFrequency: number;
  metricsHash: string;
}>;

export type RecommendationValidationResult = Readonly<{
  result: RecommendationAdmissibilityResult;
  stages: readonly RecommendationValidationStageRecord[];
  detections: readonly ExecutionSemanticDetection[];
  evidence: RecommendationValidationEvidence;
  snapshot: RecommendationValidationSnapshot;
  lineage: RecommendationValidationLineageLedger;
  auditLedger: readonly RecommendationValidationLedgerEntry[];
  metrics: RecommendationValidationMetrics;
  forensics: RecommendationValidationForensicExport;
  errors: readonly RecommendationValidationError[];
  warnings: readonly string[];
  derivedOnly: true;
}>;
