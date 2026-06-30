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
import type {
  SealedOperatorReviewPacketRecord,
  SealedStrategicContextAlignmentRecord,
  SealedStrategicReadinessCertificationRecord,
  SealedStrategicReadinessRecord,
  SealedStrategicReadinessReplayRecord,
} from "@/services/strategic-readiness";

export interface RecommendationPortfolioRequest {
  portfolioId: string;
  tenantId: string;
  recommendationIds: string[];
  portfolioScope:
    | "STANDARD"
    | "GOVERNANCE"
    | "OBSERVABILITY"
    | "READINESS"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationPortfolio {
  portfolioId: string;
  tenantId: string;
  recommendationIds: string[];
  governanceReferences: string[];
  replayReferences: string[];
  lineageReferences: string[];
  ownershipReferences: string[];
  portfolioHash: string;
  createdAt: string;
}

export interface RecommendationPortfolioResult {
  portfolioId: string;
  portfolioState:
    | "ESTABLISHED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  recommendationCount: number;
  governanceBound: boolean;
  replayBound: boolean;
  lineageBound: boolean;
  tenantIsolationVerified: boolean;
  portfolioHash: string;
  deterministic: boolean;
}

export type RecommendationPortfolioScope = RecommendationPortfolioRequest["portfolioScope"];

export type RecommendationPortfolioReasonCode =
  | "PORTFOLIO_ID_PRESENT"
  | "PORTFOLIO_ID_MISSING"
  | "PORTFOLIO_SCOPE_VALID"
  | "PORTFOLIO_SCOPE_INVALID"
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "MEMBERSHIP_COMPLETE"
  | "PORTFOLIO_INCOMPLETE"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_RECOMMENDATIONS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_BOUND"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_BOUND"
  | "REPLAY_DEGRADED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "LINEAGE_BOUND"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "OBSERVABILITY_PRESERVED"
  | "OBSERVABILITY_DEGRADED"
  | "READINESS_COMPLETE"
  | "READINESS_INCOMPLETE"
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
  | "PORTFOLIO_MUTATION_BLOCKED"
  | "PORTFOLIO_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "PORTFOLIO_SIZE_VALID"
  | "PORTFOLIO_SIZE_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "PORTFOLIO_FOUNDATION_IS_NOT_CONTROL";

export type RecommendationPortfolioBundle = Readonly<{
  readiness: SealedStrategicReadinessRecord;
  alignment: SealedStrategicContextAlignmentRecord;
  reviewPacket: SealedOperatorReviewPacketRecord;
  replayFramework: SealedStrategicReadinessReplayRecord;
  readinessCertification: SealedStrategicReadinessCertificationRecord;
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
}>;

export type RecommendationPortfolioEvidencePath = Readonly<{
  scope: RecommendationPortfolioScope;
  governanceReferences: readonly string[];
  replayReferences: readonly string[];
  lineageReferences: readonly string[];
  ownershipReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationPortfolioInput = Readonly<{
  request: RecommendationPortfolioRequest;
  recommendations: readonly RecommendationPortfolioBundle[];
  portfolioMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationPortfolioValidation = Readonly<{
  valid: boolean;
  portfolioState: RecommendationPortfolioResult["portfolioState"];
  reasonCodes: readonly RecommendationPortfolioReasonCode[];
  governanceBound: boolean;
  replayBound: boolean;
  lineageBound: boolean;
  ownershipValid: boolean;
  readinessComplete: boolean;
  observabilityPreserved: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  recommendationCount: number;
  governanceReferenceCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type RecommendationPortfolioObservability = Readonly<{
  portfolioId: string;
  portfolioState: RecommendationPortfolioResult["portfolioState"];
  recommendationCount: number;
  governanceBound: boolean;
  replayBound: boolean;
  lineageBound: boolean;
  portfolioHash: string;
}>;

export type SealedRecommendationPortfolioRecord = Readonly<{
  result: Readonly<RecommendationPortfolioResult>;
  portfolio: Readonly<RecommendationPortfolio>;
  evidencePath: RecommendationPortfolioEvidencePath;
  validation: RecommendationPortfolioValidation;
  observability: RecommendationPortfolioObservability;
  sealed: true;
  readOnly: true;
  portfolioOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  recommendationApprovalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface PortfolioRelationshipAnalysisRequest {
  portfolioId: string;
  tenantId: string;
  analysisScope:
    | "EVIDENCE"
    | "GOVERNANCE"
    | "REPLAY"
    | "LINEAGE"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationRelationship {
  relationshipId: string;
  sourceRecommendationId: string;
  targetRecommendationId: string;
  relationshipType:
    | "SHARED_EVIDENCE"
    | "SHARED_GOVERNANCE"
    | "SHARED_REPLAY"
    | "SHARED_LINEAGE"
    | "SHARED_READINESS"
    | "SHARED_ALIGNMENT"
    | "SHARED_OWNERSHIP";
  relationshipHash: string;
}

export interface PortfolioRelationshipAnalysisResult {
  portfolioId: string;
  relationshipState:
    | "ANALYZED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  relationshipsDetected: number;
  governanceRelationshipsDetected: number;
  replayRelationshipsDetected: number;
  lineageRelationshipsDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type PortfolioRelationshipAnalysisScope = PortfolioRelationshipAnalysisRequest["analysisScope"];

export type PortfolioRelationshipAnalysisReasonCode =
  | "PORTFOLIO_REQUIRED"
  | "PORTFOLIO_UNSEALED"
  | "PORTFOLIO_ID_PRESENT"
  | "PORTFOLIO_ID_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "RELATIONSHIP_MEMBERSHIP_COMPLETE"
  | "RELATIONSHIP_EVIDENCE_MISSING"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_RELATIONSHIPS_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_RELATIONSHIPS_VALID"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_RELATIONSHIPS_VALID"
  | "REPLAY_DEGRADED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "LINEAGE_RELATIONSHIPS_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "OBSERVABILITY_PRESERVED"
  | "OBSERVABILITY_DEGRADED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "RECOMMENDATION_SCORING_BLOCKED"
  | "RECOMMENDATION_SCORING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ANALYSIS_MUTATION_BLOCKED"
  | "ANALYSIS_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "PORTFOLIO_SIZE_VALID"
  | "PORTFOLIO_SIZE_EXCEEDED"
  | "RELATIONSHIP_LIMIT_VALID"
  | "RELATIONSHIP_LIMIT_EXCEEDED"
  | "GOVERNANCE_RELATIONSHIP_LIMIT_VALID"
  | "GOVERNANCE_RELATIONSHIP_LIMIT_EXCEEDED"
  | "REPLAY_RELATIONSHIP_LIMIT_VALID"
  | "REPLAY_RELATIONSHIP_LIMIT_EXCEEDED"
  | "PORTFOLIO_RELATIONSHIP_ANALYSIS_IS_NOT_CONTROL";

export type PortfolioRelationshipAnalysisEvidencePath = Readonly<{
  scope: PortfolioRelationshipAnalysisScope;
  relationshipReferences: readonly string[];
  governanceReferences: readonly string[];
  replayReferences: readonly string[];
  lineageReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type PortfolioRelationshipAnalysisInput = Readonly<{
  request: PortfolioRelationshipAnalysisRequest;
  portfolio: SealedRecommendationPortfolioRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  analysisMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  recommendationScoringRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type PortfolioRelationshipAnalysisValidation = Readonly<{
  valid: boolean;
  relationshipState: PortfolioRelationshipAnalysisResult["relationshipState"];
  reasonCodes: readonly PortfolioRelationshipAnalysisReasonCode[];
  governanceRelationshipsValid: boolean;
  replayRelationshipsValid: boolean;
  lineageRelationshipsValid: boolean;
  ownershipValid: boolean;
  observabilityPreserved: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  relationshipsDetected: number;
  governanceRelationshipsDetected: number;
  replayRelationshipsDetected: number;
  lineageRelationshipsDetected: number;
}>;

export type PortfolioRelationshipAnalysisObservability = Readonly<{
  portfolioId: string;
  relationshipState: PortfolioRelationshipAnalysisResult["relationshipState"];
  relationshipsDetected: number;
  governanceRelationshipsDetected: number;
  replayRelationshipsDetected: number;
  lineageRelationshipsDetected: number;
  analysisHash: string;
}>;

export type SealedPortfolioRelationshipAnalysisRecord = Readonly<{
  result: Readonly<PortfolioRelationshipAnalysisResult>;
  relationships: readonly RecommendationRelationship[];
  evidencePath: PortfolioRelationshipAnalysisEvidencePath;
  validation: PortfolioRelationshipAnalysisValidation;
  observability: PortfolioRelationshipAnalysisObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  recommendationScoringAllowed: false;
  recommendationApprovalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface PortfolioObservabilityRequest {
  portfolioId: string;
  tenantId: string;
  observabilityScope:
    | "SUMMARY"
    | "RELATIONSHIPS"
    | "LINEAGE"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface PortfolioObservabilityResult {
  portfolioId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  portfolioVisible: boolean;
  relationshipsVisible: boolean;
  lineageVisible: boolean;
  replayVisible: boolean;
  auditVisible: boolean;
  governanceVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type PortfolioObservabilityScope = PortfolioObservabilityRequest["observabilityScope"];

export type PortfolioObservabilityReasonCode =
  | "PORTFOLIO_REQUIRED"
  | "PORTFOLIO_UNSEALED"
  | "RELATIONSHIP_ANALYSIS_REQUIRED"
  | "RELATIONSHIP_ANALYSIS_UNSEALED"
  | "PORTFOLIO_ID_PRESENT"
  | "PORTFOLIO_ID_MISSING"
  | "OBSERVABILITY_SCOPE_VALID"
  | "OBSERVABILITY_SCOPE_INVALID"
  | "VISIBILITY_EVIDENCE_COMPLETE"
  | "VISIBILITY_EVIDENCE_MISSING"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_VISIBILITY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "PORTFOLIO_VISIBLE"
  | "PORTFOLIO_VISIBILITY_INCOMPLETE"
  | "RELATIONSHIPS_VISIBLE"
  | "RELATIONSHIP_VISIBILITY_INCOMPLETE"
  | "LINEAGE_VISIBLE"
  | "LINEAGE_VISIBILITY_INCOMPLETE"
  | "REPLAY_VISIBLE"
  | "REPLAY_VISIBILITY_MISSING"
  | "AUDIT_VISIBLE"
  | "AUDIT_VISIBILITY_INCOMPLETE"
  | "GOVERNANCE_VISIBLE"
  | "GOVERNANCE_VISIBILITY_MISSING"
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
  | "RECOMMENDATION_SCORING_BLOCKED"
  | "RECOMMENDATION_SCORING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "PORTFOLIO_SIZE_VALID"
  | "PORTFOLIO_SIZE_EXCEEDED"
  | "VISIBLE_RELATIONSHIP_LIMIT_VALID"
  | "VISIBLE_RELATIONSHIP_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "VISIBLE_LINEAGE_REFERENCE_LIMIT_VALID"
  | "VISIBLE_LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "PORTFOLIO_OBSERVABILITY_IS_NOT_CONTROL";

export type PortfolioObservabilityEvidencePath = Readonly<{
  scope: PortfolioObservabilityScope;
  portfolioReferences: readonly string[];
  relationshipReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type PortfolioObservabilityInput = Readonly<{
  request: PortfolioObservabilityRequest;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  observabilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  recommendationScoringRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type PortfolioObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: PortfolioObservabilityResult["observabilityState"];
  reasonCodes: readonly PortfolioObservabilityReasonCode[];
  portfolioVisible: boolean;
  relationshipsVisible: boolean;
  lineageVisible: boolean;
  replayVisible: boolean;
  auditVisible: boolean;
  governanceVisible: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  visibleRelationshipCount: number;
  visibleReplayReferenceCount: number;
  visibleLineageReferenceCount: number;
}>;

export type PortfolioObservabilityObservability = Readonly<{
  portfolioId: string;
  observabilityState: PortfolioObservabilityResult["observabilityState"];
  portfolioVisible: boolean;
  relationshipsVisible: boolean;
  lineageVisible: boolean;
  replayVisible: boolean;
  auditVisible: boolean;
  governanceVisible: boolean;
  observabilityHash: string;
}>;

export type SealedPortfolioObservabilityRecord = Readonly<{
  result: Readonly<PortfolioObservabilityResult>;
  evidencePath: PortfolioObservabilityEvidencePath;
  validation: PortfolioObservabilityValidation;
  observability: PortfolioObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  recommendationScoringAllowed: false;
  recommendationApprovalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface PortfolioReplayRequest {
  portfolioId: string;
  tenantId: string;
  replayScope:
    | "COMPOSITION"
    | "RELATIONSHIPS"
    | "EVIDENCE"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface PortfolioReplayResult {
  portfolioId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  compositionReconstructed: boolean;
  relationshipsReconstructed: boolean;
  evidenceReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type PortfolioReplayScope = PortfolioReplayRequest["replayScope"];

export type PortfolioReplayReasonCode =
  | "PORTFOLIO_REQUIRED"
  | "PORTFOLIO_UNSEALED"
  | "RELATIONSHIP_ANALYSIS_REQUIRED"
  | "RELATIONSHIP_ANALYSIS_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "REPLAY_SCOPE_VALID"
  | "REPLAY_SCOPE_INVALID"
  | "PORTFOLIO_ID_PRESENT"
  | "PORTFOLIO_ID_MISSING"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "COMPOSITION_RECONSTRUCTED"
  | "COMPOSITION_EVIDENCE_MISSING"
  | "RELATIONSHIPS_RECONSTRUCTED"
  | "RELATIONSHIP_EVIDENCE_MISSING"
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
  | "RECOMMENDATION_SCORING_BLOCKED"
  | "RECOMMENDATION_SCORING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "PORTFOLIO_SIZE_VALID"
  | "PORTFOLIO_SIZE_EXCEEDED"
  | "RELATIONSHIP_LIMIT_VALID"
  | "RELATIONSHIP_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "PORTFOLIO_REPLAY_IS_NOT_CONTROL";

export type PortfolioReplayEvidencePath = Readonly<{
  scope: PortfolioReplayScope;
  portfolioReferences: readonly string[];
  relationshipReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type PortfolioReplayInput = Readonly<{
  request: PortfolioReplayRequest;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  observability: SealedPortfolioObservabilityRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  recommendationScoringRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type PortfolioReplayValidation = Readonly<{
  valid: boolean;
  replayState: PortfolioReplayResult["replayState"];
  reasonCodes: readonly PortfolioReplayReasonCode[];
  compositionReconstructed: boolean;
  relationshipsReconstructed: boolean;
  evidenceReconstructed: boolean;
  governanceReconstructed: boolean;
  observabilityReconstructed: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  relationshipCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type PortfolioReplayObservability = Readonly<{
  portfolioId: string;
  replayState: PortfolioReplayResult["replayState"];
  compositionReconstructed: boolean;
  relationshipsReconstructed: boolean;
  evidenceReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedPortfolioReplayRecord = Readonly<{
  result: Readonly<PortfolioReplayResult>;
  evidencePath: PortfolioReplayEvidencePath;
  validation: PortfolioReplayValidation;
  observability: PortfolioReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  recommendationScoringAllowed: false;
  recommendationApprovalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface PortfolioCertificationRequest {
  portfolioId: string;
  tenantId: string;
  certificationScope:
    | "INTEGRITY"
    | "OWNERSHIP"
    | "REPLAY"
    | "GOVERNANCE"
    | "FULL";
  graphVersion: string;
}

export interface PortfolioCertificationResult {
  portfolioId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  integrityCertified: boolean;
  ownershipCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type PortfolioCertificationScope = PortfolioCertificationRequest["certificationScope"];

export type PortfolioCertificationReasonCode =
  | "PORTFOLIO_REQUIRED"
  | "PORTFOLIO_UNSEALED"
  | "RELATIONSHIP_ANALYSIS_REQUIRED"
  | "RELATIONSHIP_ANALYSIS_UNSEALED"
  | "OBSERVABILITY_REQUIRED"
  | "OBSERVABILITY_UNSEALED"
  | "REPLAY_REQUIRED"
  | "REPLAY_UNSEALED"
  | "CERTIFICATION_SCOPE_VALID"
  | "CERTIFICATION_SCOPE_INVALID"
  | "PORTFOLIO_ID_PRESENT"
  | "PORTFOLIO_ID_MISSING"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_CERTIFICATION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "INTEGRITY_CERTIFIED"
  | "INTEGRITY_BROKEN"
  | "REPLAY_CERTIFIED"
  | "REPLAY_DEGRADED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "GOVERNANCE_CERTIFIED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "OBSERVABILITY_CERTIFIED"
  | "OBSERVABILITY_INCOMPLETE"
  | "LINEAGE_CERTIFIED"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "RECOMMENDATION_RANKING_BLOCKED"
  | "RECOMMENDATION_RANKING_DETECTED"
  | "RECOMMENDATION_PRIORITIZATION_BLOCKED"
  | "RECOMMENDATION_PRIORITIZATION_DETECTED"
  | "RECOMMENDATION_SCORING_BLOCKED"
  | "RECOMMENDATION_SCORING_DETECTED"
  | "RECOMMENDATION_APPROVAL_BLOCKED"
  | "RECOMMENDATION_APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "PORTFOLIO_SIZE_VALID"
  | "PORTFOLIO_SIZE_EXCEEDED"
  | "RELATIONSHIP_LIMIT_VALID"
  | "RELATIONSHIP_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "PORTFOLIO_CERTIFICATION_IS_NOT_CONTROL";

export type PortfolioCertificationEvidencePath = Readonly<{
  scope: PortfolioCertificationScope;
  portfolioReferences: readonly string[];
  relationshipReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type PortfolioCertificationInput = Readonly<{
  request: PortfolioCertificationRequest;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  observability: SealedPortfolioObservabilityRecord;
  replay: SealedPortfolioReplayRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  recommendationRankingRequested?: boolean;
  recommendationPrioritizationRequested?: boolean;
  recommendationScoringRequested?: boolean;
  recommendationApprovalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type PortfolioCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: PortfolioCertificationResult["certificationState"];
  reasonCodes: readonly PortfolioCertificationReasonCode[];
  integrityCertified: boolean;
  ownershipCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  lineageCertified: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: true;
  relationshipCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type PortfolioCertificationObservability = Readonly<{
  portfolioId: string;
  certificationState: PortfolioCertificationResult["certificationState"];
  integrityCertified: boolean;
  ownershipCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  certificationHash: string;
}>;

export type SealedPortfolioCertificationRecord = Readonly<{
  result: Readonly<PortfolioCertificationResult>;
  evidencePath: PortfolioCertificationEvidencePath;
  validation: PortfolioCertificationValidation;
  observability: PortfolioCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  recommendationRankingAllowed: false;
  recommendationPrioritizationAllowed: false;
  recommendationScoringAllowed: false;
  recommendationApprovalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
