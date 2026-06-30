import type {
  SealedLineageReconstructionRecord,
  SealedOperatorVisibilityRecord,
  SealedRecommendationAuditExportRecord,
  SealedRecommendationCertificationRecord,
  SealedRecommendationHistoryVerificationRecord,
  SealedRecommendationInspectionRecord,
  SealedRecommendationIntegrityRecord,
  SealedRecommendationLedgerRecord,
  SealedRecommendationObservabilityCertificationRecord,
  SealedRecommendationObservabilityRecord,
  SealedRecommendationReplayRecord,
} from "@/services/recommendation-ledger";
import type {
  SealedGovernanceBindingCertificationRecord,
  SealedGovernanceReferenceRecord,
  SealedGovernanceReplayRecord,
  SealedOwnershipEvidenceRecord,
  SealedPolicyVisibilityRecord,
  SealedRecommendationAuthorityScopeRecord,
  SealedRecommendationGovernanceBindingRecord,
  SealedReplayEvidenceRecord,
} from "@/services/recommendation-governance";

export interface StrategicReadinessRequest {
  recommendationId: string;
  tenantId: string;
  readinessScope:
    | "EVIDENCE"
    | "OBSERVABILITY"
    | "GOVERNANCE"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface StrategicReadinessResult {
  recommendationId: string;
  readinessState:
    | "READY"
    | "LIMITED"
    | "OBSERVE"
    | "NOT_READY";
  evidenceComplete: boolean;
  governanceAligned: boolean;
  replayReady: boolean;
  observabilityComplete: boolean;
  certificationValid: boolean;
  tenantIsolationVerified: boolean;
  readinessHash: string;
  deterministic: boolean;
}

export type StrategicReadinessScope = StrategicReadinessRequest["readinessScope"];

export type StrategicReadinessReasonCode =
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
  | "OBSERVABILITY_CERTIFICATION_REQUIRED"
  | "OBSERVABILITY_CERTIFICATION_UNSEALED"
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "AUTHORITY_SCOPE_REQUIRED"
  | "AUTHORITY_SCOPE_UNSEALED"
  | "POLICY_VISIBILITY_REQUIRED"
  | "POLICY_VISIBILITY_UNSEALED"
  | "GOVERNANCE_REPLAY_REQUIRED"
  | "GOVERNANCE_REPLAY_UNSEALED"
  | "GOVERNANCE_CERTIFICATION_REQUIRED"
  | "GOVERNANCE_CERTIFICATION_UNSEALED"
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "OWNERSHIP_EVIDENCE_REQUIRED"
  | "OWNERSHIP_EVIDENCE_UNSEALED"
  | "REPLAY_EVIDENCE_REQUIRED"
  | "REPLAY_EVIDENCE_UNSEALED"
  | "READINESS_SCOPE_VALID"
  | "READINESS_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_READINESS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "EVIDENCE_COMPLETE"
  | "EVIDENCE_INCOMPLETE"
  | "GOVERNANCE_ALIGNED"
  | "GOVERNANCE_ALIGNMENT_FAILED"
  | "REPLAY_READY"
  | "REPLAY_UNAVAILABLE"
  | "REPLAY_DEGRADED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "OBSERVABILITY_COMPLETE"
  | "OBSERVABILITY_INCOMPLETE"
  | "CERTIFICATION_VALID"
  | "CERTIFICATION_INCOMPLETE"
  | "CERTIFICATION_CORRUPTION_DETECTED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "READINESS_MUTATION_BLOCKED"
  | "READINESS_MUTATION_DETECTED"
  | "HIDDEN_STATE_ABSENT"
  | "HIDDEN_STATE_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "GOVERNANCE_EXECUTION_BLOCKED"
  | "GOVERNANCE_EXECUTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "READINESS_DEPTH_VALID"
  | "READINESS_DEPTH_EXCEEDED"
  | "EVIDENCE_REFERENCE_LIMIT_VALID"
  | "EVIDENCE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "STRATEGIC_READINESS_IS_NOT_APPROVAL";

export type StrategicReadinessEvidencePath = Readonly<{
  scope: StrategicReadinessScope;
  evidenceReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type StrategicReadinessInput = Readonly<{
  request: StrategicReadinessRequest;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  observabilityCertification: SealedRecommendationObservabilityCertificationRecord;
  binding: SealedRecommendationGovernanceBindingRecord;
  authorityScope: SealedRecommendationAuthorityScopeRecord;
  policyVisibility: SealedPolicyVisibilityRecord;
  governanceReplay: SealedGovernanceReplayRecord;
  governanceCertification: SealedGovernanceBindingCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  ownershipEvidence: SealedOwnershipEvidenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  readinessMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  governanceExecutionRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenStateDetected?: boolean;
}>;

export type StrategicReadinessValidation = Readonly<{
  valid: boolean;
  readinessState: StrategicReadinessResult["readinessState"];
  reasonCodes: readonly StrategicReadinessReasonCode[];
  evidenceComplete: boolean;
  governanceAligned: boolean;
  replayReady: boolean;
  observabilityComplete: boolean;
  certificationValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  evidenceReferenceCount: number;
}>;

export type StrategicReadinessObservability = Readonly<{
  recommendationId: string;
  readinessState: StrategicReadinessResult["readinessState"];
  evidenceComplete: boolean;
  governanceAligned: boolean;
  replayReady: boolean;
  observabilityComplete: boolean;
  certificationValid: boolean;
  readinessHash: string;
}>;

export type SealedStrategicReadinessRecord = Readonly<{
  result: Readonly<StrategicReadinessResult>;
  evidencePath: StrategicReadinessEvidencePath;
  validation: StrategicReadinessValidation;
  observability: StrategicReadinessObservability;
  sealed: true;
  readOnly: true;
  readinessOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationApprovalAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  governanceExecutionAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface StrategicContextAlignmentRequest {
  recommendationId: string;
  tenantId: string;
  alignmentScope:
    | "MISSION"
    | "OBJECTIVES"
    | "GOVERNANCE"
    | "RISK"
    | "FULL";
  graphVersion: string;
}

export interface StrategicContextAlignmentResult {
  recommendationId: string;
  alignmentState:
    | "ALIGNED"
    | "PARTIALLY_ALIGNED"
    | "OBSERVE"
    | "MISALIGNED";
  missionAligned: boolean;
  objectiveAligned: boolean;
  governanceAligned: boolean;
  riskAligned: boolean;
  operationallyAligned: boolean;
  tenantIsolationVerified: boolean;
  alignmentHash: string;
  deterministic: boolean;
}

export type StrategicContextAlignmentScope = StrategicContextAlignmentRequest["alignmentScope"];

export type StrategicContextAlignmentReasonCode =
  | "READINESS_REQUIRED"
  | "READINESS_UNSEALED"
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
  | "OBSERVABILITY_CERTIFICATION_REQUIRED"
  | "OBSERVABILITY_CERTIFICATION_UNSEALED"
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "AUTHORITY_SCOPE_REQUIRED"
  | "AUTHORITY_SCOPE_UNSEALED"
  | "POLICY_VISIBILITY_REQUIRED"
  | "POLICY_VISIBILITY_UNSEALED"
  | "GOVERNANCE_REPLAY_REQUIRED"
  | "GOVERNANCE_REPLAY_UNSEALED"
  | "GOVERNANCE_CERTIFICATION_REQUIRED"
  | "GOVERNANCE_CERTIFICATION_UNSEALED"
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "OWNERSHIP_EVIDENCE_REQUIRED"
  | "OWNERSHIP_EVIDENCE_UNSEALED"
  | "REPLAY_EVIDENCE_REQUIRED"
  | "REPLAY_EVIDENCE_UNSEALED"
  | "ALIGNMENT_SCOPE_VALID"
  | "ALIGNMENT_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ALIGNMENT_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "MISSION_ALIGNED"
  | "MISSION_CONFLICT_DETECTED"
  | "MISSION_ALIGNMENT_UNKNOWN"
  | "OBJECTIVES_ALIGNED"
  | "OBJECTIVE_CONFLICT_DETECTED"
  | "OBJECTIVE_ALIGNMENT_UNKNOWN"
  | "GOVERNANCE_ALIGNED"
  | "GOVERNANCE_CONFLICT_DETECTED"
  | "RISK_ALIGNED"
  | "RISK_ALIGNMENT_INCOMPLETE"
  | "OPERATIONAL_ALIGNMENT_VALID"
  | "OPERATIONAL_ALIGNMENT_INCOMPLETE"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "ALIGNMENT_MUTATION_BLOCKED"
  | "ALIGNMENT_MUTATION_DETECTED"
  | "HIDDEN_STATE_ABSENT"
  | "HIDDEN_STATE_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "GOVERNANCE_EXECUTION_BLOCKED"
  | "GOVERNANCE_EXECUTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ALIGNMENT_DEPTH_VALID"
  | "ALIGNMENT_DEPTH_EXCEEDED"
  | "EVIDENCE_REFERENCE_LIMIT_VALID"
  | "EVIDENCE_REFERENCE_LIMIT_EXCEEDED"
  | "ALIGNMENT_REFERENCE_LIMIT_VALID"
  | "ALIGNMENT_REFERENCE_LIMIT_EXCEEDED"
  | "STRATEGIC_ALIGNMENT_IS_NOT_APPROVAL";

export type StrategicContextAlignmentEvidencePath = Readonly<{
  scope: StrategicContextAlignmentScope;
  evidenceReferences: readonly string[];
  alignmentReferences: readonly string[];
  governanceReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type StrategicContextAlignmentInput = Readonly<{
  request: StrategicContextAlignmentRequest;
  readiness: SealedStrategicReadinessRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  observabilityCertification: SealedRecommendationObservabilityCertificationRecord;
  binding: SealedRecommendationGovernanceBindingRecord;
  authorityScope: SealedRecommendationAuthorityScopeRecord;
  policyVisibility: SealedPolicyVisibilityRecord;
  governanceReplay: SealedGovernanceReplayRecord;
  governanceCertification: SealedGovernanceBindingCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  ownershipEvidence: SealedOwnershipEvidenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  alignmentMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  governanceExecutionRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenStateDetected?: boolean;
}>;

export type StrategicContextAlignmentValidation = Readonly<{
  valid: boolean;
  alignmentState: StrategicContextAlignmentResult["alignmentState"];
  reasonCodes: readonly StrategicContextAlignmentReasonCode[];
  missionAligned: boolean;
  objectiveAligned: boolean;
  governanceAligned: boolean;
  riskAligned: boolean;
  operationallyAligned: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  alignmentReferenceCount: number;
}>;

export type StrategicContextAlignmentObservability = Readonly<{
  recommendationId: string;
  alignmentState: StrategicContextAlignmentResult["alignmentState"];
  missionAligned: boolean;
  objectiveAligned: boolean;
  governanceAligned: boolean;
  riskAligned: boolean;
  operationallyAligned: boolean;
  alignmentHash: string;
}>;

export type SealedStrategicContextAlignmentRecord = Readonly<{
  result: Readonly<StrategicContextAlignmentResult>;
  evidencePath: StrategicContextAlignmentEvidencePath;
  validation: StrategicContextAlignmentValidation;
  observability: StrategicContextAlignmentObservability;
  sealed: true;
  readOnly: true;
  alignmentOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationApprovalAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  governanceExecutionAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface OperatorReviewPacketRequest {
  recommendationId: string;
  tenantId: string;
  packetScope:
    | "SUMMARY"
    | "READINESS"
    | "ALIGNMENT"
    | "GOVERNANCE"
    | "FULL";
  graphVersion: string;
}

export interface OperatorReviewPacketResult {
  recommendationId: string;
  packetState:
    | "READY_FOR_REVIEW"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  readinessIncluded: boolean;
  alignmentIncluded: boolean;
  governanceIncluded: boolean;
  replayIncluded: boolean;
  certificationIncluded: boolean;
  tenantIsolationVerified: boolean;
  packetHash: string;
  deterministic: boolean;
}

export type OperatorReviewPacketScope = OperatorReviewPacketRequest["packetScope"];

export type OperatorReviewPacketReasonCode =
  | "READINESS_REQUIRED"
  | "READINESS_UNSEALED"
  | "ALIGNMENT_REQUIRED"
  | "ALIGNMENT_UNSEALED"
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
  | "OBSERVABILITY_CERTIFICATION_REQUIRED"
  | "OBSERVABILITY_CERTIFICATION_UNSEALED"
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "AUTHORITY_SCOPE_REQUIRED"
  | "AUTHORITY_SCOPE_UNSEALED"
  | "POLICY_VISIBILITY_REQUIRED"
  | "POLICY_VISIBILITY_UNSEALED"
  | "GOVERNANCE_REPLAY_REQUIRED"
  | "GOVERNANCE_REPLAY_UNSEALED"
  | "GOVERNANCE_CERTIFICATION_REQUIRED"
  | "GOVERNANCE_CERTIFICATION_UNSEALED"
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "OWNERSHIP_EVIDENCE_REQUIRED"
  | "OWNERSHIP_EVIDENCE_UNSEALED"
  | "REPLAY_EVIDENCE_REQUIRED"
  | "REPLAY_EVIDENCE_UNSEALED"
  | "PACKET_SCOPE_VALID"
  | "PACKET_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_PACKET_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "READINESS_INCLUDED"
  | "READINESS_MISSING"
  | "ALIGNMENT_INCLUDED"
  | "ALIGNMENT_MISSING"
  | "GOVERNANCE_INCLUDED"
  | "GOVERNANCE_CONTEXT_MISSING"
  | "REPLAY_INCLUDED"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_INCLUDED"
  | "CERTIFICATION_EVIDENCE_MISSING"
  | "GOVERNANCE_CONTEXT_PRESERVED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "PACKET_MUTATION_BLOCKED"
  | "PACKET_MUTATION_DETECTED"
  | "HIDDEN_STATE_ABSENT"
  | "HIDDEN_STATE_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "GOVERNANCE_EXECUTION_BLOCKED"
  | "GOVERNANCE_EXECUTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "PACKET_DEPTH_VALID"
  | "PACKET_DEPTH_EXCEEDED"
  | "EVIDENCE_REFERENCE_LIMIT_VALID"
  | "EVIDENCE_REFERENCE_LIMIT_EXCEEDED"
  | "PACKET_REFERENCE_LIMIT_VALID"
  | "PACKET_REFERENCE_LIMIT_EXCEEDED"
  | "OPERATOR_REVIEW_PACKET_IS_NOT_APPROVAL";

export type OperatorReviewPacketEvidencePath = Readonly<{
  scope: OperatorReviewPacketScope;
  evidenceReferences: readonly string[];
  replayReferences: readonly string[];
  lineageReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type OperatorReviewPacketInput = Readonly<{
  request: OperatorReviewPacketRequest;
  readiness: SealedStrategicReadinessRecord;
  alignment: SealedStrategicContextAlignmentRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  observabilityCertification: SealedRecommendationObservabilityCertificationRecord;
  binding: SealedRecommendationGovernanceBindingRecord;
  authorityScope: SealedRecommendationAuthorityScopeRecord;
  policyVisibility: SealedPolicyVisibilityRecord;
  governanceReplay: SealedGovernanceReplayRecord;
  governanceCertification: SealedGovernanceBindingCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  ownershipEvidence: SealedOwnershipEvidenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  packetMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  governanceExecutionRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenStateDetected?: boolean;
}>;

export type OperatorReviewPacketValidation = Readonly<{
  valid: boolean;
  packetState: OperatorReviewPacketResult["packetState"];
  reasonCodes: readonly OperatorReviewPacketReasonCode[];
  readinessIncluded: boolean;
  alignmentIncluded: boolean;
  governanceIncluded: boolean;
  replayIncluded: boolean;
  certificationIncluded: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  packetReferenceCount: number;
}>;

export type OperatorReviewPacketObservability = Readonly<{
  recommendationId: string;
  packetState: OperatorReviewPacketResult["packetState"];
  readinessIncluded: boolean;
  alignmentIncluded: boolean;
  governanceIncluded: boolean;
  replayIncluded: boolean;
  certificationIncluded: boolean;
  packetHash: string;
}>;

export type SealedOperatorReviewPacketRecord = Readonly<{
  result: Readonly<OperatorReviewPacketResult>;
  evidencePath: OperatorReviewPacketEvidencePath;
  validation: OperatorReviewPacketValidation;
  observability: OperatorReviewPacketObservability;
  sealed: true;
  readOnly: true;
  reviewOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationApprovalAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  governanceExecutionAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface StrategicReadinessReplayRequest {
  recommendationId: string;
  tenantId: string;
  replayScope:
    | "READINESS"
    | "ALIGNMENT"
    | "REVIEW_PACKET"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface StrategicReadinessReplayResult {
  recommendationId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  readinessReconstructed: boolean;
  alignmentReconstructed: boolean;
  reviewPacketReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type StrategicReadinessReplayScope = StrategicReadinessReplayRequest["replayScope"];

export type StrategicReadinessReplayReasonCode =
  | "READINESS_REQUIRED"
  | "READINESS_UNSEALED"
  | "ALIGNMENT_REQUIRED"
  | "ALIGNMENT_UNSEALED"
  | "REVIEW_PACKET_REQUIRED"
  | "REVIEW_PACKET_UNSEALED"
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
  | "OBSERVABILITY_CERTIFICATION_REQUIRED"
  | "OBSERVABILITY_CERTIFICATION_UNSEALED"
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "AUTHORITY_SCOPE_REQUIRED"
  | "AUTHORITY_SCOPE_UNSEALED"
  | "POLICY_VISIBILITY_REQUIRED"
  | "POLICY_VISIBILITY_UNSEALED"
  | "GOVERNANCE_REPLAY_REQUIRED"
  | "GOVERNANCE_REPLAY_UNSEALED"
  | "GOVERNANCE_CERTIFICATION_REQUIRED"
  | "GOVERNANCE_CERTIFICATION_UNSEALED"
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "OWNERSHIP_EVIDENCE_REQUIRED"
  | "OWNERSHIP_EVIDENCE_UNSEALED"
  | "REPLAY_EVIDENCE_REQUIRED"
  | "REPLAY_EVIDENCE_UNSEALED"
  | "REPLAY_SCOPE_VALID"
  | "REPLAY_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "READINESS_RECONSTRUCTED"
  | "READINESS_RECONSTRUCTION_MISSING"
  | "ALIGNMENT_RECONSTRUCTED"
  | "ALIGNMENT_RECONSTRUCTION_MISSING"
  | "REVIEW_PACKET_RECONSTRUCTED"
  | "REVIEW_PACKET_RECONSTRUCTION_MISSING"
  | "GOVERNANCE_RECONSTRUCTED"
  | "GOVERNANCE_RECONSTRUCTION_DEGRADED"
  | "REPLAY_ARTIFACTS_MISSING"
  | "RECONSTRUCTION_BROKEN"
  | "REPLAY_HASH_VERIFIED"
  | "REPLAY_HASH_MISMATCH"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "HIDDEN_REPLAY_STATE_ABSENT"
  | "HIDDEN_REPLAY_STATE_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "GOVERNANCE_EXECUTION_BLOCKED"
  | "GOVERNANCE_EXECUTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_DEPTH_VALID"
  | "REPLAY_DEPTH_EXCEEDED"
  | "EVIDENCE_REFERENCE_LIMIT_VALID"
  | "EVIDENCE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "STRATEGIC_READINESS_REPLAY_IS_NOT_CONTROL";

export type StrategicReadinessReplayEvidencePath = Readonly<{
  scope: StrategicReadinessReplayScope;
  evidenceReferences: readonly string[];
  replayReferences: readonly string[];
  lineageReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type StrategicReadinessReplayInput = Readonly<{
  request: StrategicReadinessReplayRequest;
  readiness: SealedStrategicReadinessRecord;
  alignment: SealedStrategicContextAlignmentRecord;
  reviewPacket: SealedOperatorReviewPacketRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  observabilityCertification: SealedRecommendationObservabilityCertificationRecord;
  binding: SealedRecommendationGovernanceBindingRecord;
  authorityScope: SealedRecommendationAuthorityScopeRecord;
  policyVisibility: SealedPolicyVisibilityRecord;
  governanceReplay: SealedGovernanceReplayRecord;
  governanceCertification: SealedGovernanceBindingCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  ownershipEvidence: SealedOwnershipEvidenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  governanceExecutionRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenReplayStateDetected?: boolean;
}>;

export type StrategicReadinessReplayValidation = Readonly<{
  valid: boolean;
  replayState: StrategicReadinessReplayResult["replayState"];
  reasonCodes: readonly StrategicReadinessReplayReasonCode[];
  readinessReconstructed: boolean;
  alignmentReconstructed: boolean;
  reviewPacketReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  replayReferenceCount: number;
}>;

export type StrategicReadinessReplayObservability = Readonly<{
  recommendationId: string;
  replayState: StrategicReadinessReplayResult["replayState"];
  readinessReconstructed: boolean;
  alignmentReconstructed: boolean;
  reviewPacketReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedStrategicReadinessReplayRecord = Readonly<{
  result: Readonly<StrategicReadinessReplayResult>;
  evidencePath: StrategicReadinessReplayEvidencePath;
  validation: StrategicReadinessReplayValidation;
  observability: StrategicReadinessReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationApprovalAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  governanceExecutionAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface StrategicReadinessCertificationRequest {
  recommendationId: string;
  tenantId: string;
  certificationScope:
    | "READINESS"
    | "ALIGNMENT"
    | "REVIEW_PACKET"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface StrategicReadinessCertificationResult {
  recommendationId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  readinessCertified: boolean;
  alignmentCertified: boolean;
  reviewPacketCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type StrategicReadinessCertificationScope = StrategicReadinessCertificationRequest["certificationScope"];

export type StrategicReadinessCertificationReasonCode =
  | "READINESS_REQUIRED"
  | "READINESS_UNSEALED"
  | "ALIGNMENT_REQUIRED"
  | "ALIGNMENT_UNSEALED"
  | "REVIEW_PACKET_REQUIRED"
  | "REVIEW_PACKET_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "LEDGER_REQUIRED"
  | "LEDGER_UNSEALED"
  | "LINEAGE_REQUIRED"
  | "LINEAGE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "RECOMMENDATION_REPLAY_REQUIRED"
  | "RECOMMENDATION_REPLAY_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
  | "OBSERVABILITY_CERTIFICATION_REQUIRED"
  | "OBSERVABILITY_CERTIFICATION_UNSEALED"
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "AUTHORITY_SCOPE_REQUIRED"
  | "AUTHORITY_SCOPE_UNSEALED"
  | "POLICY_VISIBILITY_REQUIRED"
  | "POLICY_VISIBILITY_UNSEALED"
  | "GOVERNANCE_REPLAY_REQUIRED"
  | "GOVERNANCE_REPLAY_UNSEALED"
  | "GOVERNANCE_CERTIFICATION_REQUIRED"
  | "GOVERNANCE_CERTIFICATION_UNSEALED"
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "OWNERSHIP_EVIDENCE_REQUIRED"
  | "OWNERSHIP_EVIDENCE_UNSEALED"
  | "REPLAY_EVIDENCE_REQUIRED"
  | "REPLAY_EVIDENCE_UNSEALED"
  | "CERTIFICATION_SCOPE_VALID"
  | "CERTIFICATION_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_CERTIFICATION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "READINESS_CERTIFIED"
  | "READINESS_INTEGRITY_BROKEN"
  | "ALIGNMENT_CERTIFIED"
  | "ALIGNMENT_INTEGRITY_BROKEN"
  | "REVIEW_PACKET_CERTIFIED"
  | "REVIEW_PACKET_INTEGRITY_BROKEN"
  | "REPLAY_CERTIFIED"
  | "REPLAY_DEGRADED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "GOVERNANCE_CERTIFIED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "OBSERVABILITY_CERTIFIED"
  | "OBSERVABILITY_INCOMPLETE"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "HIDDEN_CERTIFICATION_STATE_ABSENT"
  | "HIDDEN_CERTIFICATION_STATE_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "GOVERNANCE_EXECUTION_BLOCKED"
  | "GOVERNANCE_EXECUTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_DEPTH_VALID"
  | "CERTIFICATION_DEPTH_EXCEEDED"
  | "EVIDENCE_REFERENCE_LIMIT_VALID"
  | "EVIDENCE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "STRATEGIC_READINESS_CERTIFICATION_IS_NOT_CONTROL";

export type StrategicReadinessCertificationEvidencePath = Readonly<{
  scope: StrategicReadinessCertificationScope;
  evidenceReferences: readonly string[];
  replayReferences: readonly string[];
  lineageReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type StrategicReadinessCertificationInput = Readonly<{
  request: StrategicReadinessCertificationRequest;
  readiness: SealedStrategicReadinessRecord;
  alignment: SealedStrategicContextAlignmentRecord;
  reviewPacket: SealedOperatorReviewPacketRecord;
  replayFramework: SealedStrategicReadinessReplayRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  observabilityCertification: SealedRecommendationObservabilityCertificationRecord;
  binding: SealedRecommendationGovernanceBindingRecord;
  authorityScope: SealedRecommendationAuthorityScopeRecord;
  policyVisibility: SealedPolicyVisibilityRecord;
  governanceReplay: SealedGovernanceReplayRecord;
  governanceCertification: SealedGovernanceBindingCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  ownershipEvidence: SealedOwnershipEvidenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  governanceExecutionRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenCertificationStateDetected?: boolean;
}>;

export type StrategicReadinessCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: StrategicReadinessCertificationResult["certificationState"];
  reasonCodes: readonly StrategicReadinessCertificationReasonCode[];
  readinessCertified: boolean;
  alignmentCertified: boolean;
  reviewPacketCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  replayReferenceCount: number;
}>;

export type StrategicReadinessCertificationObservability = Readonly<{
  recommendationId: string;
  certificationState: StrategicReadinessCertificationResult["certificationState"];
  readinessCertified: boolean;
  alignmentCertified: boolean;
  reviewPacketCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  certificationHash: string;
}>;

export type SealedStrategicReadinessCertificationRecord = Readonly<{
  result: Readonly<StrategicReadinessCertificationResult>;
  evidencePath: StrategicReadinessCertificationEvidencePath;
  validation: StrategicReadinessCertificationValidation;
  observability: StrategicReadinessCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationApprovalAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  governanceExecutionAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
