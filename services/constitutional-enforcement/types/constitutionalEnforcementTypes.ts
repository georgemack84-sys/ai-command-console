import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type {
  ImmutableRecommendationLedgerInput,
  ImmutableRecommendationLedgerResult,
} from "@/services/immutable-recommendation-ledger/types/immutableRecommendationLedgerTypes";
import type {
  RecommendationReplayInput,
  RecommendationReplayResult,
} from "@/services/recommendation-replay/types/recommendationReplayTypes";

export interface ConstitutionalVerdict {
  verdictId: string;
  recommendationId: string;
  status:
    | "APPROVED"
    | "REJECTED"
    | "AMBIGUOUS"
    | "BLOCKED";
  rejectionReasons: string[];
  semanticFindings: SemanticFinding[];
  ambiguityScore: number;
  evaluatedAt: string;
  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;
}

export interface SemanticFinding {
  findingId: string;
  category:
    | "execution"
    | "scheduling"
    | "orchestration"
    | "capability_escalation"
    | "mutation"
    | "ambiguity";
  severity:
    | "low"
    | "medium"
    | "high"
    | "critical";
  description: string;
  evidenceReferences: string[];
  detectedAt: string;
}

export interface RecommendationLineage {
  lineageId: string;
  recommendationId: string;
  evidenceIds: string[];
  governanceSnapshotId: string;
  replaySnapshotId: string;
  confidenceModelVersion: string;
  prioritizationModelVersion: string;
  generatedAt: string;
}

export interface RecommendationReplay {
  replayId: string;
  recommendationId: string;
  reconstructedReasoning: string[];
  evidenceChain: string[];
  governanceChain: string[];
  confidenceChain: string[];
  reconstructedAt: string;
}

export type ConstitutionalEnforcementStatus =
  | "COMPLETED"
  | "FROZEN"
  | "FAILED_CLOSED";

export type ConstitutionalEnforcementErrorCode =
  | "CONSTITUTIONAL_ENFORCEMENT_INVALID_INPUT"
  | "CONSTITUTIONAL_ENFORCEMENT_REPLAY_INVALID"
  | "CONSTITUTIONAL_ENFORCEMENT_LEDGER_INVALID"
  | "CONSTITUTIONAL_ENFORCEMENT_GOVERNANCE_MISMATCH"
  | "CONSTITUTIONAL_ENFORCEMENT_LINEAGE_GAP"
  | "CONSTITUTIONAL_ENFORCEMENT_EXECUTION_DETECTED"
  | "CONSTITUTIONAL_ENFORCEMENT_SCHEDULING_DETECTED"
  | "CONSTITUTIONAL_ENFORCEMENT_ORCHESTRATION_DETECTED"
  | "CONSTITUTIONAL_ENFORCEMENT_CAPABILITY_ESCALATION"
  | "CONSTITUTIONAL_ENFORCEMENT_MUTATION_DETECTED"
  | "CONSTITUTIONAL_ENFORCEMENT_AMBIGUITY_DETECTED"
  | "CONSTITUTIONAL_ENFORCEMENT_ANTI_EMERGENCE"
  | "CONSTITUTIONAL_ENFORCEMENT_NON_DETERMINISTIC"
  | "CONSTITUTIONAL_ENFORCEMENT_FAIL_CLOSED";

export type ConstitutionalEnforcementError = Readonly<{
  code: ConstitutionalEnforcementErrorCode;
  message: string;
  path: string;
}>;

export type ConstitutionalAuditEventType =
  | "recommendation.validated"
  | "execution.semantic.detected"
  | "orchestration.semantic.detected"
  | "scheduling.semantic.detected"
  | "capability.escalation.detected"
  | "mutation.semantic.detected"
  | "ambiguity.detected"
  | "recommendation.rejected"
  | "recommendation.approved"
  | "fail.closed.triggered";

export type ConstitutionalAuditRecord = Readonly<{
  auditId: string;
  enforcementRunId: string;
  recommendationId: string;
  eventType: ConstitutionalAuditEventType;
  eventHash: string;
  timestamp: string;
  previousEntryHash?: string;
  entryHash: string;
  appendOnly: true;
  replayCompatible: true;
  executionAuthorized: false;
  runtimeMutationOccurred: false;
  scheduledActionCreated: false;
  authorityChanged: false;
  operatorReviewRequired: true;
}>;

export type ConstitutionalEnforcementLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type ConstitutionalEnforcementStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type ConstitutionalEnforcementFreezeRecord = Readonly<{
  frozen: boolean;
  failedClosed: boolean;
  reasons: readonly ConstitutionalEnforcementErrorCode[];
  freezeHash: string;
}>;

export type ConstitutionalEnforcementTelemetry = Readonly<{
  recommendationGenerationLatency: number;
  semanticValidationLatency: number;
  replayReconstructionLatency: number;
  governanceRejectionFrequency: number;
  ambiguityRejectionFrequency: number;
  executionDetectionRate: number;
  orchestrationDetectionRate: number;
  failClosedTriggerRate: number;
  telemetryHash: string;
}>;

export type ConstitutionalEnforcementInput = Readonly<{
  enforcementRunId: string;
  evaluatedAt: string;
  constitutionalVersion: string;
  validatorVersionId: string;
  recommendationId: string;
  replayInput: RecommendationReplayInput;
  replayResult: RecommendationReplayResult;
  immutableLedgerInput: ImmutableRecommendationLedgerInput;
  immutableLedgerResult: ImmutableRecommendationLedgerResult;
  existingAuditLedger?: readonly ConstitutionalEnforcementLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type ConstitutionalEnforcementResult = Readonly<{
  status: ConstitutionalEnforcementStatus;
  verdict: ConstitutionalVerdict;
  lineage: RecommendationLineage;
  replay: RecommendationReplay;
  telemetry: ConstitutionalEnforcementTelemetry;
  auditRecords: readonly ConstitutionalAuditRecord[];
  auditLedger: readonly ConstitutionalEnforcementLedgerEntry[];
  freeze: ConstitutionalEnforcementFreezeRecord;
  stages: readonly ConstitutionalEnforcementStageRecord[];
  errors: readonly ConstitutionalEnforcementError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
