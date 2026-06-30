import type { RecommendationPortfolioBundle, SealedPortfolioCertificationRecord, SealedPortfolioObservabilityRecord, SealedPortfolioRelationshipAnalysisRecord, SealedPortfolioReplayRecord, SealedRecommendationPortfolioRecord } from "@/services/recommendation-portfolio";

export type RecommendationDependencyType =
  | "EVIDENCE"
  | "LINEAGE"
  | "GOVERNANCE"
  | "REPLAY"
  | "READINESS"
  | "ALIGNMENT";

export interface RecommendationDependency {
  dependencyId: string;
  sourceRecommendationId: string;
  targetRecommendationId: string;
  dependencyType: RecommendationDependencyType;
  dependencyHash: string;
}

export interface RecommendationDependencyFoundationRequest {
  tenantId: string;
  recommendationIds: string[];
  dependencyScope:
    | "EVIDENCE"
    | "LINEAGE"
    | "GOVERNANCE"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationDependencyFoundationResult {
  tenantId: string;
  dependencyState:
    | "ESTABLISHED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  dependenciesCreated: number;
  governanceDependenciesDetected: number;
  replayDependenciesDetected: number;
  lineageDependenciesDetected: number;
  tenantIsolationVerified: boolean;
  dependencyGraphHash: string;
  deterministic: boolean;
}

export type RecommendationDependencyScope = RecommendationDependencyFoundationRequest["dependencyScope"];

export type RecommendationDependencyFoundationReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "DEPENDENCY_SCOPE_VALID"
  | "DEPENDENCY_SCOPE_INVALID"
  | "MEMBERSHIP_COMPLETE"
  | "DEPENDENCY_EVIDENCE_MISSING"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_DEPENDENCIES_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_DEPENDENCIES_VALID"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_DEPENDENCIES_VALID"
  | "REPLAY_CORRUPTION_DETECTED"
  | "LINEAGE_DEPENDENCIES_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "DEPENDENCY_REFERENCES_PRESENT"
  | "DEPENDENCY_REFERENCES_MISSING"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_ORDERING_BLOCKED"
  | "APPROVAL_ORDERING_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "DEPENDENCY_MUTATION_BLOCKED"
  | "DEPENDENCY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "DEPENDENCY_LIMIT_VALID"
  | "DEPENDENCY_LIMIT_EXCEEDED"
  | "GOVERNANCE_DEPENDENCY_LIMIT_VALID"
  | "GOVERNANCE_DEPENDENCY_LIMIT_EXCEEDED"
  | "REPLAY_DEPENDENCY_LIMIT_VALID"
  | "REPLAY_DEPENDENCY_LIMIT_EXCEEDED"
  | "DEPENDENCY_FOUNDATION_IS_NOT_CONTROL";

export type RecommendationDependencyEvidencePath = Readonly<{
  scope: RecommendationDependencyScope;
  dependencyReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationDependencyFoundationInput = Readonly<{
  request: RecommendationDependencyFoundationRequest;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  observability: SealedPortfolioObservabilityRecord;
  replay: SealedPortfolioReplayRecord;
  certification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  dependencyMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalOrderingRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationDependencyFoundationValidation = Readonly<{
  valid: boolean;
  dependencyState: RecommendationDependencyFoundationResult["dependencyState"];
  reasonCodes: readonly RecommendationDependencyFoundationReasonCode[];
  governanceDependenciesValid: boolean;
  replayDependenciesValid: boolean;
  lineageDependenciesValid: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  dependenciesCreated: number;
  governanceDependenciesDetected: number;
  replayDependenciesDetected: number;
  lineageDependenciesDetected: number;
}>;

export type RecommendationDependencyFoundationObservability = Readonly<{
  tenantId: string;
  dependencyState: RecommendationDependencyFoundationResult["dependencyState"];
  dependenciesCreated: number;
  governanceDependenciesDetected: number;
  replayDependenciesDetected: number;
  lineageDependenciesDetected: number;
  dependencyGraphHash: string;
}>;

export type SealedRecommendationDependencyFoundationRecord = Readonly<{
  result: Readonly<RecommendationDependencyFoundationResult>;
  dependencies: readonly RecommendationDependency[];
  evidencePath: RecommendationDependencyEvidencePath;
  validation: RecommendationDependencyFoundationValidation;
  observability: RecommendationDependencyFoundationObservability;
  sealed: true;
  readOnly: true;
  dependencyOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalOrderingAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DependencyAnalysisRequest {
  tenantId: string;
  recommendationIds: string[];
  analysisScope:
    | "SHARED"
    | "CHAINS"
    | "GAPS"
    | "CONTINUITY"
    | "CONFLICTS"
    | "FULL";
  graphVersion: string;
}

export interface DependencyAnalysisResult {
  tenantId: string;
  analysisState:
    | "ANALYZED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  sharedDependenciesDetected: number;
  dependencyChainsDetected: number;
  dependencyGapsDetected: number;
  dependencyContinuityVerified: boolean;
  dependencyConflictsDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type DependencyAnalysisScope = DependencyAnalysisRequest["analysisScope"];

export type DependencyAnalysisReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "MEMBERSHIP_COMPLETE"
  | "DEPENDENCY_EVIDENCE_MISSING"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_DEPENDENCIES_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "SHARED_DEPENDENCIES_ANALYZED"
  | "SHARED_DEPENDENCY_EVIDENCE_MISSING"
  | "DEPENDENCY_CHAINS_ANALYZED"
  | "DEPENDENCY_CHAINS_LIMITED"
  | "DEPENDENCY_GAPS_DETECTED"
  | "DEPENDENCY_GAPS_ABSENT"
  | "DEPENDENCY_CONTINUITY_VERIFIED"
  | "DEPENDENCY_CONTINUITY_DEGRADED"
  | "DEPENDENCY_CONFLICTS_DETECTED"
  | "DEPENDENCY_CONFLICTS_ABSENT"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "DEPENDENCY_REFERENCES_PRESENT"
  | "DEPENDENCY_REFERENCES_MISSING"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_ORDERING_BLOCKED"
  | "APPROVAL_ORDERING_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ANALYSIS_MUTATION_BLOCKED"
  | "ANALYSIS_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "DEPENDENCY_LIMIT_VALID"
  | "DEPENDENCY_LIMIT_EXCEEDED"
  | "CHAIN_LIMIT_VALID"
  | "CHAIN_LIMIT_EXCEEDED"
  | "CONFLICT_LIMIT_VALID"
  | "CONFLICT_LIMIT_EXCEEDED"
  | "DEPENDENCY_ANALYSIS_IS_NOT_CONTROL";

export type DependencyAnalysisEvidencePath = Readonly<{
  scope: DependencyAnalysisScope;
  dependencyReferences: readonly string[];
  chainReferences: readonly string[];
  gapReferences: readonly string[];
  conflictReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DependencyAnalysisInput = Readonly<{
  request: DependencyAnalysisRequest;
  foundation: SealedRecommendationDependencyFoundationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  observability: SealedPortfolioObservabilityRecord;
  replay: SealedPortfolioReplayRecord;
  certification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  analysisMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalOrderingRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyAnalysisValidation = Readonly<{
  valid: boolean;
  analysisState: DependencyAnalysisResult["analysisState"];
  reasonCodes: readonly DependencyAnalysisReasonCode[];
  sharedDependenciesDetected: number;
  dependencyChainsDetected: number;
  dependencyGapsDetected: number;
  dependencyContinuityVerified: boolean;
  dependencyConflictsDetected: number;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type DependencyAnalysisObservability = Readonly<{
  tenantId: string;
  analysisState: DependencyAnalysisResult["analysisState"];
  sharedDependenciesDetected: number;
  dependencyChainsDetected: number;
  dependencyGapsDetected: number;
  dependencyContinuityVerified: boolean;
  dependencyConflictsDetected: number;
  analysisHash: string;
}>;

export type SealedDependencyAnalysisRecord = Readonly<{
  result: Readonly<DependencyAnalysisResult>;
  evidencePath: DependencyAnalysisEvidencePath;
  validation: DependencyAnalysisValidation;
  observability: DependencyAnalysisObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalOrderingAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DependencyObservabilityRequest {
  tenantId: string;
  observabilityScope:
    | "SUMMARY"
    | "CHAINS"
    | "CONFLICTS"
    | "LINEAGE"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface DependencyObservabilityResult {
  tenantId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  dependencyGraphVisible: boolean;
  dependencyChainsVisible: boolean;
  dependencyLineageVisible: boolean;
  dependencyReplayVisible: boolean;
  dependencyConflictsVisible: boolean;
  dependencyAuditVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type DependencyObservabilityScope = DependencyObservabilityRequest["observabilityScope"];

export type DependencyObservabilityReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "OBSERVABILITY_SCOPE_VALID"
  | "OBSERVABILITY_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "ANALYSIS_REQUIRED"
  | "ANALYSIS_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_VISIBILITY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "DEPENDENCY_GRAPH_VISIBLE"
  | "DEPENDENCY_GRAPH_VISIBILITY_INCOMPLETE"
  | "DEPENDENCY_CHAINS_VISIBLE"
  | "DEPENDENCY_CHAIN_VISIBILITY_INCOMPLETE"
  | "DEPENDENCY_LINEAGE_VISIBLE"
  | "DEPENDENCY_LINEAGE_VISIBILITY_INCOMPLETE"
  | "DEPENDENCY_REPLAY_VISIBLE"
  | "DEPENDENCY_REPLAY_VISIBILITY_MISSING"
  | "DEPENDENCY_CONFLICTS_VISIBLE"
  | "DEPENDENCY_CONFLICT_VISIBILITY_INCOMPLETE"
  | "DEPENDENCY_AUDIT_VISIBLE"
  | "DEPENDENCY_AUDIT_VISIBILITY_INCOMPLETE"
  | "GOVERNANCE_VISIBLE"
  | "GOVERNANCE_VISIBILITY_MISSING"
  | "VISIBILITY_EVIDENCE_COMPLETE"
  | "VISIBILITY_EVIDENCE_MISSING"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DEPENDENCY_LIMIT_VALID"
  | "DEPENDENCY_LIMIT_EXCEEDED"
  | "VISIBLE_CHAIN_LIMIT_VALID"
  | "VISIBLE_CHAIN_LIMIT_EXCEEDED"
  | "VISIBLE_CONFLICT_LIMIT_VALID"
  | "VISIBLE_CONFLICT_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "DEPENDENCY_OBSERVABILITY_IS_NOT_CONTROL";

export type DependencyObservabilityEvidencePath = Readonly<{
  scope: DependencyObservabilityScope;
  dependencyReferences: readonly string[];
  chainReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DependencyObservabilityInput = Readonly<{
  request: DependencyObservabilityRequest;
  foundation: SealedRecommendationDependencyFoundationRecord;
  analysis: SealedDependencyAnalysisRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  observability: SealedPortfolioObservabilityRecord;
  replay: SealedPortfolioReplayRecord;
  certification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  observabilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: DependencyObservabilityResult["observabilityState"];
  reasonCodes: readonly DependencyObservabilityReasonCode[];
  dependencyGraphVisible: boolean;
  dependencyChainsVisible: boolean;
  dependencyLineageVisible: boolean;
  dependencyReplayVisible: boolean;
  dependencyConflictsVisible: boolean;
  dependencyAuditVisible: boolean;
  governanceVisible: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  visibleChainCount: number;
  visibleConflictCount: number;
  visibleReplayReferenceCount: number;
}>;

export type DependencyObservabilityObservability = Readonly<{
  tenantId: string;
  observabilityState: DependencyObservabilityResult["observabilityState"];
  dependencyGraphVisible: boolean;
  dependencyChainsVisible: boolean;
  dependencyLineageVisible: boolean;
  dependencyReplayVisible: boolean;
  dependencyConflictsVisible: boolean;
  dependencyAuditVisible: boolean;
  observabilityHash: string;
}>;

export type SealedDependencyObservabilityRecord = Readonly<{
  result: Readonly<DependencyObservabilityResult>;
  evidencePath: DependencyObservabilityEvidencePath;
  validation: DependencyObservabilityValidation;
  observability: DependencyObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  recommendationApprovalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DependencyReplayRequest {
  tenantId: string;
  replayScope:
    | "GRAPH"
    | "CHAINS"
    | "EVIDENCE"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface DependencyReplayResult {
  tenantId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  graphReconstructed: boolean;
  chainsReconstructed: boolean;
  evidenceReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type DependencyReplayScope = DependencyReplayRequest["replayScope"];

export type DependencyReplayReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "REPLAY_SCOPE_VALID"
  | "REPLAY_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "ANALYSIS_REQUIRED"
  | "ANALYSIS_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GRAPH_RECONSTRUCTED"
  | "GRAPH_EVIDENCE_MISSING"
  | "CHAINS_RECONSTRUCTED"
  | "CHAIN_EVIDENCE_MISSING"
  | "EVIDENCE_RECONSTRUCTED"
  | "REPLAY_ARTIFACTS_MISSING"
  | "GOVERNANCE_RECONSTRUCTED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_HASH_VERIFIED"
  | "REPLAY_HASH_MISMATCH"
  | "LINEAGE_CONTINUITY_PRESERVED"
  | "LINEAGE_CONTINUITY_BROKEN"
  | "OBSERVABILITY_RECONSTRUCTED"
  | "OBSERVABILITY_RECONSTRUCTION_BROKEN"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DEPENDENCY_LIMIT_VALID"
  | "DEPENDENCY_LIMIT_EXCEEDED"
  | "CHAIN_LIMIT_VALID"
  | "CHAIN_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "DEPENDENCY_REPLAY_IS_NOT_CONTROL";

export type DependencyReplayEvidencePath = Readonly<{
  scope: DependencyReplayScope;
  dependencyReferences: readonly string[];
  chainReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  conflictReferences: readonly string[];
  observabilityReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DependencyReplayInput = Readonly<{
  request: DependencyReplayRequest;
  foundation: SealedRecommendationDependencyFoundationRecord;
  analysis: SealedDependencyAnalysisRecord;
  observability: SealedDependencyObservabilityRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioObservability: SealedPortfolioObservabilityRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  certification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyReplayValidation = Readonly<{
  valid: boolean;
  replayState: DependencyReplayResult["replayState"];
  reasonCodes: readonly DependencyReplayReasonCode[];
  graphReconstructed: boolean;
  chainsReconstructed: boolean;
  evidenceReconstructed: boolean;
  governanceReconstructed: boolean;
  observabilityReconstructed: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  chainCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type DependencyReplayObservability = Readonly<{
  tenantId: string;
  replayState: DependencyReplayResult["replayState"];
  graphReconstructed: boolean;
  chainsReconstructed: boolean;
  evidenceReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedDependencyReplayRecord = Readonly<{
  result: Readonly<DependencyReplayResult>;
  evidencePath: DependencyReplayEvidencePath;
  validation: DependencyReplayValidation;
  observability: DependencyReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  recommendationApprovalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DependencyCertificationRequest {
  tenantId: string;
  certificationScope:
    | "INTEGRITY"
    | "CONTINUITY"
    | "REPLAY"
    | "GOVERNANCE"
    | "FULL";
  graphVersion: string;
}

export interface DependencyCertificationResult {
  tenantId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  integrityCertified: boolean;
  continuityCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type DependencyCertificationScope = DependencyCertificationRequest["certificationScope"];

export type DependencyCertificationReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "CERTIFICATION_SCOPE_VALID"
  | "CERTIFICATION_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "ANALYSIS_REQUIRED"
  | "ANALYSIS_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_CERTIFICATION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "INTEGRITY_CERTIFIED"
  | "INTEGRITY_BROKEN"
  | "CONTINUITY_CERTIFIED"
  | "CONTINUITY_BROKEN"
  | "REPLAY_CERTIFIED"
  | "REPLAY_DEGRADED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "GOVERNANCE_CERTIFIED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "OBSERVABILITY_CERTIFIED"
  | "OBSERVABILITY_INCOMPLETE"
  | "LINEAGE_CERTIFIED"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "CONFLICT_VISIBILITY_CERTIFIED"
  | "CONFLICT_VISIBILITY_MISSING"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DEPENDENCY_LIMIT_VALID"
  | "DEPENDENCY_LIMIT_EXCEEDED"
  | "CHAIN_LIMIT_VALID"
  | "CHAIN_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "CONFLICT_REFERENCE_LIMIT_VALID"
  | "CONFLICT_REFERENCE_LIMIT_EXCEEDED"
  | "DEPENDENCY_CERTIFICATION_IS_NOT_CONTROL";

export type DependencyCertificationEvidencePath = Readonly<{
  scope: DependencyCertificationScope;
  dependencyReferences: readonly string[];
  chainReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  conflictReferences: readonly string[];
  governanceReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DependencyCertificationInput = Readonly<{
  request: DependencyCertificationRequest;
  foundation: SealedRecommendationDependencyFoundationRecord;
  analysis: SealedDependencyAnalysisRecord;
  observability: SealedDependencyObservabilityRecord;
  replay: SealedDependencyReplayRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioObservability: SealedPortfolioObservabilityRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  certification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: DependencyCertificationResult["certificationState"];
  reasonCodes: readonly DependencyCertificationReasonCode[];
  integrityCertified: boolean;
  continuityCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  lineageCertified: boolean;
  conflictVisibilityCertified: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  chainCount: number;
  replayReferenceCount: number;
  conflictReferenceCount: number;
}>;

export type DependencyCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: DependencyCertificationResult["certificationState"];
  integrityCertified: boolean;
  continuityCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  certificationHash: string;
}>;

export type SealedDependencyCertificationRecord = Readonly<{
  result: Readonly<DependencyCertificationResult>;
  evidencePath: DependencyCertificationEvidencePath;
  validation: DependencyCertificationValidation;
  observability: DependencyCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  recommendationApprovalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
