import type {
  SealedDecisionGraphCertificationRecord,
  SealedGraphInspectionRecord,
  SealedGraphIntegrityVerificationRecord,
  SealedReplayableGraphTopologyRecord,
} from "@/services/decision-graph";

export interface EscalationIntelligenceRequest {
  graphId: string;
  tenantId: string;
  escalationContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "TOPOLOGY"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface EscalationIntelligenceResult {
  graphId: string;
  escalationClassification:
    | "NO_ESCALATION"
    | "REVIEW_REQUIRED"
    | "ESCALATION_CANDIDATE"
    | "HIGH_ATTENTION";
  ownershipConcern: boolean;
  lineageConcern: boolean;
  authorityConcern: boolean;
  topologyConcern: boolean;
  tenantIsolationVerified: boolean;
  escalationEvidenceHash: string;
  deterministic: boolean;
}

export type EscalationIntelligenceContext = EscalationIntelligenceRequest["escalationContext"];

export type EscalationIntelligenceReasonCode =
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "TOPOLOGY_REQUIRED"
  | "TOPOLOGY_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "ESCALATION_CONTEXT_VALID"
  | "ESCALATION_CONTEXT_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "TOPOLOGY_INTEGRITY_VALID"
  | "TOPOLOGY_DEGRADATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "EVIDENCE_CHAIN_VALID"
  | "EVIDENCE_CHAIN_BROKEN"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "MUTATION_SIGNALS_BLOCKED"
  | "MUTATION_SIGNALS_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "NOTIFICATION_DISPATCH_BLOCKED"
  | "NOTIFICATION_DISPATCH_DETECTED"
  | "GOVERNANCE_MUTATION_BLOCKED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "CONTAINMENT_ACTION_BLOCKED"
  | "CONTAINMENT_ACTION_DETECTED"
  | "ANALYSIS_DEPTH_VALID"
  | "ANALYSIS_DEPTH_EXCEEDED"
  | "ANALYZED_ARTIFACT_LIMIT_VALID"
  | "ANALYZED_ARTIFACT_LIMIT_EXCEEDED"
  | "ESCALATION_INTELLIGENCE_IS_NOT_EXECUTION";

export type EscalationIntelligenceEvidencePath = Readonly<{
  context: EscalationIntelligenceContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
  topologyNodeHashes: readonly string[];
  topologyEdgeHashes: readonly string[];
}>;

export type EscalationIntelligenceInput = Readonly<{
  request: EscalationIntelligenceRequest;
  certification: SealedDecisionGraphCertificationRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  inspection: SealedGraphInspectionRecord;
  topology: SealedReplayableGraphTopologyRecord;
  mutationSignalsDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalCreationRequested?: boolean;
  notificationDispatchRequested?: boolean;
  governanceMutationRequested?: boolean;
  containmentActionRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type EscalationIntelligenceValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly EscalationIntelligenceReasonCode[];
  escalationClassification: EscalationIntelligenceResult["escalationClassification"];
  ownershipConcern: boolean;
  lineageConcern: boolean;
  authorityConcern: boolean;
  topologyConcern: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  analyzedArtifactCount: number;
}>;

export type EscalationIntelligenceObservability = Readonly<{
  graphId: string;
  escalationClassification: EscalationIntelligenceResult["escalationClassification"];
  ownershipConcern: boolean;
  lineageConcern: boolean;
  authorityConcern: boolean;
  escalationEvidenceHash: string;
}>;

export type SealedEscalationIntelligenceRecord = Readonly<{
  result: Readonly<EscalationIntelligenceResult>;
  evidencePath: EscalationIntelligenceEvidencePath;
  validation: EscalationIntelligenceValidation;
  observability: EscalationIntelligenceObservability;
  sealed: true;
  readOnly: true;
  intelligenceOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalCreationAllowed: false;
  notificationDispatchAllowed: false;
  governanceMutationAllowed: false;
  containmentActionAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface OversightRequirementRequest {
  graphId: string;
  tenantId: string;
  oversightContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "TOPOLOGY"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface OversightRequirementResult {
  graphId: string;
  oversightRequirement:
    | "NONE"
    | "OBSERVE"
    | "REVIEW"
    | "GOVERNANCE_REVIEW"
    | "CONTAINMENT_REVIEW";
  ownershipConcern: boolean;
  lineageConcern: boolean;
  authorityConcern: boolean;
  topologyConcern: boolean;
  tenantIsolationVerified: boolean;
  oversightEvidenceHash: string;
  deterministic: boolean;
}

export type OversightRequirementContext = OversightRequirementRequest["oversightContext"];

export type OversightRequirementReasonCode =
  | "INTELLIGENCE_REQUIRED"
  | "INTELLIGENCE_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "OVERSIGHT_CONTEXT_VALID"
  | "OVERSIGHT_CONTEXT_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "ESCALATION_EVIDENCE_VALID"
  | "ESCALATION_EVIDENCE_BROKEN"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "TOPOLOGY_INTEGRITY_VALID"
  | "TOPOLOGY_CORRUPTION_DETECTED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "MUTATION_SIGNALS_BLOCKED"
  | "MUTATION_SIGNALS_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "NOTIFICATION_DISPATCH_BLOCKED"
  | "NOTIFICATION_DISPATCH_DETECTED"
  | "CONTAINMENT_ACTION_BLOCKED"
  | "CONTAINMENT_ACTION_DETECTED"
  | "ANALYSIS_DEPTH_VALID"
  | "ANALYSIS_DEPTH_EXCEEDED"
  | "OVERSIGHT_ARTIFACT_LIMIT_VALID"
  | "OVERSIGHT_ARTIFACT_LIMIT_EXCEEDED"
  | "OVERSIGHT_ANALYSIS_IS_NOT_EXECUTION";

export type OversightRequirementEvidencePath = Readonly<{
  context: OversightRequirementContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type OversightRequirementInput = Readonly<{
  request: OversightRequirementRequest;
  intelligence: SealedEscalationIntelligenceRecord;
  certification: SealedDecisionGraphCertificationRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  mutationSignalsDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalCreationRequested?: boolean;
  notificationDispatchRequested?: boolean;
  containmentActionRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type OversightRequirementValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly OversightRequirementReasonCode[];
  oversightRequirement: OversightRequirementResult["oversightRequirement"];
  ownershipConcern: boolean;
  lineageConcern: boolean;
  authorityConcern: boolean;
  topologyConcern: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  analyzedArtifactCount: number;
}>;

export type OversightRequirementObservability = Readonly<{
  graphId: string;
  oversightRequirement: OversightRequirementResult["oversightRequirement"];
  ownershipConcern: boolean;
  lineageConcern: boolean;
  authorityConcern: boolean;
  topologyConcern: boolean;
  oversightEvidenceHash: string;
}>;

export type SealedOversightRequirementRecord = Readonly<{
  result: Readonly<OversightRequirementResult>;
  evidencePath: OversightRequirementEvidencePath;
  validation: OversightRequirementValidation;
  observability: OversightRequirementObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalCreationAllowed: false;
  notificationDispatchAllowed: false;
  containmentActionAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface UncertaintyTriggeredCautionRequest {
  graphId: string;
  tenantId: string;
  uncertaintyContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "TOPOLOGY"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface UncertaintyTriggeredCautionResult {
  graphId: string;
  cautionState:
    | "NORMAL"
    | "CAUTION"
    | "LIMITED"
    | "HIGH_CAUTION";
  uncertaintyDetected: boolean;
  evidenceQualityConcern: boolean;
  ambiguityDetected: boolean;
  authorityConcern: boolean;
  tenantIsolationVerified: boolean;
  cautionEvidenceHash: string;
  deterministic: boolean;
}

export type UncertaintyTriggeredCautionContext = UncertaintyTriggeredCautionRequest["uncertaintyContext"];

export type UncertaintyTriggeredCautionReasonCode =
  | "INTELLIGENCE_REQUIRED"
  | "INTELLIGENCE_UNSEALED"
  | "OVERSIGHT_REQUIRED"
  | "OVERSIGHT_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "UNCERTAINTY_CONTEXT_VALID"
  | "UNCERTAINTY_CONTEXT_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "EVIDENCE_COMPLETENESS_VALID"
  | "EVIDENCE_CHAIN_BROKEN"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "UNCERTAINTY_SIGNAL_ABSENT"
  | "UNCERTAINTY_SIGNAL_DETECTED"
  | "EVIDENCE_QUALITY_HEALTHY"
  | "EVIDENCE_QUALITY_DEGRADED"
  | "AMBIGUITY_ABSENT"
  | "AMBIGUITY_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "MUTATION_SIGNALS_BLOCKED"
  | "MUTATION_SIGNALS_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "NOTIFICATION_DISPATCH_BLOCKED"
  | "NOTIFICATION_DISPATCH_DETECTED"
  | "CONTAINMENT_ACTION_BLOCKED"
  | "CONTAINMENT_ACTION_DETECTED"
  | "ANALYSIS_DEPTH_VALID"
  | "ANALYSIS_DEPTH_EXCEEDED"
  | "UNCERTAINTY_ARTIFACT_LIMIT_VALID"
  | "UNCERTAINTY_ARTIFACT_LIMIT_EXCEEDED"
  | "UNCERTAINTY_LAYER_IS_NOT_EXECUTION";

export type UncertaintyTriggeredCautionEvidencePath = Readonly<{
  context: UncertaintyTriggeredCautionContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type UncertaintyTriggeredCautionInput = Readonly<{
  request: UncertaintyTriggeredCautionRequest;
  intelligence: SealedEscalationIntelligenceRecord;
  oversight: SealedOversightRequirementRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certification: SealedDecisionGraphCertificationRecord;
  mutationSignalsDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalCreationRequested?: boolean;
  notificationDispatchRequested?: boolean;
  containmentActionRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type UncertaintyTriggeredCautionValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly UncertaintyTriggeredCautionReasonCode[];
  cautionState: UncertaintyTriggeredCautionResult["cautionState"];
  uncertaintyDetected: boolean;
  evidenceQualityConcern: boolean;
  ambiguityDetected: boolean;
  authorityConcern: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  analyzedArtifactCount: number;
}>;

export type UncertaintyTriggeredCautionObservability = Readonly<{
  graphId: string;
  cautionState: UncertaintyTriggeredCautionResult["cautionState"];
  uncertaintyDetected: boolean;
  evidenceQualityConcern: boolean;
  ambiguityDetected: boolean;
  cautionEvidenceHash: string;
}>;

export type SealedUncertaintyTriggeredCautionRecord = Readonly<{
  result: Readonly<UncertaintyTriggeredCautionResult>;
  evidencePath: UncertaintyTriggeredCautionEvidencePath;
  validation: UncertaintyTriggeredCautionValidation;
  observability: UncertaintyTriggeredCautionObservability;
  sealed: true;
  readOnly: true;
  cautionOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalCreationAllowed: false;
  notificationDispatchAllowed: false;
  containmentActionAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface GovernanceEscalationRequest {
  graphId: string;
  tenantId: string;
  governanceContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "TOPOLOGY"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface GovernanceEscalationResult {
  graphId: string;
  governanceEscalationState:
    | "NORMAL"
    | "GOVERNANCE_AWARE"
    | "GOVERNANCE_REVIEW"
    | "HIGH_GOVERNANCE_ATTENTION";
  governanceConcern: boolean;
  authorityBoundaryConcern: boolean;
  policyDependencyConcern: boolean;
  tenantIsolationVerified: boolean;
  governanceEvidenceHash: string;
  deterministic: boolean;
}

export type GovernanceEscalationContext = GovernanceEscalationRequest["governanceContext"];

export type GovernanceEscalationReasonCode =
  | "INTELLIGENCE_REQUIRED"
  | "INTELLIGENCE_UNSEALED"
  | "OVERSIGHT_REQUIRED"
  | "OVERSIGHT_UNSEALED"
  | "CAUTION_REQUIRED"
  | "CAUTION_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_CONTEXT_VALID"
  | "GOVERNANCE_CONTEXT_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "GOVERNANCE_EVIDENCE_VALID"
  | "GOVERNANCE_EVIDENCE_BROKEN"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "POLICY_DEPENDENCY_HEALTHY"
  | "POLICY_BOUNDARY_VIOLATION"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "MUTATION_SIGNALS_BLOCKED"
  | "MUTATION_SIGNALS_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "NOTIFICATION_DISPATCH_BLOCKED"
  | "NOTIFICATION_DISPATCH_DETECTED"
  | "REVIEW_ASSIGNMENT_BLOCKED"
  | "REVIEW_ASSIGNMENT_DETECTED"
  | "GOVERNANCE_MUTATION_BLOCKED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "ANALYSIS_DEPTH_VALID"
  | "ANALYSIS_DEPTH_EXCEEDED"
  | "GOVERNANCE_ARTIFACT_LIMIT_VALID"
  | "GOVERNANCE_ARTIFACT_LIMIT_EXCEEDED"
  | "GOVERNANCE_ANALYSIS_IS_NOT_EXECUTION";

export type GovernanceEscalationEvidencePath = Readonly<{
  context: GovernanceEscalationContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type GovernanceEscalationInput = Readonly<{
  request: GovernanceEscalationRequest;
  intelligence: SealedEscalationIntelligenceRecord;
  oversight: SealedOversightRequirementRecord;
  caution: SealedUncertaintyTriggeredCautionRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certification: SealedDecisionGraphCertificationRecord;
  mutationSignalsDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalCreationRequested?: boolean;
  notificationDispatchRequested?: boolean;
  reviewAssignmentRequested?: boolean;
  governanceMutationRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type GovernanceEscalationValidation = Readonly<{
  valid: boolean;
  reasonCodes: readonly GovernanceEscalationReasonCode[];
  governanceEscalationState: GovernanceEscalationResult["governanceEscalationState"];
  governanceConcern: boolean;
  authorityBoundaryConcern: boolean;
  policyDependencyConcern: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  analyzedArtifactCount: number;
}>;

export type GovernanceEscalationObservability = Readonly<{
  graphId: string;
  governanceEscalationState: GovernanceEscalationResult["governanceEscalationState"];
  governanceConcern: boolean;
  authorityBoundaryConcern: boolean;
  governanceEvidenceHash: string;
}>;

export type SealedGovernanceEscalationRecord = Readonly<{
  result: Readonly<GovernanceEscalationResult>;
  evidencePath: GovernanceEscalationEvidencePath;
  validation: GovernanceEscalationValidation;
  observability: GovernanceEscalationObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalCreationAllowed: false;
  notificationDispatchAllowed: false;
  reviewAssignmentAllowed: false;
  governanceMutationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface EscalationReplayRequest {
  graphId: string;
  tenantId: string;
  replayContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "TOPOLOGY"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface EscalationReplayResult {
  graphId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  replayDeterministic: boolean;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  evidenceChainValid: boolean;
  replayHash: string;
  reconstructionHash: string;
}

export type EscalationReplayContext = EscalationReplayRequest["replayContext"];

export type EscalationReplayReasonCode =
  | "INTELLIGENCE_REQUIRED"
  | "INTELLIGENCE_UNSEALED"
  | "OVERSIGHT_REQUIRED"
  | "OVERSIGHT_UNSEALED"
  | "CAUTION_REQUIRED"
  | "CAUTION_UNSEALED"
  | "GOVERNANCE_REQUIRED"
  | "GOVERNANCE_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "REPLAY_CONTEXT_VALID"
  | "REPLAY_CONTEXT_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "EVIDENCE_CHAIN_VALID"
  | "EVIDENCE_CHAIN_BROKEN"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "REPLAY_DETERMINISM_VERIFIED"
  | "REPLAY_DRIFT_DETECTED"
  | "RECONSTRUCTION_HASH_VERIFIED"
  | "RECONSTRUCTION_MISMATCH"
  | "MUTATION_SIGNALS_BLOCKED"
  | "MUTATION_SIGNALS_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "NOTIFICATION_DISPATCH_BLOCKED"
  | "NOTIFICATION_DISPATCH_DETECTED"
  | "GOVERNANCE_MUTATION_BLOCKED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "REPAIR_BLOCKED"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ANALYSIS_DEPTH_VALID"
  | "ANALYSIS_DEPTH_EXCEEDED"
  | "REPLAY_ARTIFACT_LIMIT_VALID"
  | "REPLAY_ARTIFACT_LIMIT_EXCEEDED"
  | "ESCALATION_REPLAY_IS_NOT_EXECUTION";

export type EscalationReplayEvidencePath = Readonly<{
  context: EscalationReplayContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type EscalationReplayInput = Readonly<{
  request: EscalationReplayRequest;
  intelligence: SealedEscalationIntelligenceRecord;
  oversight: SealedOversightRequirementRecord;
  caution: SealedUncertaintyTriggeredCautionRecord;
  governance: SealedGovernanceEscalationRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certification: SealedDecisionGraphCertificationRecord;
  mutationSignalsDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalCreationRequested?: boolean;
  notificationDispatchRequested?: boolean;
  governanceMutationRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type EscalationReplayValidation = Readonly<{
  valid: boolean;
  replayState: EscalationReplayResult["replayState"];
  reasonCodes: readonly EscalationReplayReasonCode[];
  replayDeterministic: boolean;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  evidenceChainValid: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  replayArtifactCount: number;
}>;

export type EscalationReplayObservability = Readonly<{
  graphId: string;
  replayState: EscalationReplayResult["replayState"];
  replayDeterministic: boolean;
  lineageIntegrity: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedEscalationReplayRecord = Readonly<{
  result: Readonly<EscalationReplayResult>;
  evidencePath: EscalationReplayEvidencePath;
  validation: EscalationReplayValidation;
  observability: EscalationReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalCreationAllowed: false;
  notificationDispatchAllowed: false;
  governanceMutationAllowed: false;
  repairAuthorized: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface EscalationGraphIntegrationRequest {
  graphId: string;
  tenantId: string;
  integrationContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "TOPOLOGY"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface EscalationGraphIntegrationResult {
  graphId: string;
  integrationState:
    | "INTEGRATED"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  escalationRelationshipsBound: boolean;
  topologyIntegrityVerified: boolean;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  graphEvidenceHash: string;
  relationshipHash: string;
  deterministic: boolean;
}

export type EscalationGraphIntegrationContext = EscalationGraphIntegrationRequest["integrationContext"];

export type EscalationGraphIntegrationReasonCode =
  | "INTELLIGENCE_REQUIRED"
  | "INTELLIGENCE_UNSEALED"
  | "OVERSIGHT_REQUIRED"
  | "OVERSIGHT_UNSEALED"
  | "CAUTION_REQUIRED"
  | "CAUTION_UNSEALED"
  | "GOVERNANCE_REQUIRED"
  | "GOVERNANCE_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "TOPOLOGY_REQUIRED"
  | "TOPOLOGY_UNSEALED"
  | "INSPECTION_REQUIRED"
  | "INSPECTION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "INTEGRATION_CONTEXT_VALID"
  | "INTEGRATION_CONTEXT_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "GRAPH_EVIDENCE_PRESENT"
  | "GRAPH_EVIDENCE_MISSING"
  | "RELATIONSHIP_REFERENCES_VALID"
  | "RELATIONSHIP_REFERENCES_BROKEN"
  | "TOPOLOGY_INTEGRITY_VALID"
  | "TOPOLOGY_MISMATCH_DETECTED"
  | "REPLAY_GRAPH_ALIGNMENT_VERIFIED"
  | "REPLAY_GRAPH_MISMATCH"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "MUTATION_SIGNALS_BLOCKED"
  | "MUTATION_SIGNALS_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "NOTIFICATION_DISPATCH_BLOCKED"
  | "NOTIFICATION_DISPATCH_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "GRAPH_MUTATION_BLOCKED"
  | "GRAPH_MUTATION_DETECTED"
  | "GRAPH_OPTIMIZATION_BLOCKED"
  | "GRAPH_OPTIMIZATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "GRAPH_REFERENCE_LIMIT_VALID"
  | "GRAPH_REFERENCE_LIMIT_EXCEEDED"
  | "RELATIONSHIP_DEPTH_VALID"
  | "RELATIONSHIP_DEPTH_EXCEEDED"
  | "ESCALATION_BINDING_LIMIT_VALID"
  | "ESCALATION_BINDING_LIMIT_EXCEEDED"
  | "ESCALATION_GRAPH_INTEGRATION_IS_NOT_EXECUTION";

export type EscalationGraphRelationshipBinding = Readonly<{
  bindingId: string;
  graphId: string;
  evidenceId: string;
  topologyNodeHash: string;
  relationshipOrder: number;
}>;

export type EscalationGraphIntegrationEvidencePath = Readonly<{
  context: EscalationGraphIntegrationContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
  topologyNodeHashes: readonly string[];
  topologyEdgeHashes: readonly string[];
}>;

export type EscalationGraphIntegrationInput = Readonly<{
  request: EscalationGraphIntegrationRequest;
  intelligence: SealedEscalationIntelligenceRecord;
  oversight: SealedOversightRequirementRecord;
  caution: SealedUncertaintyTriggeredCautionRecord;
  governance: SealedGovernanceEscalationRecord;
  replay: SealedEscalationReplayRecord;
  topology: SealedReplayableGraphTopologyRecord;
  inspection: SealedGraphInspectionRecord;
  certification: SealedDecisionGraphCertificationRecord;
  mutationSignalsDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  notificationDispatchRequested?: boolean;
  approvalCreationRequested?: boolean;
  graphMutationRequested?: boolean;
  graphOptimizationRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type EscalationGraphIntegrationValidation = Readonly<{
  valid: boolean;
  integrationState: EscalationGraphIntegrationResult["integrationState"];
  reasonCodes: readonly EscalationGraphIntegrationReasonCode[];
  escalationRelationshipsBound: boolean;
  topologyIntegrityVerified: boolean;
  lineageIntegrity: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  graphReferenceCount: number;
  bindingCount: number;
}>;

export type EscalationGraphIntegrationObservability = Readonly<{
  graphId: string;
  integrationState: EscalationGraphIntegrationResult["integrationState"];
  escalationRelationshipsBound: boolean;
  topologyIntegrityVerified: boolean;
  graphEvidenceHash: string;
  relationshipHash: string;
}>;

export type SealedEscalationGraphIntegrationRecord = Readonly<{
  result: Readonly<EscalationGraphIntegrationResult>;
  bindings: readonly EscalationGraphRelationshipBinding[];
  evidencePath: EscalationGraphIntegrationEvidencePath;
  validation: EscalationGraphIntegrationValidation;
  observability: EscalationGraphIntegrationObservability;
  sealed: true;
  readOnly: true;
  integrationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  notificationDispatchAllowed: false;
  approvalCreationAllowed: false;
  graphMutationAllowed: false;
  graphOptimizationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface EscalationIntegrityRequest {
  graphId: string;
  tenantId: string;
  integrityContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "REPLAY"
    | "GRAPH"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface EscalationIntegrityResult {
  graphId: string;
  integrityState:
    | "HEALTHY"
    | "DEGRADED"
    | "LIMITED"
    | "INVALID";
  evidenceIntegrity: boolean;
  replayIntegrity: boolean;
  graphIntegrity: boolean;
  authorityBounded: boolean;
  tenantIsolationVerified: boolean;
  integrityHash: string;
  deterministic: boolean;
}

export type EscalationIntegrityContext = EscalationIntegrityRequest["integrityContext"];

export type EscalationIntegrityReasonCode =
  | "INTELLIGENCE_REQUIRED"
  | "INTELLIGENCE_UNSEALED"
  | "OVERSIGHT_REQUIRED"
  | "OVERSIGHT_UNSEALED"
  | "CAUTION_REQUIRED"
  | "CAUTION_UNSEALED"
  | "GOVERNANCE_REQUIRED"
  | "GOVERNANCE_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "GRAPH_INTEGRATION_REQUIRED"
  | "GRAPH_INTEGRATION_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "INTEGRITY_CONTEXT_VALID"
  | "INTEGRITY_CONTEXT_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "EVIDENCE_CHAIN_VALID"
  | "EVIDENCE_CHAIN_BROKEN"
  | "REPLAY_INTEGRITY_VALID"
  | "REPLAY_HASH_MISMATCH"
  | "GRAPH_INTEGRITY_VALID"
  | "GRAPH_BINDING_CORRUPTED"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "MUTATION_SIGNALS_BLOCKED"
  | "INTEGRITY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "NOTIFICATION_DISPATCH_BLOCKED"
  | "NOTIFICATION_DISPATCH_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "GOVERNANCE_MUTATION_BLOCKED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "INTEGRITY_DEPTH_VALID"
  | "INTEGRITY_DEPTH_EXCEEDED"
  | "INTEGRITY_ARTIFACT_LIMIT_VALID"
  | "INTEGRITY_ARTIFACT_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "ESCALATION_INTEGRITY_IS_NOT_EXECUTION";

export type EscalationIntegrityEvidencePath = Readonly<{
  context: EscalationIntegrityContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type EscalationIntegrityInput = Readonly<{
  request: EscalationIntegrityRequest;
  intelligence: SealedEscalationIntelligenceRecord;
  oversight: SealedOversightRequirementRecord;
  caution: SealedUncertaintyTriggeredCautionRecord;
  governance: SealedGovernanceEscalationRecord;
  replay: SealedEscalationReplayRecord;
  graphIntegration: SealedEscalationGraphIntegrationRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certification: SealedDecisionGraphCertificationRecord;
  mutationSignalsDetected?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  notificationDispatchRequested?: boolean;
  approvalCreationRequested?: boolean;
  governanceMutationRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type EscalationIntegrityValidation = Readonly<{
  valid: boolean;
  integrityState: EscalationIntegrityResult["integrityState"];
  reasonCodes: readonly EscalationIntegrityReasonCode[];
  evidenceIntegrity: boolean;
  replayIntegrity: boolean;
  graphIntegrity: boolean;
  authorityBounded: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  controlSurfaceAbsent: true;
  analyzedArtifactCount: number;
}>;

export type EscalationIntegrityObservability = Readonly<{
  graphId: string;
  integrityState: EscalationIntegrityResult["integrityState"];
  evidenceIntegrity: boolean;
  replayIntegrity: boolean;
  graphIntegrity: boolean;
  integrityHash: string;
}>;

export type SealedEscalationIntegrityRecord = Readonly<{
  result: Readonly<EscalationIntegrityResult>;
  evidencePath: EscalationIntegrityEvidencePath;
  validation: EscalationIntegrityValidation;
  observability: EscalationIntegrityObservability;
  sealed: true;
  readOnly: true;
  integrityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  notificationDispatchAllowed: false;
  approvalCreationAllowed: false;
  governanceMutationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface EscalationCertificationRequest {
  graphId: string;
  tenantId: string;
  certificationContext:
    | "OWNERSHIP"
    | "LINEAGE"
    | "REPLAY"
    | "GRAPH"
    | "AUTHORITY"
    | "FULL";
  lineageReferences: string[];
  graphVersion: string;
}

export interface EscalationCertificationResult {
  graphId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  evidenceCertified: boolean;
  replayCertified: boolean;
  graphCertified: boolean;
  authorityBounded: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type EscalationCertificationContext = EscalationCertificationRequest["certificationContext"];

export type EscalationCertificationReasonCode =
  | "INTELLIGENCE_REQUIRED"
  | "INTELLIGENCE_UNSEALED"
  | "OVERSIGHT_REQUIRED"
  | "OVERSIGHT_UNSEALED"
  | "CAUTION_REQUIRED"
  | "CAUTION_UNSEALED"
  | "GOVERNANCE_REQUIRED"
  | "GOVERNANCE_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "GRAPH_INTEGRATION_REQUIRED"
  | "GRAPH_INTEGRATION_UNSEALED"
  | "INTEGRITY_REQUIRED"
  | "INTEGRITY_UNSEALED"
  | "VERIFICATION_REQUIRED"
  | "VERIFICATION_UNSEALED"
  | "CERTIFICATION_REQUIRED"
  | "CERTIFICATION_UNSEALED"
  | "GRAPH_ID_MATCHED"
  | "GRAPH_ID_MISMATCH"
  | "GRAPH_VERSION_MATCHED"
  | "GRAPH_VERSION_MISMATCH"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_ARTIFACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "CERTIFICATION_CONTEXT_VALID"
  | "CERTIFICATION_CONTEXT_INVALID"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "LINEAGE_INTEGRITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "EVIDENCE_CERTIFIED"
  | "EVIDENCE_CHAIN_BROKEN"
  | "REPLAY_CERTIFIED"
  | "REPLAY_INTEGRITY_FAILURE"
  | "GRAPH_CERTIFIED"
  | "GRAPH_INTEGRATION_FAILURE"
  | "EVIDENCE_HASH_VERIFIED"
  | "EVIDENCE_HASH_MISMATCH"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "NOTIFICATION_DISPATCH_BLOCKED"
  | "NOTIFICATION_DISPATCH_DETECTED"
  | "APPROVAL_CREATION_BLOCKED"
  | "APPROVAL_CREATION_DETECTED"
  | "GOVERNANCE_MUTATION_BLOCKED"
  | "GOVERNANCE_MUTATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_DEPTH_VALID"
  | "CERTIFICATION_DEPTH_EXCEEDED"
  | "CERTIFICATION_ARTIFACT_LIMIT_VALID"
  | "CERTIFICATION_ARTIFACT_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "ESCALATION_CERTIFICATION_IS_NOT_EXECUTION";

export type EscalationCertificationEvidencePath = Readonly<{
  context: EscalationCertificationContext;
  evidenceIds: readonly string[];
  evidenceHashes: readonly string[];
  lineageReferences: readonly string[];
}>;

export type EscalationCertificationInput = Readonly<{
  request: EscalationCertificationRequest;
  intelligence: SealedEscalationIntelligenceRecord;
  oversight: SealedOversightRequirementRecord;
  caution: SealedUncertaintyTriggeredCautionRecord;
  governance: SealedGovernanceEscalationRecord;
  replay: SealedEscalationReplayRecord;
  graphIntegration: SealedEscalationGraphIntegrationRecord;
  integrity: SealedEscalationIntegrityRecord;
  verification: SealedGraphIntegrityVerificationRecord;
  certification: SealedDecisionGraphCertificationRecord;
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  notificationDispatchRequested?: boolean;
  approvalCreationRequested?: boolean;
  governanceMutationRequested?: boolean;
  authorityExpansionRequested?: boolean;
}>;

export type EscalationCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: EscalationCertificationResult["certificationState"];
  reasonCodes: readonly EscalationCertificationReasonCode[];
  evidenceCertified: boolean;
  replayCertified: boolean;
  graphCertified: boolean;
  authorityBounded: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  controlSurfaceAbsent: true;
  certifiedArtifactCount: number;
}>;

export type EscalationCertificationObservability = Readonly<{
  graphId: string;
  certificationState: EscalationCertificationResult["certificationState"];
  evidenceCertified: boolean;
  replayCertified: boolean;
  graphCertified: boolean;
  certificationHash: string;
}>;

export type SealedEscalationCertificationRecord = Readonly<{
  result: Readonly<EscalationCertificationResult>;
  evidencePath: EscalationCertificationEvidencePath;
  validation: EscalationCertificationValidation;
  observability: EscalationCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  notificationDispatchAllowed: false;
  approvalCreationAllowed: false;
  governanceMutationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
