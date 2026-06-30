import type {
  SealedDependencyCertificationRecord,
  SealedRecommendationDependencyFoundationRecord,
  SealedDependencyReplayRecord,
} from "@/services/recommendation-dependency";
import type {
  SealedDependencyRiskCertificationRecord,
  SealedDependencyRiskFoundationRecord,
  SealedDependencyRiskReplayRecord,
} from "@/services/recommendation-dependency-risk";
import type {
  SealedDriftCertificationRecord,
  SealedRecommendationDriftFoundationRecord,
  SealedDriftReplayRecord,
} from "@/services/recommendation-drift";
import type {
  SealedImpactCertificationRecord,
  SealedRecommendationImpactFoundationRecord,
  SealedImpactReplayRecord,
} from "@/services/recommendation-impact";
import type {
  RecommendationPortfolioBundle,
  SealedPortfolioCertificationRecord,
  SealedRecommendationPortfolioRecord,
  SealedPortfolioRelationshipAnalysisRecord,
  SealedPortfolioReplayRecord,
} from "@/services/recommendation-portfolio";
import type {
  SealedRecommendationResilienceFoundationRecord,
  SealedResilienceCertificationRecord,
  SealedResilienceReplayRecord,
} from "@/services/recommendation-resilience";
import type {
  SealedRecommendationTrustFoundationRecord,
  SealedTrustCertificationRecord,
  SealedTrustReplayRecord,
} from "@/services/recommendation-trust";

export type RecommendationOpportunityType =
  | "GOVERNANCE_OPPORTUNITY"
  | "DEPENDENCY_OPPORTUNITY"
  | "IMPACT_OPPORTUNITY"
  | "PORTFOLIO_OPPORTUNITY"
  | "TRUST_OPPORTUNITY"
  | "RESILIENCE_OPPORTUNITY"
  | "READINESS_OPPORTUNITY";

export type RecommendationOpportunityState =
  | "SUPPORTED"
  | "CONDITIONALLY_SUPPORTED"
  | "LIMITED"
  | "UNSUPPORTED"
  | "UNKNOWN";

export interface RecommendationOpportunity {
  opportunityId: string;
  recommendationId: string;
  opportunityType: RecommendationOpportunityType;
  evidenceReference: string;
  governanceReference: string;
  lineageReference: string;
  replayReference: string;
  opportunityState: RecommendationOpportunityState;
  opportunityHash: string;
}

export interface RecommendationOpportunityFoundationRequest {
  tenantId: string;
  recommendationIds: string[];
  opportunityScope:
    | "GOVERNANCE"
    | "DEPENDENCY"
    | "IMPACT"
    | "PORTFOLIO"
    | "TRUST"
    | "RESILIENCE"
    | "READINESS"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationOpportunityFoundationResult {
  tenantId: string;
  opportunityState: RecommendationOpportunityState;
  opportunitiesCreated: number;
  governanceOpportunitiesDetected: number;
  dependencyOpportunitiesDetected: number;
  impactOpportunitiesDetected: number;
  portfolioOpportunitiesDetected: number;
  trustOpportunitiesDetected: number;
  resilienceOpportunitiesDetected: number;
  readinessOpportunitiesDetected: number;
  tenantIsolationVerified: boolean;
  opportunityGraphHash: string;
  deterministic: boolean;
}

export type RecommendationOpportunityScope = RecommendationOpportunityFoundationRequest["opportunityScope"];

export type RecommendationOpportunityFoundationReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "OPPORTUNITY_SCOPE_VALID"
  | "OPPORTUNITY_SCOPE_INVALID"
  | "DEPENDENCY_RISK_FOUNDATION_REQUIRED"
  | "DEPENDENCY_RISK_FOUNDATION_UNSEALED"
  | "DEPENDENCY_RISK_REPLAY_REQUIRED"
  | "DEPENDENCY_RISK_REPLAY_UNSEALED"
  | "DEPENDENCY_RISK_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_RISK_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_FOUNDATION_REQUIRED"
  | "DEPENDENCY_FOUNDATION_UNSEALED"
  | "DEPENDENCY_REPLAY_REQUIRED"
  | "DEPENDENCY_REPLAY_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "IMPACT_FOUNDATION_REQUIRED"
  | "IMPACT_FOUNDATION_UNSEALED"
  | "IMPACT_REPLAY_REQUIRED"
  | "IMPACT_REPLAY_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "TRUST_FOUNDATION_REQUIRED"
  | "TRUST_FOUNDATION_UNSEALED"
  | "TRUST_REPLAY_REQUIRED"
  | "TRUST_REPLAY_UNSEALED"
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_FOUNDATION_REQUIRED"
  | "DRIFT_FOUNDATION_UNSEALED"
  | "DRIFT_REPLAY_REQUIRED"
  | "DRIFT_REPLAY_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "RESILIENCE_FOUNDATION_REQUIRED"
  | "RESILIENCE_FOUNDATION_UNSEALED"
  | "RESILIENCE_REPLAY_REQUIRED"
  | "RESILIENCE_REPLAY_UNSEALED"
  | "RESILIENCE_CERTIFICATION_REQUIRED"
  | "RESILIENCE_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_REQUIRED"
  | "PORTFOLIO_UNSEALED"
  | "PORTFOLIO_ANALYSIS_REQUIRED"
  | "PORTFOLIO_ANALYSIS_UNSEALED"
  | "PORTFOLIO_REPLAY_REQUIRED"
  | "PORTFOLIO_REPLAY_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_OPPORTUNITY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_OPPORTUNITY_SUPPORTED"
  | "GOVERNANCE_OPPORTUNITY_CONDITIONAL"
  | "GOVERNANCE_OPPORTUNITY_LIMITED"
  | "GOVERNANCE_OPPORTUNITY_UNSUPPORTED"
  | "DEPENDENCY_OPPORTUNITY_SUPPORTED"
  | "DEPENDENCY_OPPORTUNITY_CONDITIONAL"
  | "DEPENDENCY_OPPORTUNITY_LIMITED"
  | "DEPENDENCY_OPPORTUNITY_UNSUPPORTED"
  | "IMPACT_OPPORTUNITY_SUPPORTED"
  | "IMPACT_OPPORTUNITY_CONDITIONAL"
  | "IMPACT_OPPORTUNITY_LIMITED"
  | "IMPACT_OPPORTUNITY_UNSUPPORTED"
  | "PORTFOLIO_OPPORTUNITY_SUPPORTED"
  | "PORTFOLIO_OPPORTUNITY_CONDITIONAL"
  | "PORTFOLIO_OPPORTUNITY_LIMITED"
  | "PORTFOLIO_OPPORTUNITY_UNSUPPORTED"
  | "TRUST_OPPORTUNITY_SUPPORTED"
  | "TRUST_OPPORTUNITY_CONDITIONAL"
  | "TRUST_OPPORTUNITY_LIMITED"
  | "TRUST_OPPORTUNITY_UNSUPPORTED"
  | "RESILIENCE_OPPORTUNITY_SUPPORTED"
  | "RESILIENCE_OPPORTUNITY_CONDITIONAL"
  | "RESILIENCE_OPPORTUNITY_LIMITED"
  | "RESILIENCE_OPPORTUNITY_UNSUPPORTED"
  | "READINESS_OPPORTUNITY_SUPPORTED"
  | "READINESS_OPPORTUNITY_CONDITIONAL"
  | "READINESS_OPPORTUNITY_LIMITED"
  | "READINESS_OPPORTUNITY_UNSUPPORTED"
  | "OPPORTUNITY_EVIDENCE_PRESENT"
  | "OPPORTUNITY_EVIDENCE_MISSING"
  | "GOVERNANCE_REFERENCES_PRESENT"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "BOUNDED_OPPORTUNITY_LIMITATIONS_DETECTED"
  | "OPPORTUNITY_EVIDENCE_GAPS_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "RANKING_BLOCKED"
  | "RANKING_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OPPORTUNITY_MUTATION_BLOCKED"
  | "OPPORTUNITY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "OPPORTUNITY_RECORD_LIMIT_VALID"
  | "OPPORTUNITY_RECORD_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_OPPORTUNITY_FOUNDATION_IS_NOT_CONTROL";

export type RecommendationOpportunityEvidencePath = Readonly<{
  scope: RecommendationOpportunityScope;
  opportunityReferences: readonly string[];
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  dependencyRiskReferences: readonly string[];
  dependencyReferences: readonly string[];
  impactReferences: readonly string[];
  portfolioReferences: readonly string[];
  trustReferences: readonly string[];
  resilienceReferences: readonly string[];
  readinessReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationOpportunityFoundationInput = Readonly<{
  request: RecommendationOpportunityFoundationRequest;
  dependencyRiskFoundation: SealedDependencyRiskFoundationRecord;
  dependencyRiskReplay: SealedDependencyRiskReplayRecord;
  dependencyRiskCertification: SealedDependencyRiskCertificationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactReplay: SealedImpactReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
  trustFoundation: SealedRecommendationTrustFoundationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceFoundation: SealedRecommendationResilienceFoundationRecord;
  resilienceReplay: SealedResilienceReplayRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  opportunityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  recommendationScoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationOpportunityFoundationValidation = Readonly<{
  valid: boolean;
  opportunityState: RecommendationOpportunityFoundationResult["opportunityState"];
  reasonCodes: readonly RecommendationOpportunityFoundationReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  controlSurfaceAbsent: boolean;
  opportunitiesCreated: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
  governanceReferenceCount: number;
}>;

export type RecommendationOpportunityFoundationObservability = Readonly<{
  tenantId: string;
  opportunityState: RecommendationOpportunityFoundationResult["opportunityState"];
  opportunitiesCreated: number;
  governanceOpportunitiesDetected: number;
  dependencyOpportunitiesDetected: number;
  impactOpportunitiesDetected: number;
  portfolioOpportunitiesDetected: number;
  trustOpportunitiesDetected: number;
  resilienceOpportunitiesDetected: number;
  readinessOpportunitiesDetected: number;
  opportunityGraphHash: string;
}>;

export type SealedRecommendationOpportunityFoundationRecord = Readonly<{
  result: Readonly<RecommendationOpportunityFoundationResult>;
  opportunities: readonly RecommendationOpportunity[];
  evidencePath: RecommendationOpportunityEvidencePath;
  validation: RecommendationOpportunityFoundationValidation;
  observability: RecommendationOpportunityFoundationObservability;
  sealed: true;
  readOnly: true;
  opportunityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  recommendationScoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type OpportunityAnalysisScope =
  | "STRENGTH"
  | "CONCENTRATION"
  | "PROPAGATION"
  | "GAPS"
  | "CONFLICTS"
  | "FULL";

export type OpportunityAnalysisState =
  | "ANALYZED"
  | "LIMITED"
  | "OBSERVE"
  | "INVALID";

export type OpportunityStrengthState =
  | "STRONG"
  | "MODERATE"
  | "WEAK"
  | "CONSTRAINED"
  | "UNSUPPORTED";

export type OpportunityConcentrationType =
  | "HIGH_OPPORTUNITY_CLUSTER"
  | "GOVERNANCE_OPPORTUNITY_CONCENTRATION"
  | "DEPENDENCY_OPPORTUNITY_CONCENTRATION"
  | "IMPACT_OPPORTUNITY_CONCENTRATION"
  | "PORTFOLIO_OPPORTUNITY_CONCENTRATION"
  | "TRUST_OPPORTUNITY_CONCENTRATION"
  | "RESILIENCE_OPPORTUNITY_CONCENTRATION";

export type OpportunityPropagationType =
  | "OPPORTUNITY_PROPAGATION_PATH"
  | "GOVERNANCE_SUPPORT_PROPAGATION"
  | "DEPENDENCY_STABILITY_PROPAGATION"
  | "IMPACT_LEVERAGE_PROPAGATION"
  | "PORTFOLIO_OPPORTUNITY_PROPAGATION"
  | "READINESS_OPPORTUNITY_PROPAGATION";

export type OpportunityGapType =
  | "MISSING_OPPORTUNITY_EVIDENCE"
  | "MISSING_GOVERNANCE_SUPPORT"
  | "MISSING_REPLAY_REFERENCES"
  | "MISSING_LINEAGE_REFERENCES"
  | "MISSING_READINESS_EVIDENCE"
  | "MISSING_TRUST_SUPPORT"
  | "MISSING_RESILIENCE_SUPPORT";

export type OpportunityConflictType =
  | "GOVERNANCE_OPPORTUNITY_CONFLICT"
  | "DEPENDENCY_OPPORTUNITY_CONFLICT"
  | "IMPACT_OPPORTUNITY_CONFLICT"
  | "PORTFOLIO_OPPORTUNITY_CONFLICT"
  | "TRUST_OPPORTUNITY_CONFLICT"
  | "RESILIENCE_OPPORTUNITY_CONFLICT"
  | "AUTHORITY_BOUNDARY_CONFLICT";

export interface OpportunityAnalysisRequest {
  tenantId: string;
  recommendationIds: string[];
  analysisScope: OpportunityAnalysisScope;
  graphVersion: string;
}

export interface OpportunityStrength {
  strengthId: string;
  opportunityId: string;
  recommendationId: string;
  opportunityType: RecommendationOpportunityType;
  strength: OpportunityStrengthState;
  strengthHash: string;
}

export interface OpportunityConcentration {
  concentrationId: string;
  recommendationId: string;
  opportunityType: RecommendationOpportunityType | "PORTFOLIO";
  concentrationType: OpportunityConcentrationType;
  concentrationHash: string;
}

export interface OpportunityPropagation {
  propagationId: string;
  opportunityId: string;
  recommendationId: string;
  opportunityType: RecommendationOpportunityType;
  propagationType: OpportunityPropagationType;
  propagationReference: string;
  propagationHash: string;
}

export interface OpportunityGap {
  gapId: string;
  opportunityId: string;
  recommendationId: string;
  opportunityType: RecommendationOpportunityType | "FOUNDATION";
  gapType: OpportunityGapType;
  gapHash: string;
}

export interface OpportunityConflict {
  conflictId: string;
  opportunityId: string;
  recommendationId: string;
  opportunityType: RecommendationOpportunityType;
  conflictType: OpportunityConflictType;
  conflictHash: string;
}

export interface OpportunityAnalysisResult {
  tenantId: string;
  analysisState: OpportunityAnalysisState;
  opportunityStrengthsDetected: number;
  opportunityConcentrationsDetected: number;
  opportunityPropagationsDetected: number;
  opportunityGapsDetected: number;
  opportunityConflictsDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type OpportunityAnalysisReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_OPPORTUNITY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "OPPORTUNITY_EVIDENCE_PRESENT"
  | "OPPORTUNITY_EVIDENCE_MISSING"
  | "OPPORTUNITY_REFERENCES_PRESENT"
  | "OPPORTUNITY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_PRESENT"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "READINESS_REFERENCES_PRESENT"
  | "READINESS_REFERENCES_MISSING"
  | "STRENGTHS_ANALYZED"
  | "STRENGTHS_LIMITED"
  | "CONCENTRATIONS_ANALYZED"
  | "CONCENTRATIONS_LIMITED"
  | "PROPAGATIONS_ANALYZED"
  | "PROPAGATIONS_LIMITED"
  | "OPPORTUNITY_GAPS_DETECTED"
  | "OPPORTUNITY_GAPS_ABSENT"
  | "OPPORTUNITY_CONFLICTS_DETECTED"
  | "OPPORTUNITY_CONFLICTS_ABSENT"
  | "GOVERNANCE_CONTINUITY_PRESERVED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CONTINUITY_PRESERVED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "APPROVAL_IMPOSSIBLE"
  | "APPROVAL_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ANALYSIS_MUTATION_BLOCKED"
  | "ANALYSIS_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "OPPORTUNITY_RECORD_LIMIT_VALID"
  | "OPPORTUNITY_RECORD_LIMIT_EXCEEDED"
  | "OPPORTUNITY_CONFLICT_LIMIT_VALID"
  | "OPPORTUNITY_CONFLICT_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "OPPORTUNITY_ANALYSIS_IS_NOT_CONTROL";

export type OpportunityAnalysisEvidencePath = Readonly<{
  scope: OpportunityAnalysisScope;
  opportunityReferences: readonly string[];
  strengthReferences: readonly string[];
  concentrationReferences: readonly string[];
  propagationReferences: readonly string[];
  gapReferences: readonly string[];
  conflictReferences: readonly string[];
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  readinessReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type OpportunityAnalysisInput = Readonly<{
  request: OpportunityAnalysisRequest;
  foundation: SealedRecommendationOpportunityFoundationRecord;
  dependencyRiskFoundation: SealedDependencyRiskFoundationRecord;
  dependencyRiskReplay: SealedDependencyRiskReplayRecord;
  dependencyRiskCertification: SealedDependencyRiskCertificationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactReplay: SealedImpactReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
  trustFoundation: SealedRecommendationTrustFoundationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceFoundation: SealedRecommendationResilienceFoundationRecord;
  resilienceReplay: SealedResilienceReplayRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  analysisMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  recommendationScoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type OpportunityAnalysisValidation = Readonly<{
  valid: boolean;
  analysisState: OpportunityAnalysisState;
  reasonCodes: readonly OpportunityAnalysisReasonCode[];
  opportunityStrengthsDetected: number;
  opportunityConcentrationsDetected: number;
  opportunityPropagationsDetected: number;
  opportunityGapsDetected: number;
  opportunityConflictsDetected: number;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalImpossible: boolean;
  rankingAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type OpportunityAnalysisObservability = Readonly<{
  tenantId: string;
  analysisState: OpportunityAnalysisState;
  opportunityStrengthsDetected: number;
  opportunityConcentrationsDetected: number;
  opportunityPropagationsDetected: number;
  opportunityGapsDetected: number;
  opportunityConflictsDetected: number;
  analysisHash: string;
}>;

export type SealedOpportunityAnalysisRecord = Readonly<{
  result: Readonly<OpportunityAnalysisResult>;
  strengths: readonly OpportunityStrength[];
  concentrations: readonly OpportunityConcentration[];
  propagations: readonly OpportunityPropagation[];
  gaps: readonly OpportunityGap[];
  conflicts: readonly OpportunityConflict[];
  evidencePath: OpportunityAnalysisEvidencePath;
  validation: OpportunityAnalysisValidation;
  observability: OpportunityAnalysisObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  recommendationScoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type OpportunityObservabilityScope =
  | "SUMMARY"
  | "STRENGTH"
  | "PROPAGATION"
  | "CONFLICTS"
  | "LINEAGE"
  | "REPLAY"
  | "FULL";

export type OpportunityObservabilityState =
  | "VISIBLE"
  | "LIMITED"
  | "OBSERVE"
  | "INVALID";

export interface OpportunityObservabilityRequest {
  tenantId: string;
  observabilityScope: OpportunityObservabilityScope;
  graphVersion: string;
}

export interface OpportunityObservabilityResult {
  tenantId: string;
  observabilityState: OpportunityObservabilityState;
  opportunityGraphVisible: boolean;
  opportunityStrengthVisible: boolean;
  opportunityPropagationVisible: boolean;
  opportunityLineageVisible: boolean;
  opportunityGovernanceVisible: boolean;
  opportunityReplayVisible: boolean;
  opportunityAuditVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type OpportunityObservabilityReasonCode =
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
  | "OPPORTUNITY_GRAPH_VISIBLE"
  | "OPPORTUNITY_GRAPH_VISIBILITY_INCOMPLETE"
  | "OPPORTUNITY_STRENGTH_VISIBLE"
  | "OPPORTUNITY_STRENGTH_VISIBILITY_INCOMPLETE"
  | "OPPORTUNITY_PROPAGATION_VISIBLE"
  | "OPPORTUNITY_PROPAGATION_VISIBILITY_INCOMPLETE"
  | "OPPORTUNITY_CONFLICTS_VISIBLE"
  | "OPPORTUNITY_CONFLICT_VISIBILITY_INCOMPLETE"
  | "OPPORTUNITY_GAPS_VISIBLE"
  | "OPPORTUNITY_GAP_VISIBILITY_INCOMPLETE"
  | "OPPORTUNITY_LINEAGE_VISIBLE"
  | "OPPORTUNITY_LINEAGE_VISIBILITY_INCOMPLETE"
  | "OPPORTUNITY_REPLAY_VISIBLE"
  | "OPPORTUNITY_REPLAY_VISIBILITY_MISSING"
  | "OPPORTUNITY_GOVERNANCE_VISIBLE"
  | "OPPORTUNITY_GOVERNANCE_VISIBILITY_MISSING"
  | "OPPORTUNITY_AUDIT_VISIBLE"
  | "OPPORTUNITY_AUDIT_VISIBILITY_INCOMPLETE"
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
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "OPPORTUNITY_RECORD_LIMIT_VALID"
  | "OPPORTUNITY_RECORD_LIMIT_EXCEEDED"
  | "VISIBLE_PROPAGATION_LIMIT_VALID"
  | "VISIBLE_PROPAGATION_LIMIT_EXCEEDED"
  | "VISIBLE_CONFLICT_LIMIT_VALID"
  | "VISIBLE_CONFLICT_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "OPPORTUNITY_OBSERVABILITY_IS_NOT_CONTROL";

export type OpportunityObservabilityEvidencePath = Readonly<{
  scope: OpportunityObservabilityScope;
  opportunityReferences: readonly string[];
  strengthReferences: readonly string[];
  propagationReferences: readonly string[];
  concentrationReferences: readonly string[];
  gapReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type OpportunityObservabilityInput = Readonly<{
  request: OpportunityObservabilityRequest;
  foundation: SealedRecommendationOpportunityFoundationRecord;
  analysis: SealedOpportunityAnalysisRecord;
  dependencyRiskFoundation: SealedDependencyRiskFoundationRecord;
  dependencyRiskCertification: SealedDependencyRiskCertificationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactCertification: SealedImpactCertificationRecord;
  trustFoundation: SealedRecommendationTrustFoundationRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceFoundation: SealedRecommendationResilienceFoundationRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  observabilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type OpportunityObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: OpportunityObservabilityState;
  reasonCodes: readonly OpportunityObservabilityReasonCode[];
  opportunityGraphVisible: boolean;
  opportunityStrengthVisible: boolean;
  opportunityPropagationVisible: boolean;
  opportunityLineageVisible: boolean;
  opportunityGovernanceVisible: boolean;
  opportunityReplayVisible: boolean;
  opportunityAuditVisible: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  visiblePropagationCount: number;
  visibleConflictCount: number;
  visibleReplayReferenceCount: number;
}>;

export type OpportunityObservabilityObservability = Readonly<{
  tenantId: string;
  observabilityState: OpportunityObservabilityState;
  opportunityGraphVisible: boolean;
  opportunityStrengthVisible: boolean;
  opportunityPropagationVisible: boolean;
  opportunityLineageVisible: boolean;
  opportunityGovernanceVisible: boolean;
  opportunityReplayVisible: boolean;
  opportunityAuditVisible: boolean;
  observabilityHash: string;
}>;

export type SealedOpportunityObservabilityRecord = Readonly<{
  result: Readonly<OpportunityObservabilityResult>;
  evidencePath: OpportunityObservabilityEvidencePath;
  validation: OpportunityObservabilityValidation;
  observability: OpportunityObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type OpportunityReplayScope =
  | "OPPORTUNITY"
  | "STRENGTH"
  | "PROPAGATION"
  | "CONFLICTS"
  | "FULL";

export type OpportunityReplayState =
  | "REPLAYABLE"
  | "LIMITED"
  | "ESCALATED"
  | "INVALID";

export interface OpportunityReplayRequest {
  tenantId: string;
  replayScope: OpportunityReplayScope;
  replayVersion: string;
  graphVersion: string;
}

export interface OpportunityReplayResult {
  tenantId: string;
  replayState: OpportunityReplayState;
  opportunityReconstructed: boolean;
  strengthReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type OpportunityReplayReasonCode =
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
  | "OPPORTUNITY_RECONSTRUCTED"
  | "OPPORTUNITY_EVIDENCE_MISSING"
  | "STRENGTH_RECONSTRUCTED"
  | "STRENGTH_RECONSTRUCTION_BROKEN"
  | "EVIDENCE_RECONSTRUCTED"
  | "REPLAY_ARTIFACTS_MISSING"
  | "PROPAGATION_RECONSTRUCTED"
  | "PROPAGATION_MISMATCH_DETECTED"
  | "CONFLICTS_RECONSTRUCTED"
  | "CONFLICT_RECONSTRUCTION_BROKEN"
  | "GOVERNANCE_RECONSTRUCTED"
  | "GOVERNANCE_DEGRADATION_SURFACED"
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
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "OPPORTUNITY_RECORD_LIMIT_VALID"
  | "OPPORTUNITY_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "OPPORTUNITY_REPLAY_IS_NOT_CONTROL";

export type OpportunityReplayEvidencePath = Readonly<{
  scope: OpportunityReplayScope;
  opportunityReferences: readonly string[];
  strengthReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type OpportunityReplayInput = Readonly<{
  request: OpportunityReplayRequest;
  foundation: SealedRecommendationOpportunityFoundationRecord;
  analysis: SealedOpportunityAnalysisRecord;
  observability: SealedOpportunityObservabilityRecord;
  dependencyRiskFoundation: SealedDependencyRiskFoundationRecord;
  dependencyRiskCertification: SealedDependencyRiskCertificationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactCertification: SealedImpactCertificationRecord;
  trustFoundation: SealedRecommendationTrustFoundationRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceFoundation: SealedRecommendationResilienceFoundationRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type OpportunityReplayValidation = Readonly<{
  valid: boolean;
  replayState: OpportunityReplayState;
  reasonCodes: readonly OpportunityReplayReasonCode[];
  opportunityReconstructed: boolean;
  strengthReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  observabilityReconstructed: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
  governanceReferenceCount: number;
}>;

export type OpportunityReplayObservability = Readonly<{
  tenantId: string;
  replayState: OpportunityReplayState;
  opportunityReconstructed: boolean;
  strengthReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedOpportunityReplayRecord = Readonly<{
  result: Readonly<OpportunityReplayResult>;
  evidencePath: OpportunityReplayEvidencePath;
  validation: OpportunityReplayValidation;
  observability: OpportunityReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type OpportunityCertificationScope =
  | "INTEGRITY"
  | "STRENGTH"
  | "PROPAGATION"
  | "REPLAY"
  | "GOVERNANCE"
  | "FULL";

export type OpportunityCertificationState =
  | "PASS"
  | "CONDITIONAL_PASS"
  | "FAIL";

export interface OpportunityCertificationRequest {
  tenantId: string;
  certificationScope: OpportunityCertificationScope;
  graphVersion: string;
}

export interface OpportunityCertificationResult {
  tenantId: string;
  certificationState: OpportunityCertificationState;
  integrityCertified: boolean;
  strengthCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  evidenceCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type OpportunityCertificationReasonCode =
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
  | "DEPENDENCY_RISK_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_RISK_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "RESILIENCE_CERTIFICATION_REQUIRED"
  | "RESILIENCE_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_CERTIFICATION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "INTEGRITY_CERTIFIED"
  | "INTEGRITY_BROKEN"
  | "STRENGTH_CERTIFIED"
  | "STRENGTH_CLASSIFICATION_BROKEN"
  | "PROPAGATION_CERTIFIED"
  | "PROPAGATION_BROKEN"
  | "REPLAY_CERTIFIED"
  | "REPLAY_DEGRADED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "GOVERNANCE_CERTIFIED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "OBSERVABILITY_CERTIFIED"
  | "OBSERVABILITY_INCOMPLETE"
  | "EVIDENCE_CERTIFIED"
  | "EVIDENCE_DEGRADED"
  | "EVIDENCE_CONTINUITY_BROKEN"
  | "LINEAGE_CERTIFIED"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "OPPORTUNITY_RECORD_LIMIT_VALID"
  | "OPPORTUNITY_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "EVIDENCE_REFERENCE_LIMIT_VALID"
  | "EVIDENCE_REFERENCE_LIMIT_EXCEEDED"
  | "OPPORTUNITY_CERTIFICATION_IS_NOT_CONTROL";

export type OpportunityCertificationEvidencePath = Readonly<{
  scope: OpportunityCertificationScope;
  opportunityReferences: readonly string[];
  strengthReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type OpportunityCertificationInput = Readonly<{
  request: OpportunityCertificationRequest;
  foundation: SealedRecommendationOpportunityFoundationRecord;
  analysis: SealedOpportunityAnalysisRecord;
  observability: SealedOpportunityObservabilityRecord;
  replay: SealedOpportunityReplayRecord;
  dependencyRiskCertification: SealedDependencyRiskCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type OpportunityCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: OpportunityCertificationState;
  reasonCodes: readonly OpportunityCertificationReasonCode[];
  integrityCertified: boolean;
  strengthCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  evidenceCertified: boolean;
  lineageCertified: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
  evidenceReferenceCount: number;
}>;

export type OpportunityCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: OpportunityCertificationState;
  integrityCertified: boolean;
  strengthCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  evidenceCertified: boolean;
  certificationHash: string;
}>;

export type SealedOpportunityCertificationRecord = Readonly<{
  result: Readonly<OpportunityCertificationResult>;
  evidencePath: OpportunityCertificationEvidencePath;
  validation: OpportunityCertificationValidation;
  observability: OpportunityCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
