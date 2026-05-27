import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";
import type { RecommendationValidationResult } from "@/services/constitutional-validator/types/recommendationValidationTypes";
import type { ConstitutionalTransitionResult } from "@/services/constitutional-transition-validator/types/constitutionalTransitionTypes";
import type { DecisionAuditEpisodeResult } from "@/services/decision-audit-episode/types/decisionAuditEpisodeTypes";
import type { DecisionReadinessCertificationResult } from "@/services/decision-readiness-certification/types/decisionReadinessCertificationTypes";
import type { DeterministicReplayOutput } from "@/services/deterministic-replay/types/deterministicReplayTypes";
import type { HiddenExecutionDetectionResult } from "@/services/hidden-execution-detection/types/hiddenExecutionDetectionTypes";
import type { OperatorAuthorityResult } from "@/services/operator-authority/types/operatorAuthorityTypes";
import type { ProposalIntegrityResult } from "@/services/proposal-integrity/proposalIntegrityStateTypes";

export interface Recommendation {
  recommendationId: string;
  category:
    | "risk"
    | "recovery"
    | "governance"
    | "validation"
    | "stability"
    | "approval"
    | "escalation"
    | "containment";
  recommendationType: string;
  summary: string;
  rationale: string;
  confidenceScore: number;
  evidenceReferences: string[];
  governanceBindings: string[];
  replaySnapshotId: string;
  constraintProfileId: string;
  escalationAllowed: boolean;
  approvalRequired: boolean;
  createdAt: string;
  executionAuthorized: false;
}

export type RecommendationSynthesisErrorCode =
  | "RECOMMENDATION_SYNTHESIS_INVALID_INPUT"
  | "RECOMMENDATION_SYNTHESIS_GOVERNANCE_AMBIGUITY"
  | "RECOMMENDATION_SYNTHESIS_REPLAY_MISMATCH"
  | "RECOMMENDATION_SYNTHESIS_EVIDENCE_CORRUPTION"
  | "RECOMMENDATION_SYNTHESIS_LINEAGE_INSTABILITY"
  | "RECOMMENDATION_SYNTHESIS_DETERMINISM_INSTABILITY"
  | "RECOMMENDATION_SYNTHESIS_SERIALIZATION_DRIFT"
  | "RECOMMENDATION_SYNTHESIS_AUTHORITY_AMBIGUITY"
  | "RECOMMENDATION_SYNTHESIS_HIDDEN_EXECUTION"
  | "RECOMMENDATION_SYNTHESIS_ORCHESTRATION_DETECTED"
  | "RECOMMENDATION_SYNTHESIS_ANTI_EMERGENCE"
  | "RECOMMENDATION_SYNTHESIS_CANONICALIZATION_MISMATCH"
  | "RECOMMENDATION_SYNTHESIS_HASH_INSTABILITY"
  | "RECOMMENDATION_SYNTHESIS_APPROVAL_INVALID"
  | "RECOMMENDATION_SYNTHESIS_CONTAINMENT_INVALID"
  | "RECOMMENDATION_SYNTHESIS_TRANSITION_INVALID"
  | "RECOMMENDATION_SYNTHESIS_CERTIFICATION_INVALID"
  | "RECOMMENDATION_SYNTHESIS_POLICY_BINDING_INVALID"
  | "RECOMMENDATION_SYNTHESIS_UNKNOWN_STATE"
  | "RECOMMENDATION_SYNTHESIS_FAIL_CLOSED";

export type RecommendationSynthesisError = Readonly<{
  code: RecommendationSynthesisErrorCode;
  message: string;
  path: string;
}>;

export type RecommendationTelemetryDatum = Readonly<{
  telemetryId: string;
  signalType: "stability" | "governance" | "validation" | "integrity" | "approval";
  signalName: string;
  signalValue: string;
  source: string;
}>;

export type RecommendationEvidenceReference = Readonly<{
  referenceId: string;
  sourceType:
    | "telemetry"
    | "governance"
    | "replay"
    | "validation"
    | "proposal"
    | "approval"
    | "audit"
    | "operator";
  sourceId: string;
  order: number;
  referenceHash: string;
}>;

export type RecommendationGovernanceBinding = Readonly<{
  bindingId: string;
  governanceSnapshotId: string;
  governanceHash: string;
  policySnapshotId: string;
  bindingHash: string;
}>;

export type RecommendationReplayMetadata = Readonly<{
  replayId: string;
  replaySnapshotId: string;
  replayHash: string;
  replayCertified: boolean;
  replayDeterministic: boolean;
  replayMetadataHash: string;
}>;

export type RecommendationRationale = Readonly<{
  rationaleId: string;
  summary: string;
  rationale: string;
  reasonCodes: readonly string[];
  rationaleHash: string;
}>;

export type RecommendationConfidenceRecord = Readonly<{
  confidenceId: string;
  confidenceScore: number;
  confidenceFactors: readonly string[];
  confidenceHash: string;
}>;

export type RecommendationSerializationRecord = Readonly<{
  serializationId: string;
  serializationFormat: "json";
  canonicalForm: string;
  serializationHash: string;
}>;

export type RecommendationLineageRecord = Readonly<{
  entryId: string;
  recommendationId: string;
  recommendationHash: string;
  lineageHash: string;
}>;

export type RecommendationFreezeRecord = Readonly<{
  frozen: boolean;
  escalated: boolean;
  reasons: readonly RecommendationSynthesisErrorCode[];
  freezeHash: string;
}>;

export type RecommendationAuditRecord = Readonly<{
  recordId: string;
  recommendationId: string;
  lineageHash: string;
  auditHash: string;
}>;

export type RecommendationDeterminismRecord = Readonly<{
  deterministic: boolean;
  stableOrdering: boolean;
  stableRationale: boolean;
  stableConfidence: boolean;
  stableSerialization: boolean;
  determinismHash: string;
}>;

export type RecommendationIntegrityRecord = Readonly<{
  integrityId: string;
  certificationHash: string;
  replayHash: string;
  proposalHash: string;
  hiddenExecutionBlocked: boolean;
  integrityHash: string;
}>;

export type RecommendationEnvelope = Readonly<{
  recommendation: Recommendation;
  replayMetadata: RecommendationReplayMetadata;
  evidenceReferences: readonly RecommendationEvidenceReference[];
  governanceBindings: readonly RecommendationGovernanceBinding[];
  rationaleRecord: RecommendationRationale;
  confidenceRecord: RecommendationConfidenceRecord;
  serializationRecord: RecommendationSerializationRecord;
  lineageRecord: RecommendationLineageRecord;
  determinismRecord: RecommendationDeterminismRecord;
  integrityRecord: RecommendationIntegrityRecord;
  envelopeHash: string;
  executionAuthorized: false;
}>;

export type RecommendationSynthesisStageRecord = Readonly<{
  stage: string;
  passed: boolean;
  reasons: readonly string[];
  deterministicHash: string;
}>;

export type RecommendationSynthesisLineageEntry = Readonly<{
  entryId: string;
  synthesisId: string;
  recommendationId: string;
  createdAt: string;
  recommendationHash: string;
  deterministicHash: string;
}>;

export type RecommendationSynthesisLineageLedger = Readonly<{
  entries: readonly RecommendationSynthesisLineageEntry[];
  lineageHash: string;
}>;

export type RecommendationAuditLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type RecommendationSynthesisTelemetryRecord = Readonly<{
  telemetryHash: string;
  telemetryCount: number;
  telemetryRefs: readonly string[];
}>;

export type RecommendationSynthesisInput = Readonly<{
  synthesisId: string;
  recommendationSystemId: string;
  createdAt: string;
  constitutionalVersion: string;
  validatorVersionId: string;
  deterministicSeed: string;
  telemetry: readonly RecommendationTelemetryDatum[];
  evidenceBundleRefs: readonly string[];
  policySnapshotIds: readonly string[];
  integrityStateId: string;
  decisionReadinessCertificationResult: DecisionReadinessCertificationResult;
  deterministicReplayResult: DeterministicReplayOutput;
  decisionAuditEpisodeResult: DecisionAuditEpisodeResult;
  hiddenExecutionDetectionResult: HiddenExecutionDetectionResult;
  operatorAuthorityResult: OperatorAuthorityResult;
  constitutionalTransitionResult: ConstitutionalTransitionResult;
  recommendationValidationResult: RecommendationValidationResult;
  proposalIntegrityResult: ProposalIntegrityResult;
  existingLineage?: RecommendationSynthesisLineageLedger;
  existingAuditLedger?: readonly RecommendationAuditLedgerEntry[];
  metadata?: Readonly<Record<string, string | number | boolean | null>>;
}>;

export type RecommendationSynthesisResult = Readonly<{
  recommendations: readonly RecommendationEnvelope[];
  telemetry: RecommendationSynthesisTelemetryRecord;
  freeze: RecommendationFreezeRecord;
  auditRecord: RecommendationAuditRecord;
  lineage: RecommendationSynthesisLineageLedger;
  auditLedger: readonly RecommendationAuditLedgerEntry[];
  stages: readonly RecommendationSynthesisStageRecord[];
  errors: readonly RecommendationSynthesisError[];
  warnings: readonly string[];
  deterministicHash: string;
  derivedOnly: true;
}>;
