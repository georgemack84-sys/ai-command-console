import type {
  RecommendationPortfolioBundle,
  SealedPortfolioCertificationRecord,
  SealedPortfolioRelationshipAnalysisRecord,
  SealedPortfolioReplayRecord,
  SealedRecommendationPortfolioRecord,
} from "@/services/recommendation-portfolio";
import type {
  SealedDependencyAnalysisRecord,
  SealedDependencyCertificationRecord,
  SealedDependencyReplayRecord,
  SealedRecommendationDependencyFoundationRecord,
} from "@/services/recommendation-dependency";

export type RecommendationImpactType =
  | "EVIDENCE_IMPACT"
  | "LINEAGE_IMPACT"
  | "GOVERNANCE_IMPACT"
  | "REPLAY_IMPACT"
  | "READINESS_IMPACT"
  | "PORTFOLIO_IMPACT";

export interface RecommendationImpact {
  impactId: string;
  sourceRecommendationId: string;
  affectedRecommendationId: string;
  impactType: RecommendationImpactType;
  impactHash: string;
}

export interface RecommendationImpactFoundationRequest {
  tenantId: string;
  recommendationIds: string[];
  impactScope:
    | "EVIDENCE"
    | "LINEAGE"
    | "GOVERNANCE"
    | "REPLAY"
    | "READINESS"
    | "PORTFOLIO"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationImpactFoundationResult {
  tenantId: string;
  impactState:
    | "ESTABLISHED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  impactsCreated: number;
  evidenceImpactsDetected: number;
  lineageImpactsDetected: number;
  governanceImpactsDetected: number;
  replayImpactsDetected: number;
  readinessImpactsDetected: number;
  portfolioImpactsDetected: number;
  tenantIsolationVerified: boolean;
  impactGraphHash: string;
  deterministic: boolean;
}

export type RecommendationImpactScope = RecommendationImpactFoundationRequest["impactScope"];

export type RecommendationImpactFoundationReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "IMPACT_SCOPE_VALID"
  | "IMPACT_SCOPE_INVALID"
  | "MEMBERSHIP_COMPLETE"
  | "IMPACT_EVIDENCE_MISSING"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_IMPACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "EVIDENCE_IMPACTS_VALID"
  | "EVIDENCE_IMPACTS_MISSING"
  | "LINEAGE_IMPACTS_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "GOVERNANCE_IMPACTS_VALID"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_IMPACTS_VALID"
  | "REPLAY_CORRUPTION_DETECTED"
  | "READINESS_IMPACTS_VALID"
  | "READINESS_DEGRADED"
  | "PORTFOLIO_IMPACTS_VALID"
  | "PORTFOLIO_CORRUPTION_DETECTED"
  | "IMPACT_REFERENCES_PRESENT"
  | "IMPACT_REFERENCES_MISSING"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "IMPACT_MUTATION_BLOCKED"
  | "IMPACT_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "IMPACT_LIMIT_VALID"
  | "IMPACT_LIMIT_EXCEEDED"
  | "GOVERNANCE_IMPACT_LIMIT_VALID"
  | "GOVERNANCE_IMPACT_LIMIT_EXCEEDED"
  | "REPLAY_IMPACT_LIMIT_VALID"
  | "REPLAY_IMPACT_LIMIT_EXCEEDED"
  | "IMPACT_FOUNDATION_IS_NOT_CONTROL";

export type RecommendationImpactEvidencePath = Readonly<{
  scope: RecommendationImpactScope;
  impactReferences: readonly string[];
  evidenceReferences: readonly string[];
  lineageReferences: readonly string[];
  governanceReferences: readonly string[];
  replayReferences: readonly string[];
  readinessReferences: readonly string[];
  portfolioReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationImpactFoundationInput = Readonly<{
  request: RecommendationImpactFoundationRequest;
  foundation: SealedRecommendationDependencyFoundationRecord;
  analysis: SealedDependencyAnalysisRecord;
  replay: SealedDependencyReplayRecord;
  certification: SealedDependencyCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  impactMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationImpactFoundationValidation = Readonly<{
  valid: boolean;
  impactState: RecommendationImpactFoundationResult["impactState"];
  reasonCodes: readonly RecommendationImpactFoundationReasonCode[];
  evidenceImpactsValid: boolean;
  lineageImpactsValid: boolean;
  governanceImpactsValid: boolean;
  replayImpactsValid: boolean;
  readinessImpactsValid: boolean;
  portfolioImpactsValid: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  impactsCreated: number;
  evidenceImpactsDetected: number;
  lineageImpactsDetected: number;
  governanceImpactsDetected: number;
  replayImpactsDetected: number;
  readinessImpactsDetected: number;
  portfolioImpactsDetected: number;
}>;

export type RecommendationImpactFoundationObservability = Readonly<{
  tenantId: string;
  impactState: RecommendationImpactFoundationResult["impactState"];
  impactsCreated: number;
  evidenceImpactsDetected: number;
  lineageImpactsDetected: number;
  governanceImpactsDetected: number;
  replayImpactsDetected: number;
  readinessImpactsDetected: number;
  portfolioImpactsDetected: number;
  impactGraphHash: string;
}>;

export type SealedRecommendationImpactFoundationRecord = Readonly<{
  result: Readonly<RecommendationImpactFoundationResult>;
  impacts: readonly RecommendationImpact[];
  evidencePath: RecommendationImpactEvidencePath;
  validation: RecommendationImpactFoundationValidation;
  observability: RecommendationImpactFoundationObservability;
  sealed: true;
  readOnly: true;
  impactOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface ImpactAnalysisRequest {
  tenantId: string;
  recommendationIds: string[];
  analysisScope:
    | "CHAINS"
    | "PROPAGATION"
    | "CONCENTRATION"
    | "GAPS"
    | "CONFLICTS"
    | "FULL";
  graphVersion: string;
}

export interface ImpactAnalysisResult {
  tenantId: string;
  analysisState:
    | "ANALYZED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  impactChainsDetected: number;
  propagationPathsDetected: number;
  impactConcentrationsDetected: number;
  impactGapsDetected: number;
  impactConflictsDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type ImpactAnalysisScope = ImpactAnalysisRequest["analysisScope"];

export type ImpactAnalysisReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "MEMBERSHIP_COMPLETE"
  | "IMPACT_EVIDENCE_MISSING"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_IMPACTS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "IMPACT_CHAINS_ANALYZED"
  | "IMPACT_CHAINS_LIMITED"
  | "PROPAGATION_PATHS_ANALYZED"
  | "PROPAGATION_PATHS_LIMITED"
  | "IMPACT_CONCENTRATIONS_ANALYZED"
  | "IMPACT_CONCENTRATIONS_LIMITED"
  | "IMPACT_GAPS_DETECTED"
  | "IMPACT_GAPS_ABSENT"
  | "IMPACT_CONFLICTS_DETECTED"
  | "IMPACT_CONFLICTS_ABSENT"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "IMPACT_REFERENCES_PRESENT"
  | "IMPACT_REFERENCES_MISSING"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ANALYSIS_MUTATION_BLOCKED"
  | "ANALYSIS_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "IMPACT_LIMIT_VALID"
  | "IMPACT_LIMIT_EXCEEDED"
  | "CHAIN_LIMIT_VALID"
  | "CHAIN_LIMIT_EXCEEDED"
  | "CONFLICT_LIMIT_VALID"
  | "CONFLICT_LIMIT_EXCEEDED"
  | "IMPACT_ANALYSIS_IS_NOT_CONTROL";

export type ImpactAnalysisEvidencePath = Readonly<{
  scope: ImpactAnalysisScope;
  impactReferences: readonly string[];
  chainReferences: readonly string[];
  propagationReferences: readonly string[];
  concentrationReferences: readonly string[];
  gapReferences: readonly string[];
  conflictReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ImpactAnalysisInput = Readonly<{
  request: ImpactAnalysisRequest;
  foundation: SealedRecommendationImpactFoundationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyAnalysis: SealedDependencyAnalysisRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  analysisMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ImpactAnalysisValidation = Readonly<{
  valid: boolean;
  analysisState: ImpactAnalysisResult["analysisState"];
  reasonCodes: readonly ImpactAnalysisReasonCode[];
  impactChainsDetected: number;
  propagationPathsDetected: number;
  impactConcentrationsDetected: number;
  impactGapsDetected: number;
  impactConflictsDetected: number;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type ImpactAnalysisObservability = Readonly<{
  tenantId: string;
  analysisState: ImpactAnalysisResult["analysisState"];
  impactChainsDetected: number;
  propagationPathsDetected: number;
  impactConcentrationsDetected: number;
  impactGapsDetected: number;
  impactConflictsDetected: number;
  analysisHash: string;
}>;

export type SealedImpactAnalysisRecord = Readonly<{
  result: Readonly<ImpactAnalysisResult>;
  evidencePath: ImpactAnalysisEvidencePath;
  validation: ImpactAnalysisValidation;
  observability: ImpactAnalysisObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface ImpactObservabilityRequest {
  tenantId: string;
  observabilityScope:
    | "SUMMARY"
    | "CHAINS"
    | "PROPAGATION"
    | "CONFLICTS"
    | "LINEAGE"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface ImpactObservabilityResult {
  tenantId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  impactGraphVisible: boolean;
  impactChainsVisible: boolean;
  impactPropagationVisible: boolean;
  impactLineageVisible: boolean;
  impactGovernanceVisible: boolean;
  impactReplayVisible: boolean;
  impactAuditVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type ImpactObservabilityScope = ImpactObservabilityRequest["observabilityScope"];

export type ImpactObservabilityReasonCode =
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
  | "IMPACT_GRAPH_VISIBLE"
  | "IMPACT_GRAPH_VISIBILITY_INCOMPLETE"
  | "IMPACT_CHAINS_VISIBLE"
  | "IMPACT_CHAIN_VISIBILITY_INCOMPLETE"
  | "IMPACT_PROPAGATION_VISIBLE"
  | "IMPACT_PROPAGATION_VISIBILITY_INCOMPLETE"
  | "IMPACT_LINEAGE_VISIBLE"
  | "IMPACT_LINEAGE_VISIBILITY_INCOMPLETE"
  | "IMPACT_REPLAY_VISIBLE"
  | "IMPACT_REPLAY_VISIBILITY_MISSING"
  | "IMPACT_CONFLICTS_VISIBLE"
  | "IMPACT_CONFLICT_VISIBILITY_INCOMPLETE"
  | "IMPACT_AUDIT_VISIBLE"
  | "IMPACT_AUDIT_VISIBILITY_INCOMPLETE"
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
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "IMPACT_LIMIT_VALID"
  | "IMPACT_LIMIT_EXCEEDED"
  | "VISIBLE_CHAIN_LIMIT_VALID"
  | "VISIBLE_CHAIN_LIMIT_EXCEEDED"
  | "VISIBLE_PROPAGATION_LIMIT_VALID"
  | "VISIBLE_PROPAGATION_LIMIT_EXCEEDED"
  | "VISIBLE_CONFLICT_LIMIT_VALID"
  | "VISIBLE_CONFLICT_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "IMPACT_OBSERVABILITY_IS_NOT_CONTROL";

export type ImpactObservabilityEvidencePath = Readonly<{
  scope: ImpactObservabilityScope;
  impactReferences: readonly string[];
  chainReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ImpactObservabilityInput = Readonly<{
  request: ImpactObservabilityRequest;
  foundation: SealedRecommendationImpactFoundationRecord;
  analysis: SealedImpactAnalysisRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyAnalysis: SealedDependencyAnalysisRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  observabilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ImpactObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: ImpactObservabilityResult["observabilityState"];
  reasonCodes: readonly ImpactObservabilityReasonCode[];
  impactGraphVisible: boolean;
  impactChainsVisible: boolean;
  impactPropagationVisible: boolean;
  impactLineageVisible: boolean;
  impactGovernanceVisible: boolean;
  impactReplayVisible: boolean;
  impactAuditVisible: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  visibleChainCount: number;
  visiblePropagationCount: number;
  visibleConflictCount: number;
  visibleReplayReferenceCount: number;
}>;

export type ImpactObservabilityObservability = Readonly<{
  tenantId: string;
  observabilityState: ImpactObservabilityResult["observabilityState"];
  impactGraphVisible: boolean;
  impactChainsVisible: boolean;
  impactPropagationVisible: boolean;
  impactLineageVisible: boolean;
  impactGovernanceVisible: boolean;
  impactReplayVisible: boolean;
  impactAuditVisible: boolean;
  observabilityHash: string;
}>;

export type SealedImpactObservabilityRecord = Readonly<{
  result: Readonly<ImpactObservabilityResult>;
  evidencePath: ImpactObservabilityEvidencePath;
  validation: ImpactObservabilityValidation;
  observability: ImpactObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface ImpactReplayRequest {
  tenantId: string;
  replayScope:
    | "GRAPH"
    | "CHAINS"
    | "EVIDENCE"
    | "PROPAGATION"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface ImpactReplayResult {
  tenantId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  graphReconstructed: boolean;
  chainsReconstructed: boolean;
  evidenceReconstructed: boolean;
  propagationReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type ImpactReplayScope = ImpactReplayRequest["replayScope"];

export type ImpactReplayReasonCode =
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
  | "PROPAGATION_RECONSTRUCTED"
  | "PROPAGATION_MISMATCH_DETECTED"
  | "GOVERNANCE_RECONSTRUCTED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_HASH_VERIFIED"
  | "REPLAY_HASH_MISMATCH"
  | "LINEAGE_CONTINUITY_PRESERVED"
  | "LINEAGE_CONTINUITY_BROKEN"
  | "OBSERVABILITY_RECONSTRUCTED"
  | "OBSERVABILITY_RECONSTRUCTION_BROKEN"
  | "CONFLICTS_RECONSTRUCTED"
  | "CONFLICT_RECONSTRUCTION_BROKEN"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "IMPACT_LIMIT_VALID"
  | "IMPACT_LIMIT_EXCEEDED"
  | "CHAIN_LIMIT_VALID"
  | "CHAIN_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "IMPACT_REPLAY_IS_NOT_CONTROL";

export type ImpactReplayEvidencePath = Readonly<{
  scope: ImpactReplayScope;
  impactReferences: readonly string[];
  chainReferences: readonly string[];
  propagationReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  conflictReferences: readonly string[];
  observabilityReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ImpactReplayInput = Readonly<{
  request: ImpactReplayRequest;
  foundation: SealedRecommendationImpactFoundationRecord;
  analysis: SealedImpactAnalysisRecord;
  observability: SealedImpactObservabilityRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyAnalysis: SealedDependencyAnalysisRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ImpactReplayValidation = Readonly<{
  valid: boolean;
  replayState: ImpactReplayResult["replayState"];
  reasonCodes: readonly ImpactReplayReasonCode[];
  graphReconstructed: boolean;
  chainsReconstructed: boolean;
  evidenceReconstructed: boolean;
  propagationReconstructed: boolean;
  governanceReconstructed: boolean;
  observabilityReconstructed: boolean;
  conflictsReconstructed: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  chainCount: number;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type ImpactReplayObservability = Readonly<{
  tenantId: string;
  replayState: ImpactReplayResult["replayState"];
  graphReconstructed: boolean;
  chainsReconstructed: boolean;
  evidenceReconstructed: boolean;
  propagationReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedImpactReplayRecord = Readonly<{
  result: Readonly<ImpactReplayResult>;
  evidencePath: ImpactReplayEvidencePath;
  validation: ImpactReplayValidation;
  observability: ImpactReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface ImpactCertificationRequest {
  tenantId: string;
  certificationScope:
    | "INTEGRITY"
    | "PROPAGATION"
    | "REPLAY"
    | "GOVERNANCE"
    | "FULL";
  graphVersion: string;
}

export interface ImpactCertificationResult {
  tenantId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  integrityCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type ImpactCertificationScope = ImpactCertificationRequest["certificationScope"];

export type ImpactCertificationReasonCode =
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
  | "PROPAGATION_CERTIFIED"
  | "PROPAGATION_BROKEN"
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
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "IMPACT_LIMIT_VALID"
  | "IMPACT_LIMIT_EXCEEDED"
  | "CHAIN_LIMIT_VALID"
  | "CHAIN_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "CONFLICT_REFERENCE_LIMIT_VALID"
  | "CONFLICT_REFERENCE_LIMIT_EXCEEDED"
  | "IMPACT_CERTIFICATION_IS_NOT_CONTROL";

export type ImpactCertificationEvidencePath = Readonly<{
  scope: ImpactCertificationScope;
  impactReferences: readonly string[];
  chainReferences: readonly string[];
  propagationReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  conflictReferences: readonly string[];
  governanceReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ImpactCertificationInput = Readonly<{
  request: ImpactCertificationRequest;
  foundation: SealedRecommendationImpactFoundationRecord;
  analysis: SealedImpactAnalysisRecord;
  observability: SealedImpactObservabilityRecord;
  replay: SealedImpactReplayRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyAnalysis: SealedDependencyAnalysisRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ImpactCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: ImpactCertificationResult["certificationState"];
  reasonCodes: readonly ImpactCertificationReasonCode[];
  integrityCertified: boolean;
  propagationCertified: boolean;
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

export type ImpactCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: ImpactCertificationResult["certificationState"];
  integrityCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  certificationHash: string;
}>;

export type SealedImpactCertificationRecord = Readonly<{
  result: Readonly<ImpactCertificationResult>;
  evidencePath: ImpactCertificationEvidencePath;
  validation: ImpactCertificationValidation;
  observability: ImpactCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
