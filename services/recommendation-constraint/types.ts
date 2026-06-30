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
import type {
  SealedOpportunityCertificationRecord,
  SealedRecommendationOpportunityFoundationRecord,
  SealedOpportunityReplayRecord,
} from "@/services/recommendation-opportunity";
import type { SealedRecommendationCertificationRecord, SealedRecommendationObservabilityCertificationRecord } from "@/services/recommendation-ledger";
import type { SealedGovernanceBindingCertificationRecord } from "@/services/recommendation-governance";
import type { SealedStrategicReadinessCertificationRecord } from "@/services/strategic-readiness";

export type RecommendationConstraintType =
  | "GOVERNANCE_CONSTRAINT"
  | "DEPENDENCY_CONSTRAINT"
  | "RESOURCE_CONSTRAINT"
  | "TRUST_CONSTRAINT"
  | "RESILIENCE_CONSTRAINT"
  | "READINESS_CONSTRAINT"
  | "PORTFOLIO_CONSTRAINT"
  | "RISK_CONSTRAINT";

export type RecommendationConstraintState =
  | "ACTIVE"
  | "CONDITIONAL"
  | "LIMITED"
  | "BLOCKING"
  | "UNKNOWN";

export interface RecommendationConstraint {
  constraintId: string;
  recommendationId: string;
  constraintType: RecommendationConstraintType;
  evidenceReference: string;
  governanceReference: string;
  lineageReference: string;
  replayReference: string;
  constraintState: RecommendationConstraintState;
  constraintHash: string;
}

export interface RecommendationConstraintFoundationRequest {
  tenantId: string;
  recommendationIds: string[];
  constraintScope:
    | "GOVERNANCE"
    | "DEPENDENCY"
    | "RESOURCE"
    | "TRUST"
    | "RESILIENCE"
    | "READINESS"
    | "PORTFOLIO"
    | "RISK"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationConstraintFoundationResult {
  tenantId: string;
  constraintState: RecommendationConstraintState;
  constraintsCreated: number;
  governanceConstraintsDetected: number;
  dependencyConstraintsDetected: number;
  resourceConstraintsDetected: number;
  trustConstraintsDetected: number;
  resilienceConstraintsDetected: number;
  readinessConstraintsDetected: number;
  portfolioConstraintsDetected: number;
  riskConstraintsDetected: number;
  tenantIsolationVerified: boolean;
  constraintGraphHash: string;
  deterministic: boolean;
}

export type RecommendationConstraintScope = RecommendationConstraintFoundationRequest["constraintScope"];

export type RecommendationConstraintFoundationReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "CONSTRAINT_SCOPE_VALID"
  | "CONSTRAINT_SCOPE_INVALID"
  | "OPPORTUNITY_FOUNDATION_REQUIRED"
  | "OPPORTUNITY_FOUNDATION_UNSEALED"
  | "OPPORTUNITY_REPLAY_REQUIRED"
  | "OPPORTUNITY_REPLAY_UNSEALED"
  | "OPPORTUNITY_CERTIFICATION_REQUIRED"
  | "OPPORTUNITY_CERTIFICATION_UNSEALED"
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
  | "CROSS_TENANT_CONSTRAINT_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "CONSTRAINT_EVIDENCE_PRESENT"
  | "CONSTRAINT_EVIDENCE_MISSING"
  | "GOVERNANCE_REFERENCES_PRESENT"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_CONSTRAINT_ACTIVE"
  | "GOVERNANCE_CONSTRAINT_CONDITIONAL"
  | "GOVERNANCE_CONSTRAINT_LIMITED"
  | "GOVERNANCE_CONSTRAINT_BLOCKING"
  | "GOVERNANCE_CONSTRAINT_UNKNOWN"
  | "DEPENDENCY_CONSTRAINT_ACTIVE"
  | "DEPENDENCY_CONSTRAINT_CONDITIONAL"
  | "DEPENDENCY_CONSTRAINT_LIMITED"
  | "DEPENDENCY_CONSTRAINT_BLOCKING"
  | "DEPENDENCY_CONSTRAINT_UNKNOWN"
  | "RESOURCE_CONSTRAINT_ACTIVE"
  | "RESOURCE_CONSTRAINT_CONDITIONAL"
  | "RESOURCE_CONSTRAINT_LIMITED"
  | "RESOURCE_CONSTRAINT_BLOCKING"
  | "RESOURCE_CONSTRAINT_UNKNOWN"
  | "TRUST_CONSTRAINT_ACTIVE"
  | "TRUST_CONSTRAINT_CONDITIONAL"
  | "TRUST_CONSTRAINT_LIMITED"
  | "TRUST_CONSTRAINT_BLOCKING"
  | "TRUST_CONSTRAINT_UNKNOWN"
  | "RESILIENCE_CONSTRAINT_ACTIVE"
  | "RESILIENCE_CONSTRAINT_CONDITIONAL"
  | "RESILIENCE_CONSTRAINT_LIMITED"
  | "RESILIENCE_CONSTRAINT_BLOCKING"
  | "RESILIENCE_CONSTRAINT_UNKNOWN"
  | "READINESS_CONSTRAINT_ACTIVE"
  | "READINESS_CONSTRAINT_CONDITIONAL"
  | "READINESS_CONSTRAINT_LIMITED"
  | "READINESS_CONSTRAINT_BLOCKING"
  | "READINESS_CONSTRAINT_UNKNOWN"
  | "PORTFOLIO_CONSTRAINT_ACTIVE"
  | "PORTFOLIO_CONSTRAINT_CONDITIONAL"
  | "PORTFOLIO_CONSTRAINT_LIMITED"
  | "PORTFOLIO_CONSTRAINT_BLOCKING"
  | "PORTFOLIO_CONSTRAINT_UNKNOWN"
  | "RISK_CONSTRAINT_ACTIVE"
  | "RISK_CONSTRAINT_CONDITIONAL"
  | "RISK_CONSTRAINT_LIMITED"
  | "RISK_CONSTRAINT_BLOCKING"
  | "RISK_CONSTRAINT_UNKNOWN"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "BOUNDED_CONSTRAINT_LIMITATIONS_DETECTED"
  | "CONSTRAINT_EVIDENCE_GAPS_DETECTED"
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
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CONSTRAINT_MUTATION_BLOCKED"
  | "CONSTRAINT_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "CONSTRAINT_RECORD_LIMIT_VALID"
  | "CONSTRAINT_RECORD_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_CONSTRAINT_FOUNDATION_IS_NOT_CONTROL";

export type RecommendationConstraintEvidencePath = Readonly<{
  scope: RecommendationConstraintScope;
  constraintReferences: readonly string[];
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  opportunityReferences: readonly string[];
  dependencyRiskReferences: readonly string[];
  dependencyReferences: readonly string[];
  impactReferences: readonly string[];
  trustReferences: readonly string[];
  resilienceReferences: readonly string[];
  readinessReferences: readonly string[];
  portfolioReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationConstraintFoundationInput = Readonly<{
  request: RecommendationConstraintFoundationRequest;
  opportunityFoundation: SealedRecommendationOpportunityFoundationRecord;
  opportunityReplay: SealedOpportunityReplayRecord;
  opportunityCertification: SealedOpportunityCertificationRecord;
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
  constraintMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  recommendationScoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationConstraintFoundationValidation = Readonly<{
  valid: boolean;
  constraintState: RecommendationConstraintState;
  reasonCodes: readonly RecommendationConstraintFoundationReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  controlSurfaceAbsent: boolean;
  constraintsCreated: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
  governanceReferenceCount: number;
}>;

export type RecommendationConstraintFoundationObservability = Readonly<{
  tenantId: string;
  constraintState: RecommendationConstraintState;
  constraintsCreated: number;
  governanceConstraintsDetected: number;
  dependencyConstraintsDetected: number;
  resourceConstraintsDetected: number;
  trustConstraintsDetected: number;
  resilienceConstraintsDetected: number;
  readinessConstraintsDetected: number;
  portfolioConstraintsDetected: number;
  riskConstraintsDetected: number;
  constraintGraphHash: string;
}>;

export type SealedRecommendationConstraintFoundationRecord = Readonly<{
  result: Readonly<RecommendationConstraintFoundationResult>;
  constraints: readonly RecommendationConstraint[];
  evidencePath: RecommendationConstraintEvidencePath;
  validation: RecommendationConstraintFoundationValidation;
  observability: RecommendationConstraintFoundationObservability;
  sealed: true;
  readOnly: true;
  constraintOnly: true;
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

export type ConstraintAnalysisScope =
  | "SEVERITY"
  | "CONCENTRATION"
  | "PROPAGATION"
  | "GAPS"
  | "CONFLICTS"
  | "FULL";

export type ConstraintAnalysisState =
  | "ANALYZED"
  | "LIMITED"
  | "OBSERVE"
  | "INVALID";

export type ConstraintSeverityLevel =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL"
  | "BLOCKING";

export type ConstraintConcentrationType =
  | "HIGH_CONSTRAINT_CLUSTER"
  | "GOVERNANCE_CONSTRAINT_CONCENTRATION"
  | "DEPENDENCY_CONSTRAINT_CONCENTRATION"
  | "RESOURCE_CONSTRAINT_CONCENTRATION"
  | "TRUST_CONSTRAINT_CONCENTRATION"
  | "RESILIENCE_CONSTRAINT_CONCENTRATION"
  | "RISK_CONSTRAINT_CONCENTRATION";

export type ConstraintPropagationType =
  | "CONSTRAINT_PROPAGATION_PATH"
  | "GOVERNANCE_RESTRICTION_PROPAGATION"
  | "DEPENDENCY_LIMITATION_PROPAGATION"
  | "RESOURCE_LIMITATION_PROPAGATION"
  | "TRUST_LIMITATION_PROPAGATION"
  | "RESILIENCE_LIMITATION_PROPAGATION"
  | "RISK_PROPAGATION";

export type ConstraintGapType =
  | "MISSING_CONSTRAINT_EVIDENCE"
  | "MISSING_GOVERNANCE_REFERENCES"
  | "MISSING_LINEAGE_REFERENCES"
  | "MISSING_REPLAY_REFERENCES"
  | "MISSING_READINESS_EVIDENCE"
  | "MISSING_TRUST_EVIDENCE"
  | "MISSING_RESILIENCE_EVIDENCE";

export type ConstraintConflictType =
  | "GOVERNANCE_CONFLICT"
  | "DEPENDENCY_CONFLICT"
  | "RESOURCE_CONFLICT"
  | "TRUST_CONFLICT"
  | "RESILIENCE_CONFLICT"
  | "PORTFOLIO_CONFLICT"
  | "RISK_CONFLICT"
  | "AUTHORITY_BOUNDARY_CONFLICT";

export interface ConstraintAnalysisRequest {
  tenantId: string;
  recommendationIds: string[];
  analysisScope: ConstraintAnalysisScope;
  graphVersion: string;
}

export interface ConstraintSeverityRecord {
  severityId: string;
  constraintId: string;
  recommendationId: string;
  constraintType: RecommendationConstraintType;
  severity: ConstraintSeverityLevel;
  severityHash: string;
}

export interface ConstraintConcentration {
  concentrationId: string;
  recommendationId: string;
  constraintType: RecommendationConstraintType | "PORTFOLIO";
  concentrationType: ConstraintConcentrationType;
  concentrationHash: string;
}

export interface ConstraintPropagation {
  propagationId: string;
  constraintId: string;
  recommendationId: string;
  constraintType: RecommendationConstraintType;
  propagationType: ConstraintPropagationType;
  propagationReference: string;
  propagationHash: string;
}

export interface ConstraintGap {
  gapId: string;
  constraintId: string;
  recommendationId: string;
  constraintType: RecommendationConstraintType | "FOUNDATION";
  gapType: ConstraintGapType;
  gapHash: string;
}

export interface ConstraintConflict {
  conflictId: string;
  constraintId: string;
  recommendationId: string;
  constraintType: RecommendationConstraintType | "FOUNDATION";
  conflictType: ConstraintConflictType;
  conflictHash: string;
}

export interface ConstraintAnalysisResult {
  tenantId: string;
  analysisState: ConstraintAnalysisState;
  constraintSeveritiesDetected: number;
  constraintConcentrationsDetected: number;
  constraintPropagationsDetected: number;
  constraintGapsDetected: number;
  constraintConflictsDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type ConstraintAnalysisReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_CONSTRAINT_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "CONSTRAINT_EVIDENCE_PRESENT"
  | "CONSTRAINT_EVIDENCE_MISSING"
  | "GOVERNANCE_REFERENCES_PRESENT"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "READINESS_REFERENCES_PRESENT"
  | "READINESS_REFERENCES_MISSING"
  | "SEVERITIES_ANALYZED"
  | "SEVERITIES_LIMITED"
  | "CONCENTRATIONS_ANALYZED"
  | "CONCENTRATIONS_LIMITED"
  | "PROPAGATIONS_ANALYZED"
  | "PROPAGATIONS_LIMITED"
  | "CONSTRAINT_GAPS_DETECTED"
  | "CONSTRAINT_GAPS_ABSENT"
  | "CONSTRAINT_CONFLICTS_DETECTED"
  | "CONSTRAINT_CONFLICTS_ABSENT"
  | "GOVERNANCE_CONTINUITY_PRESERVED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CONTINUITY_PRESERVED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_ABSENT"
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
  | "CONSTRAINT_RECORD_LIMIT_VALID"
  | "CONSTRAINT_RECORD_LIMIT_EXCEEDED"
  | "CONSTRAINT_CONFLICT_LIMIT_VALID"
  | "CONSTRAINT_CONFLICT_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "CONSTRAINT_ANALYSIS_IS_NOT_CONTROL";

export type ConstraintAnalysisEvidencePath = Readonly<{
  scope: ConstraintAnalysisScope;
  constraintReferences: readonly string[];
  severityReferences: readonly string[];
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

export type ConstraintAnalysisInput = Readonly<{
  request: ConstraintAnalysisRequest;
  foundation: SealedRecommendationConstraintFoundationRecord;
  opportunityFoundation: SealedRecommendationOpportunityFoundationRecord;
  opportunityReplay: SealedOpportunityReplayRecord;
  opportunityCertification: SealedOpportunityCertificationRecord;
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

export type ConstraintAnalysisValidation = Readonly<{
  valid: boolean;
  analysisState: ConstraintAnalysisState;
  reasonCodes: readonly ConstraintAnalysisReasonCode[];
  constraintSeveritiesDetected: number;
  constraintConcentrationsDetected: number;
  constraintPropagationsDetected: number;
  constraintGapsDetected: number;
  constraintConflictsDetected: number;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalImpossible: boolean;
  prioritizationAbsent: boolean;
  rankingAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type ConstraintAnalysisObservability = Readonly<{
  tenantId: string;
  analysisState: ConstraintAnalysisState;
  constraintSeveritiesDetected: number;
  constraintConcentrationsDetected: number;
  constraintPropagationsDetected: number;
  constraintGapsDetected: number;
  constraintConflictsDetected: number;
  analysisHash: string;
}>;

export type SealedConstraintAnalysisRecord = Readonly<{
  result: Readonly<ConstraintAnalysisResult>;
  severities: readonly ConstraintSeverityRecord[];
  concentrations: readonly ConstraintConcentration[];
  propagations: readonly ConstraintPropagation[];
  gaps: readonly ConstraintGap[];
  conflicts: readonly ConstraintConflict[];
  evidencePath: ConstraintAnalysisEvidencePath;
  validation: ConstraintAnalysisValidation;
  observability: ConstraintAnalysisObservability;
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

export interface ConstraintObservabilityRequest {
  tenantId: string;
  observabilityScope:
    | "SUMMARY"
    | "SEVERITY"
    | "PROPAGATION"
    | "CONFLICTS"
    | "LINEAGE"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface ConstraintObservabilityResult {
  tenantId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  constraintGraphVisible: boolean;
  constraintSeverityVisible: boolean;
  constraintPropagationVisible: boolean;
  constraintLineageVisible: boolean;
  constraintGovernanceVisible: boolean;
  constraintReplayVisible: boolean;
  constraintAuditVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type ConstraintObservabilityScope = ConstraintObservabilityRequest["observabilityScope"];

export type ConstraintObservabilityReasonCode =
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
  | "CONSTRAINT_GRAPH_VISIBLE"
  | "CONSTRAINT_GRAPH_VISIBILITY_INCOMPLETE"
  | "CONSTRAINT_SEVERITY_VISIBLE"
  | "CONSTRAINT_SEVERITY_VISIBILITY_INCOMPLETE"
  | "CONSTRAINT_PROPAGATION_VISIBLE"
  | "CONSTRAINT_PROPAGATION_VISIBILITY_INCOMPLETE"
  | "CONSTRAINT_CONFLICTS_VISIBLE"
  | "CONSTRAINT_CONFLICT_VISIBILITY_INCOMPLETE"
  | "CONSTRAINT_GAPS_VISIBLE"
  | "CONSTRAINT_GAP_VISIBILITY_INCOMPLETE"
  | "CONSTRAINT_LINEAGE_VISIBLE"
  | "CONSTRAINT_LINEAGE_VISIBILITY_INCOMPLETE"
  | "CONSTRAINT_REPLAY_VISIBLE"
  | "CONSTRAINT_REPLAY_VISIBILITY_MISSING"
  | "CONSTRAINT_GOVERNANCE_VISIBLE"
  | "CONSTRAINT_GOVERNANCE_VISIBILITY_MISSING"
  | "CONSTRAINT_AUDIT_VISIBLE"
  | "CONSTRAINT_AUDIT_VISIBILITY_INCOMPLETE"
  | "VISIBILITY_EVIDENCE_COMPLETE"
  | "VISIBILITY_EVIDENCE_MISSING"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "CONSTRAINT_RECORD_LIMIT_VALID"
  | "CONSTRAINT_RECORD_LIMIT_EXCEEDED"
  | "VISIBLE_PROPAGATION_LIMIT_VALID"
  | "VISIBLE_PROPAGATION_LIMIT_EXCEEDED"
  | "VISIBLE_CONFLICT_LIMIT_VALID"
  | "VISIBLE_CONFLICT_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "CONSTRAINT_OBSERVABILITY_IS_NOT_CONTROL";

export type ConstraintObservabilityEvidencePath = Readonly<{
  scope: ConstraintObservabilityScope;
  constraintReferences: readonly string[];
  severityReferences: readonly string[];
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

export type ConstraintObservabilityInput = Readonly<{
  request: ConstraintObservabilityRequest;
  foundation: SealedRecommendationConstraintFoundationRecord;
  analysis: SealedConstraintAnalysisRecord;
  opportunityFoundation: SealedRecommendationOpportunityFoundationRecord;
  opportunityCertification: SealedOpportunityCertificationRecord;
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
  recommendationScoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ConstraintObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: ConstraintObservabilityResult["observabilityState"];
  reasonCodes: readonly ConstraintObservabilityReasonCode[];
  constraintGraphVisible: boolean;
  constraintSeverityVisible: boolean;
  constraintPropagationVisible: boolean;
  constraintConcentrationsVisible: boolean;
  constraintGapsVisible: boolean;
  constraintConflictsVisible: boolean;
  constraintLineageVisible: boolean;
  constraintGovernanceVisible: boolean;
  constraintReplayVisible: boolean;
  constraintAuditVisible: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  prioritizationAbsent: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  visiblePropagationCount: number;
  visibleConflictCount: number;
  visibleReplayReferenceCount: number;
}>;

export type ConstraintObservabilityObservability = Readonly<{
  tenantId: string;
  observabilityState: ConstraintObservabilityResult["observabilityState"];
  constraintGraphVisible: boolean;
  constraintSeverityVisible: boolean;
  constraintPropagationVisible: boolean;
  constraintLineageVisible: boolean;
  constraintGovernanceVisible: boolean;
  constraintReplayVisible: boolean;
  constraintAuditVisible: boolean;
  observabilityHash: string;
}>;

export type SealedConstraintObservabilityRecord = Readonly<{
  result: Readonly<ConstraintObservabilityResult>;
  evidencePath: ConstraintObservabilityEvidencePath;
  validation: ConstraintObservabilityValidation;
  observability: ConstraintObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
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

export interface ConstraintReplayRequest {
  tenantId: string;
  replayScope:
    | "CONSTRAINT"
    | "SEVERITY"
    | "PROPAGATION"
    | "CONFLICTS"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface ConstraintReplayResult {
  tenantId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  constraintReconstructed: boolean;
  severityReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type ConstraintReplayScope = ConstraintReplayRequest["replayScope"];

export type ConstraintReplayReasonCode =
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
  | "OPPORTUNITY_REPLAY_REQUIRED"
  | "OPPORTUNITY_REPLAY_UNSEALED"
  | "OPPORTUNITY_CERTIFICATION_REQUIRED"
  | "OPPORTUNITY_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_RISK_REPLAY_REQUIRED"
  | "DEPENDENCY_RISK_REPLAY_UNSEALED"
  | "DEPENDENCY_RISK_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_RISK_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_REPLAY_REQUIRED"
  | "DEPENDENCY_REPLAY_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "IMPACT_REPLAY_REQUIRED"
  | "IMPACT_REPLAY_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "TRUST_REPLAY_REQUIRED"
  | "TRUST_REPLAY_UNSEALED"
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_REPLAY_REQUIRED"
  | "DRIFT_REPLAY_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "RESILIENCE_REPLAY_REQUIRED"
  | "RESILIENCE_REPLAY_UNSEALED"
  | "RESILIENCE_CERTIFICATION_REQUIRED"
  | "RESILIENCE_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_REPLAY_REQUIRED"
  | "PORTFOLIO_REPLAY_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "CONSTRAINT_RECONSTRUCTED"
  | "CONSTRAINT_EVIDENCE_MISSING"
  | "SEVERITY_RECONSTRUCTED"
  | "SEVERITY_RECONSTRUCTION_BROKEN"
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
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "CONSTRAINT_RECORD_LIMIT_VALID"
  | "CONSTRAINT_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "CONSTRAINT_REPLAY_IS_NOT_CONTROL";

export type ConstraintReplayEvidencePath = Readonly<{
  scope: ConstraintReplayScope;
  constraintReferences: readonly string[];
  severityReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ConstraintReplayInput = Readonly<{
  request: ConstraintReplayRequest;
  foundation: SealedRecommendationConstraintFoundationRecord;
  analysis: SealedConstraintAnalysisRecord;
  observability: SealedConstraintObservabilityRecord;
  opportunityReplay: SealedOpportunityReplayRecord;
  opportunityCertification: SealedOpportunityCertificationRecord;
  dependencyRiskReplay: SealedDependencyRiskReplayRecord;
  dependencyRiskCertification: SealedDependencyRiskCertificationRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  impactReplay: SealedImpactReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceReplay: SealedResilienceReplayRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  recommendationScoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ConstraintReplayValidation = Readonly<{
  valid: boolean;
  replayState: ConstraintReplayResult["replayState"];
  reasonCodes: readonly ConstraintReplayReasonCode[];
  constraintReconstructed: boolean;
  severityReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  observabilityReconstructed: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  prioritizationAbsent: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
  governanceReferenceCount: number;
}>;

export type ConstraintReplayObservability = Readonly<{
  tenantId: string;
  replayState: ConstraintReplayResult["replayState"];
  constraintReconstructed: boolean;
  severityReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedConstraintReplayRecord = Readonly<{
  result: Readonly<ConstraintReplayResult>;
  evidencePath: ConstraintReplayEvidencePath;
  validation: ConstraintReplayValidation;
  observability: ConstraintReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
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

export interface ConstraintCertificationRequest {
  tenantId: string;
  certificationScope:
    | "INTEGRITY"
    | "SEVERITY"
    | "PROPAGATION"
    | "REPLAY"
    | "GOVERNANCE"
    | "FULL";
  graphVersion: string;
}

export interface ConstraintCertificationResult {
  tenantId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  integrityCertified: boolean;
  severityCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  evidenceCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type ConstraintCertificationScope = ConstraintCertificationRequest["certificationScope"];

export type ConstraintCertificationReasonCode =
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
  | "OPPORTUNITY_CERTIFICATION_REQUIRED"
  | "OPPORTUNITY_CERTIFICATION_UNSEALED"
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
  | "READINESS_CERTIFICATION_REQUIRED"
  | "READINESS_CERTIFICATION_UNSEALED"
  | "GOVERNANCE_CERTIFICATION_REQUIRED"
  | "GOVERNANCE_CERTIFICATION_UNSEALED"
  | "RECOMMENDATION_CERTIFICATION_REQUIRED"
  | "RECOMMENDATION_CERTIFICATION_UNSEALED"
  | "RECOMMENDATION_OBSERVABILITY_CERTIFICATION_REQUIRED"
  | "RECOMMENDATION_OBSERVABILITY_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_CERTIFICATION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "INTEGRITY_CERTIFIED"
  | "INTEGRITY_BROKEN"
  | "SEVERITY_CERTIFIED"
  | "SEVERITY_CLASSIFICATION_BROKEN"
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
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "CONSTRAINT_RECORD_LIMIT_VALID"
  | "CONSTRAINT_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "EVIDENCE_REFERENCE_LIMIT_VALID"
  | "EVIDENCE_REFERENCE_LIMIT_EXCEEDED"
  | "CONSTRAINT_CERTIFICATION_IS_NOT_CONTROL";

export type ConstraintCertificationEvidencePath = Readonly<{
  scope: ConstraintCertificationScope;
  constraintReferences: readonly string[];
  severityReferences: readonly string[];
  propagationReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ConstraintCertificationInput = Readonly<{
  request: ConstraintCertificationRequest;
  foundation: SealedRecommendationConstraintFoundationRecord;
  analysis: SealedConstraintAnalysisRecord;
  observability: SealedConstraintObservabilityRecord;
  replay: SealedConstraintReplayRecord;
  opportunityCertification: SealedOpportunityCertificationRecord;
  dependencyRiskCertification: SealedDependencyRiskCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  readinessCertification: SealedStrategicReadinessCertificationRecord;
  governanceCertification: SealedGovernanceBindingCertificationRecord;
  recommendationCertification: SealedRecommendationCertificationRecord;
  recommendationObservabilityCertification: SealedRecommendationObservabilityCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  recommendationScoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ConstraintCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: ConstraintCertificationResult["certificationState"];
  reasonCodes: readonly ConstraintCertificationReasonCode[];
  integrityCertified: boolean;
  severityCertified: boolean;
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
  prioritizationAbsent: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
  evidenceReferenceCount: number;
}>;

export type ConstraintCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: ConstraintCertificationResult["certificationState"];
  integrityCertified: boolean;
  severityCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  evidenceCertified: boolean;
  certificationHash: string;
}>;

export type SealedConstraintCertificationRecord = Readonly<{
  result: Readonly<ConstraintCertificationResult>;
  evidencePath: ConstraintCertificationEvidencePath;
  validation: ConstraintCertificationValidation;
  observability: ConstraintCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
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
