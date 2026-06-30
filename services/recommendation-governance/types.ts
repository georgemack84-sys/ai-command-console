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

export interface RecommendationGovernanceBindingRequest {
  recommendationId: string;
  tenantId: string;
  governanceScope:
    | "OWNERSHIP"
    | "LINEAGE"
    | "REPLAY"
    | "OBSERVABILITY"
    | "FULL";
  governanceReferences: string[];
  graphVersion: string;
}

export interface RecommendationGovernanceBindingResult {
  recommendationId: string;
  bindingState:
    | "BOUND"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  governanceBound: boolean;
  lineageBound: boolean;
  replayBound: boolean;
  tenantIsolationVerified: boolean;
  governanceHash: string;
  deterministic: boolean;
}

export type RecommendationGovernanceScope = RecommendationGovernanceBindingRequest["governanceScope"];

export type RecommendationGovernanceBindingReasonCode =
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
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "LINEAGE_EVIDENCE_REQUIRED"
  | "LINEAGE_EVIDENCE_UNSEALED"
  | "REPLAY_EVIDENCE_REQUIRED"
  | "REPLAY_EVIDENCE_UNSEALED"
  | "GOVERNANCE_SCOPE_VALID"
  | "GOVERNANCE_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_BINDING_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_BOUND"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "GOVERNANCE_BINDING_DEGRADED"
  | "LINEAGE_BOUND"
  | "LINEAGE_REFERENCES_MISSING"
  | "REPLAY_BOUND"
  | "REPLAY_REFERENCES_MISSING"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "GOVERNANCE_MUTATION_BLOCKED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "BINDING_MUTATION_BLOCKED"
  | "BINDING_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_GENERATION_BLOCKED"
  | "RECOMMENDATION_GENERATION_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "APPROVAL_BEHAVIOR_BLOCKED"
  | "APPROVAL_BEHAVIOR_DETECTED"
  | "REPAIR_BLOCKED"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "BINDING_DEPTH_VALID"
  | "BINDING_DEPTH_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_GOVERNANCE_BINDING_IS_NOT_CONTROL";

export type SealedGovernanceReferenceRecord = Readonly<{
  tenantId: string;
  governanceReferences: readonly string[];
  governanceHash: string;
  sealed: true;
  readOnly: true;
}>;

export type SealedLineageEvidenceRecord = Readonly<{
  tenantId: string;
  lineageReferences: readonly string[];
  lineageHash: string;
  sealed: true;
  readOnly: true;
}>;

export type SealedReplayEvidenceRecord = Readonly<{
  tenantId: string;
  replayReferences: readonly string[];
  replayHash: string;
  sealed: true;
  readOnly: true;
}>;

export type SealedOwnershipEvidenceRecord = Readonly<{
  tenantId: string;
  recommendationId: string;
  ownershipReferences: readonly string[];
  ownershipHash: string;
  sealed: true;
  readOnly: true;
}>;

export type SealedPolicyReferenceRecord = Readonly<{
  tenantId: string;
  policyReferences: readonly string[];
  policyHash: string;
  sealed: true;
  readOnly: true;
}>;

export type RecommendationGovernanceBindingEvidencePath = Readonly<{
  scope: RecommendationGovernanceScope;
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationGovernanceBindingInput = Readonly<{
  request: RecommendationGovernanceBindingRequest;
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
  governanceReferences: SealedGovernanceReferenceRecord;
  lineageEvidence: SealedLineageEvidenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  governanceMutationAttempted?: boolean;
  bindingMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationGenerationRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  approvalBehaviorRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationGovernanceBindingValidation = Readonly<{
  valid: boolean;
  bindingState: RecommendationGovernanceBindingResult["bindingState"];
  reasonCodes: readonly RecommendationGovernanceBindingReasonCode[];
  governanceBound: boolean;
  lineageBound: boolean;
  replayBound: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  governanceReferenceCount: number;
}>;

export type RecommendationGovernanceBindingObservability = Readonly<{
  recommendationId: string;
  bindingState: RecommendationGovernanceBindingResult["bindingState"];
  governanceBound: boolean;
  lineageBound: boolean;
  replayBound: boolean;
  governanceHash: string;
}>;

export type SealedRecommendationGovernanceBindingRecord = Readonly<{
  result: Readonly<RecommendationGovernanceBindingResult>;
  evidencePath: RecommendationGovernanceBindingEvidencePath;
  validation: RecommendationGovernanceBindingValidation;
  observability: RecommendationGovernanceBindingObservability;
  sealed: true;
  readOnly: true;
  governanceOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationGenerationAllowed: false;
  recommendationPrioritizationAllowed: false;
  approvalBehaviorAllowed: false;
  authorityMutationAllowed: false;
  repairAuthorized: false;
  controlSurfacePresent: false;
}>;

export interface RecommendationAuthorityScopeRequest {
  recommendationId: string;
  tenantId: string;
  authorityScope:
    | "OBSERVE_ONLY"
    | "ANALYSIS_ONLY"
    | "AUDIT_ONLY"
    | "GOVERNANCE_ONLY"
    | "FULL_VISIBILITY";
  governanceReferences: string[];
  graphVersion: string;
}

export interface RecommendationAuthorityScopeResult {
  recommendationId: string;
  scopeState:
    | "WITHIN_SCOPE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  scopeValidated: boolean;
  governanceScopeValidated: boolean;
  ownershipValidated: boolean;
  tenantIsolationVerified: boolean;
  authorityHash: string;
  deterministic: boolean;
}

export type RecommendationAuthorityScope = RecommendationAuthorityScopeRequest["authorityScope"];

export type RecommendationAuthorityScopeReasonCode =
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
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
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "OWNERSHIP_EVIDENCE_REQUIRED"
  | "OWNERSHIP_EVIDENCE_UNSEALED"
  | "REPLAY_EVIDENCE_REQUIRED"
  | "REPLAY_EVIDENCE_UNSEALED"
  | "AUTHORITY_SCOPE_VALID"
  | "AUTHORITY_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_SCOPE_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "SCOPE_VALIDATED"
  | "AUTHORITY_SCOPE_MISSING"
  | "GOVERNANCE_SCOPE_VALIDATED"
  | "GOVERNANCE_SCOPE_MISMATCH"
  | "HIDDEN_AUTHORITY_ABSENT"
  | "HIDDEN_AUTHORITY_DETECTED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "SCOPE_MUTATION_BLOCKED"
  | "SCOPE_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_BEHAVIOR_BLOCKED"
  | "APPROVAL_BEHAVIOR_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "SCOPE_DEPTH_VALID"
  | "SCOPE_DEPTH_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "SCOPE_REFERENCE_LIMIT_VALID"
  | "SCOPE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_AUTHORITY_SCOPE_IS_NOT_CONTROL";

export type RecommendationAuthorityScopeEvidencePath = Readonly<{
  scope: RecommendationAuthorityScope;
  governanceReferences: readonly string[];
  scopeReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationAuthorityScopeInput = Readonly<{
  request: RecommendationAuthorityScopeRequest;
  binding: SealedRecommendationGovernanceBindingRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  ownershipEvidence: SealedOwnershipEvidenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  scopeMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalBehaviorRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenAuthorityDetected?: boolean;
}>;

export type RecommendationAuthorityScopeValidation = Readonly<{
  valid: boolean;
  scopeState: RecommendationAuthorityScopeResult["scopeState"];
  reasonCodes: readonly RecommendationAuthorityScopeReasonCode[];
  scopeValidated: boolean;
  governanceScopeValidated: boolean;
  ownershipValidated: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  scopeReferenceCount: number;
}>;

export type RecommendationAuthorityScopeObservability = Readonly<{
  recommendationId: string;
  scopeState: RecommendationAuthorityScopeResult["scopeState"];
  scopeValidated: boolean;
  governanceScopeValidated: boolean;
  ownershipValidated: boolean;
  authorityHash: string;
}>;

export type SealedRecommendationAuthorityScopeRecord = Readonly<{
  result: Readonly<RecommendationAuthorityScopeResult>;
  evidencePath: RecommendationAuthorityScopeEvidencePath;
  validation: RecommendationAuthorityScopeValidation;
  observability: RecommendationAuthorityScopeObservability;
  sealed: true;
  readOnly: true;
  enforcementOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalBehaviorAllowed: false;
  recommendationPrioritizationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface PolicyVisibilityRequest {
  recommendationId: string;
  tenantId: string;
  visibilityScope:
    | "POLICY"
    | "CONSTRAINTS"
    | "AUTHORITY"
    | "LINEAGE"
    | "FULL";
  governanceReferences: string[];
  graphVersion: string;
}

export interface PolicyVisibilityResult {
  recommendationId: string;
  visibilityState:
    | "VISIBLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  policiesVisible: boolean;
  constraintsVisible: boolean;
  authorityVisible: boolean;
  lineageVisible: boolean;
  tenantIsolationVerified: boolean;
  policyHash: string;
  deterministic: boolean;
}

export type PolicyVisibilityScope = PolicyVisibilityRequest["visibilityScope"];

export type PolicyVisibilityReasonCode =
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "AUTHORITY_SCOPE_REQUIRED"
  | "AUTHORITY_SCOPE_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
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
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "POLICY_REFERENCES_REQUIRED"
  | "POLICY_REFERENCES_UNSEALED"
  | "VISIBILITY_SCOPE_VALID"
  | "VISIBILITY_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_VISIBILITY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "POLICIES_VISIBLE"
  | "POLICY_REFERENCES_MISSING"
  | "CONSTRAINTS_VISIBLE"
  | "CONSTRAINTS_DEGRADED"
  | "AUTHORITY_VISIBLE"
  | "AUTHORITY_CONSTRAINT_BROKEN"
  | "LINEAGE_VISIBLE"
  | "LINEAGE_DEGRADED"
  | "HIDDEN_POLICY_STATE_ABSENT"
  | "HIDDEN_POLICY_STATE_DETECTED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "POLICY_MUTATION_BLOCKED"
  | "POLICY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_BEHAVIOR_BLOCKED"
  | "APPROVAL_BEHAVIOR_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "POLICY_EXECUTION_BLOCKED"
  | "POLICY_EXECUTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "POLICY_DEPTH_VALID"
  | "POLICY_DEPTH_EXCEEDED"
  | "POLICY_REFERENCE_LIMIT_VALID"
  | "POLICY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "POLICY_VISIBILITY_IS_NOT_CONTROL";

export type PolicyVisibilityEvidencePath = Readonly<{
  scope: PolicyVisibilityScope;
  governanceReferences: readonly string[];
  policyReferences: readonly string[];
  lineageReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type PolicyVisibilityInput = Readonly<{
  request: PolicyVisibilityRequest;
  binding: SealedRecommendationGovernanceBindingRecord;
  authorityScope: SealedRecommendationAuthorityScopeRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  policyReferences: SealedPolicyReferenceRecord;
  policyMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalBehaviorRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  policyExecutionRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenPolicyStateDetected?: boolean;
}>;

export type PolicyVisibilityValidation = Readonly<{
  valid: boolean;
  visibilityState: PolicyVisibilityResult["visibilityState"];
  reasonCodes: readonly PolicyVisibilityReasonCode[];
  policiesVisible: boolean;
  constraintsVisible: boolean;
  authorityVisible: boolean;
  lineageVisible: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  policyReferenceCount: number;
}>;

export type PolicyVisibilityObservability = Readonly<{
  recommendationId: string;
  visibilityState: PolicyVisibilityResult["visibilityState"];
  policiesVisible: boolean;
  constraintsVisible: boolean;
  authorityVisible: boolean;
  lineageVisible: boolean;
  policyHash: string;
}>;

export type SealedPolicyVisibilityRecord = Readonly<{
  result: Readonly<PolicyVisibilityResult>;
  evidencePath: PolicyVisibilityEvidencePath;
  validation: PolicyVisibilityValidation;
  observability: PolicyVisibilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalBehaviorAllowed: false;
  recommendationPrioritizationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface GovernanceReplayRequest {
  recommendationId: string;
  tenantId: string;
  replayScope:
    | "BINDINGS"
    | "AUTHORITY"
    | "POLICY"
    | "LINEAGE"
    | "FULL";
  governanceReferences: string[];
  replayVersion: string;
  graphVersion: string;
}

export interface GovernanceReplayResult {
  recommendationId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  governanceReconstructed: boolean;
  authorityReconstructed: boolean;
  policyReconstructed: boolean;
  lineageReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type GovernanceReplayScope = GovernanceReplayRequest["replayScope"];

export type GovernanceReplayReasonCode =
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "AUTHORITY_SCOPE_REQUIRED"
  | "AUTHORITY_SCOPE_UNSEALED"
  | "POLICY_VISIBILITY_REQUIRED"
  | "POLICY_VISIBILITY_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "VISIBILITY_REQUIRED"
  | "VISIBILITY_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
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
  | "GOVERNANCE_REFERENCES_REQUIRED"
  | "GOVERNANCE_REFERENCES_UNSEALED"
  | "REPLAY_EVIDENCE_REQUIRED"
  | "REPLAY_EVIDENCE_UNSEALED"
  | "OWNERSHIP_EVIDENCE_REQUIRED"
  | "OWNERSHIP_EVIDENCE_UNSEALED"
  | "REPLAY_SCOPE_VALID"
  | "REPLAY_SCOPE_INVALID"
  | "RECOMMENDATION_ID_PRESENT"
  | "RECOMMENDATION_ID_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_RECONSTRUCTED"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "AUTHORITY_RECONSTRUCTED"
  | "AUTHORITY_REPLAY_MISSING"
  | "POLICY_RECONSTRUCTED"
  | "POLICY_REPLAY_MISSING"
  | "LINEAGE_RECONSTRUCTED"
  | "LINEAGE_REPLAY_MISSING"
  | "REPLAY_PATH_VALID"
  | "REPLAY_ARTIFACTS_MISSING"
  | "RECONSTRUCTION_VALID"
  | "RECONSTRUCTION_BROKEN"
  | "REPLAY_HASH_VERIFIED"
  | "REPLAY_HASH_MISMATCH"
  | "HIDDEN_REPLAY_STATE_ABSENT"
  | "HIDDEN_REPLAY_STATE_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_BEHAVIOR_BLOCKED"
  | "APPROVAL_BEHAVIOR_DETECTED"
  | "POLICY_EXECUTION_BLOCKED"
  | "POLICY_EXECUTION_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_DEPTH_VALID"
  | "REPLAY_DEPTH_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_REPLAY_IS_NOT_CONTROL";

export type GovernanceReplayEvidencePath = Readonly<{
  scope: GovernanceReplayScope;
  governanceReferences: readonly string[];
  replayReferences: readonly string[];
  lineageReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type GovernanceReplayInput = Readonly<{
  request: GovernanceReplayRequest;
  binding: SealedRecommendationGovernanceBindingRecord;
  authorityScope: SealedRecommendationAuthorityScopeRecord;
  policyVisibility: SealedPolicyVisibilityRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  visibility: SealedOperatorVisibilityRecord;
  audit: SealedRecommendationAuditExportRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  ownershipEvidence: SealedOwnershipEvidenceRecord;
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalBehaviorRequested?: boolean;
  policyExecutionRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenReplayStateDetected?: boolean;
}>;

export type GovernanceReplayValidation = Readonly<{
  valid: boolean;
  replayState: GovernanceReplayResult["replayState"];
  reasonCodes: readonly GovernanceReplayReasonCode[];
  governanceReconstructed: boolean;
  authorityReconstructed: boolean;
  policyReconstructed: boolean;
  lineageReconstructed: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  replayReferenceCount: number;
}>;

export type GovernanceReplayObservability = Readonly<{
  recommendationId: string;
  replayState: GovernanceReplayResult["replayState"];
  governanceReconstructed: boolean;
  authorityReconstructed: boolean;
  policyReconstructed: boolean;
  lineageReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedGovernanceReplayRecord = Readonly<{
  result: Readonly<GovernanceReplayResult>;
  evidencePath: GovernanceReplayEvidencePath;
  validation: GovernanceReplayValidation;
  observability: GovernanceReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalBehaviorAllowed: false;
  policyExecutionAllowed: false;
  recommendationPrioritizationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface GovernanceBindingCertificationRequest {
  recommendationId: string;
  tenantId: string;
  certificationScope:
    | "BINDINGS"
    | "AUTHORITY"
    | "POLICY"
    | "REPLAY"
    | "FULL";
  governanceReferences: string[];
  graphVersion: string;
}

export interface GovernanceBindingCertificationResult {
  recommendationId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  bindingsCertified: boolean;
  authorityCertified: boolean;
  policyCertified: boolean;
  replayCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type GovernanceBindingCertificationScope = GovernanceBindingCertificationRequest["certificationScope"];

export type GovernanceBindingCertificationReasonCode =
  | "BINDING_REQUIRED"
  | "BINDING_UNSEALED"
  | "AUTHORITY_SCOPE_REQUIRED"
  | "AUTHORITY_SCOPE_UNSEALED"
  | "POLICY_VISIBILITY_REQUIRED"
  | "POLICY_VISIBILITY_UNSEALED"
  | "GOVERNANCE_REPLAY_REQUIRED"
  | "GOVERNANCE_REPLAY_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "AUDIT_REQUIRED"
  | "AUDIT_UNSEALED"
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
  | "BINDINGS_CERTIFIED"
  | "GOVERNANCE_BINDING_BROKEN"
  | "AUTHORITY_CERTIFIED"
  | "AUTHORITY_CONCERN_DETECTED"
  | "POLICY_CERTIFIED"
  | "POLICY_VISIBILITY_BROKEN"
  | "REPLAY_CERTIFIED"
  | "REPLAY_DEGRADED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "HIDDEN_GOVERNANCE_STATE_ABSENT"
  | "HIDDEN_GOVERNANCE_STATE_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_BEHAVIOR_BLOCKED"
  | "APPROVAL_BEHAVIOR_DETECTED"
  | "POLICY_EXECUTION_BLOCKED"
  | "POLICY_EXECUTION_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_DEPTH_VALID"
  | "CERTIFICATION_DEPTH_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_CERTIFICATION_IS_NOT_CONTROL";

export type GovernanceBindingCertificationEvidencePath = Readonly<{
  scope: GovernanceBindingCertificationScope;
  governanceReferences: readonly string[];
  replayReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type GovernanceBindingCertificationInput = Readonly<{
  request: GovernanceBindingCertificationRequest;
  binding: SealedRecommendationGovernanceBindingRecord;
  authorityScope: SealedRecommendationAuthorityScopeRecord;
  policyVisibility: SealedPolicyVisibilityRecord;
  governanceReplay: SealedGovernanceReplayRecord;
  observability: SealedRecommendationObservabilityRecord;
  inspection: SealedRecommendationInspectionRecord;
  audit: SealedRecommendationAuditExportRecord;
  ledger: SealedRecommendationLedgerRecord;
  lineage: SealedLineageReconstructionRecord;
  verification: SealedRecommendationHistoryVerificationRecord;
  replay: SealedRecommendationReplayRecord;
  integrity: SealedRecommendationIntegrityRecord;
  certification: SealedRecommendationCertificationRecord;
  governanceReferences: SealedGovernanceReferenceRecord;
  ownershipEvidence: SealedOwnershipEvidenceRecord;
  replayEvidence: SealedReplayEvidenceRecord;
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalBehaviorRequested?: boolean;
  policyExecutionRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  authorityExpansionDetected?: boolean;
  hiddenGovernanceStateDetected?: boolean;
}>;

export type GovernanceBindingCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: GovernanceBindingCertificationResult["certificationState"];
  reasonCodes: readonly GovernanceBindingCertificationReasonCode[];
  bindingsCertified: boolean;
  authorityCertified: boolean;
  policyCertified: boolean;
  replayCertified: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  replayReferenceCount: number;
}>;

export type GovernanceBindingCertificationObservability = Readonly<{
  recommendationId: string;
  certificationState: GovernanceBindingCertificationResult["certificationState"];
  bindingsCertified: boolean;
  authorityCertified: boolean;
  policyCertified: boolean;
  replayCertified: boolean;
  certificationHash: string;
}>;

export type SealedGovernanceBindingCertificationRecord = Readonly<{
  result: Readonly<GovernanceBindingCertificationResult>;
  evidencePath: GovernanceBindingCertificationEvidencePath;
  validation: GovernanceBindingCertificationValidation;
  observability: GovernanceBindingCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalBehaviorAllowed: false;
  policyExecutionAllowed: false;
  recommendationPrioritizationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
