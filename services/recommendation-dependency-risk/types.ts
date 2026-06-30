import type {
  SealedDependencyAnalysisRecord,
  SealedDependencyCertificationRecord,
  SealedDependencyReplayRecord,
  SealedRecommendationDependencyFoundationRecord,
} from "@/services/recommendation-dependency";
import type {
  SealedImpactAnalysisRecord,
  SealedImpactCertificationRecord,
  SealedImpactReplayRecord,
  SealedRecommendationImpactFoundationRecord,
} from "@/services/recommendation-impact";
import type {
  SealedDriftAnalysisRecord,
  SealedDriftCertificationRecord,
  SealedDriftReplayRecord,
  SealedRecommendationDriftFoundationRecord,
} from "@/services/recommendation-drift";
import type {
  SealedResilienceAnalysisRecord,
  SealedRecommendationResilienceFoundationRecord,
  SealedResilienceCertificationRecord,
  SealedResilienceReplayRecord,
} from "@/services/recommendation-resilience";
import type {
  SealedPortfolioRelationshipAnalysisRecord,
  SealedPortfolioReplayRecord,
  SealedRecommendationPortfolioRecord,
  RecommendationPortfolioBundle,
  SealedPortfolioCertificationRecord,
} from "@/services/recommendation-portfolio";
import type {
  SealedTrustAnalysisRecord,
  SealedRecommendationTrustFoundationRecord,
  SealedTrustCertificationRecord,
  SealedTrustReplayRecord,
} from "@/services/recommendation-trust";

export type DependencyRiskType =
  | "DEPENDENCY_CONCENTRATION_RISK"
  | "DEPENDENCY_FAILURE_RISK"
  | "DEPENDENCY_PROPAGATION_RISK"
  | "DEPENDENCY_FRAGILITY_RISK"
  | "DEPENDENCY_AVAILABILITY_RISK"
  | "DEPENDENCY_REPLAY_RISK"
  | "DEPENDENCY_GOVERNANCE_RISK"
  | "DEPENDENCY_TRUST_RISK"
  | "DEPENDENCY_DRIFT_RISK"
  | "DEPENDENCY_RESILIENCE_RISK";

export type DependencyRiskState =
  | "LOW"
  | "MODERATE"
  | "HIGH"
  | "CRITICAL"
  | "UNKNOWN";

export interface RecommendationDependencyRisk {
  dependencyRiskId: string;
  recommendationId: string;
  dependencyId: string;
  riskType: DependencyRiskType;
  baselineReference: string;
  dependencyReference: string;
  riskState: DependencyRiskState;
  dependencyRiskHash: string;
}

export interface DependencyRiskFoundationRequest {
  tenantId: string;
  recommendationIds: string[];
  riskScope:
    | "CONCENTRATION"
    | "FAILURE"
    | "PROPAGATION"
    | "FRAGILITY"
    | "AVAILABILITY"
    | "REPLAY"
    | "GOVERNANCE"
    | "TRUST"
    | "DRIFT"
    | "RESILIENCE"
    | "FULL";
  graphVersion: string;
}

export interface DependencyRiskFoundationResult {
  tenantId: string;
  dependencyRiskState: DependencyRiskState;
  dependencyRiskRecordsCreated: number;
  concentrationRisksDetected: number;
  failureRisksDetected: number;
  propagationRisksDetected: number;
  fragilityRisksDetected: number;
  availabilityRisksDetected: number;
  replayRisksDetected: number;
  governanceRisksDetected: number;
  trustRisksDetected: number;
  driftRisksDetected: number;
  resilienceRisksDetected: number;
  tenantIsolationVerified: boolean;
  dependencyRiskGraphHash: string;
  deterministic: boolean;
}

export type DependencyRiskScope = DependencyRiskFoundationRequest["riskScope"];

export type DependencyRiskFoundationReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "RISK_SCOPE_VALID"
  | "RISK_SCOPE_INVALID"
  | "DEPENDENCY_FOUNDATION_REQUIRED"
  | "DEPENDENCY_FOUNDATION_UNSEALED"
  | "DEPENDENCY_REPLAY_REQUIRED"
  | "DEPENDENCY_REPLAY_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
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
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_DEPENDENCY_RISK_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "DEPENDENCY_EVIDENCE_PRESENT"
  | "DEPENDENCY_EVIDENCE_MISSING"
  | "GOVERNANCE_EVIDENCE_PRESENT"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "REPLAY_EVIDENCE_PRESENT"
  | "REPLAY_EVIDENCE_MISSING"
  | "CONCENTRATION_RISK_LOW"
  | "CONCENTRATION_RISK_MODERATE"
  | "CONCENTRATION_RISK_HIGH"
  | "FAILURE_RISK_LOW"
  | "FAILURE_RISK_HIGH"
  | "FAILURE_RISK_CRITICAL"
  | "PROPAGATION_RISK_LOW"
  | "PROPAGATION_RISK_MODERATE"
  | "PROPAGATION_RISK_HIGH"
  | "FRAGILITY_RISK_LOW"
  | "FRAGILITY_RISK_HIGH"
  | "FRAGILITY_RISK_CRITICAL"
  | "AVAILABILITY_RISK_LOW"
  | "AVAILABILITY_RISK_MODERATE"
  | "AVAILABILITY_RISK_HIGH"
  | "REPLAY_RISK_LOW"
  | "REPLAY_RISK_HIGH"
  | "REPLAY_RISK_CRITICAL"
  | "GOVERNANCE_RISK_LOW"
  | "GOVERNANCE_RISK_MODERATE"
  | "GOVERNANCE_RISK_CRITICAL"
  | "TRUST_RISK_LOW"
  | "TRUST_RISK_MODERATE"
  | "TRUST_RISK_HIGH"
  | "TRUST_RISK_CRITICAL"
  | "DRIFT_RISK_LOW"
  | "DRIFT_RISK_MODERATE"
  | "DRIFT_RISK_HIGH"
  | "RESILIENCE_RISK_LOW"
  | "RESILIENCE_RISK_MODERATE"
  | "RESILIENCE_RISK_HIGH"
  | "RESILIENCE_RISK_CRITICAL"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "BOUNDED_DEPENDENCY_RISK_DETECTED"
  | "MULTIPLE_DEPENDENCY_RISK_DOMAINS_TRIGGERED"
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
  | "REMEDIATION_ABSENT"
  | "REMEDIATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "DEPENDENCY_RISK_MUTATION_BLOCKED"
  | "DEPENDENCY_RISK_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "DEPENDENCY_RISK_RECORD_LIMIT_VALID"
  | "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED"
  | "DEPENDENCY_REFERENCE_LIMIT_VALID"
  | "DEPENDENCY_REFERENCE_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "DEPENDENCY_RISK_FOUNDATION_IS_NOT_CONTROL";

export type DependencyRiskEvidencePath = Readonly<{
  scope: DependencyRiskScope;
  dependencyRiskReferences: readonly string[];
  baselineReferences: readonly string[];
  dependencyReferences: readonly string[];
  propagationReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  trustReferences: readonly string[];
  driftReferences: readonly string[];
  resilienceReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DependencyRiskFoundationInput = Readonly<{
  request: DependencyRiskFoundationRequest;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  trustFoundation: SealedRecommendationTrustFoundationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceFoundation: SealedRecommendationResilienceFoundationRecord;
  resilienceReplay: SealedResilienceReplayRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  dependencyRiskMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  remediationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyRiskFoundationValidation = Readonly<{
  valid: boolean;
  dependencyRiskState: DependencyRiskFoundationResult["dependencyRiskState"];
  reasonCodes: readonly DependencyRiskFoundationReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  remediationAbsent: boolean;
  controlSurfaceAbsent: boolean;
  dependencyRiskRecordsCreated: number;
  dependencyReferenceCount: number;
  propagationReferenceCount: number;
  replayReferenceCount: number;
}>;

export type DependencyRiskFoundationObservability = Readonly<{
  tenantId: string;
  dependencyRiskState: DependencyRiskFoundationResult["dependencyRiskState"];
  dependencyRiskRecordsCreated: number;
  concentrationRisksDetected: number;
  failureRisksDetected: number;
  propagationRisksDetected: number;
  fragilityRisksDetected: number;
  availabilityRisksDetected: number;
  replayRisksDetected: number;
  governanceRisksDetected: number;
  trustRisksDetected: number;
  driftRisksDetected: number;
  resilienceRisksDetected: number;
  dependencyRiskGraphHash: string;
}>;

export type SealedDependencyRiskFoundationRecord = Readonly<{
  result: Readonly<DependencyRiskFoundationResult>;
  risks: readonly RecommendationDependencyRisk[];
  evidencePath: DependencyRiskEvidencePath;
  validation: DependencyRiskFoundationValidation;
  observability: DependencyRiskFoundationObservability;
  sealed: true;
  readOnly: true;
  riskOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  remediationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DependencyRiskAnalysisRequest {
  tenantId: string;
  recommendationIds: string[];
  analysisScope:
    | "SEVERITY"
    | "CONCENTRATION"
    | "PROPAGATION"
    | "GAPS"
    | "CONFLICTS"
    | "FULL";
  graphVersion: string;
}

export interface DependencyRiskAnalysisResult {
  tenantId: string;
  analysisState:
    | "ANALYZED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  riskSeveritiesDetected: number;
  riskConcentrationsDetected: number;
  riskPropagationsDetected: number;
  riskGapsDetected: number;
  riskConflictsDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type DependencyRiskAnalysisScope = DependencyRiskAnalysisRequest["analysisScope"];

export type DependencyRiskSeverity = Readonly<{
  severityId: string;
  recommendationId: string;
  dependencyId: string;
  severity: DependencyRiskState;
  severityHash: string;
}>;

export type DependencyRiskConcentration = Readonly<{
  concentrationId: string;
  recommendationId: string;
  dependencyId: string;
  concentrationType:
    | "SINGLE_DEPENDENCY_OVER_RELIANCE"
    | "SHARED_DEPENDENCY_CONCENTRATION"
    | "CLUSTER_CONCENTRATION_EXPOSURE"
    | "PORTFOLIO_DEPENDENCY_CONCENTRATION";
  concentrationHash: string;
}>;

export type DependencyRiskPropagation = Readonly<{
  propagationId: string;
  recommendationId: string;
  dependencyId: string;
  propagationType:
    | "FAILURE_PROPAGATION_PATH"
    | "DEPENDENCY_CHAIN_AMPLIFICATION"
    | "IMPACT_PROPAGATION_EXPOSURE"
    | "CROSS_RELATIONSHIP_RISK_SPREAD"
    | "CASCADING_DEPENDENCY_EFFECT";
  propagationReference: string;
  propagationHash: string;
}>;

export type DependencyRiskGap = Readonly<{
  gapId: string;
  recommendationId: string;
  dependencyId: string;
  gapType:
    | "MISSING_DEPENDENCY_EVIDENCE"
    | "MISSING_REPLAY_EVIDENCE"
    | "MISSING_GOVERNANCE_EVIDENCE"
    | "MISSING_TRUST_EVIDENCE"
    | "MISSING_RESILIENCE_EVIDENCE"
    | "MISSING_DRIFT_EVIDENCE";
  gapHash: string;
}>;

export type DependencyRiskConflict = Readonly<{
  conflictId: string;
  recommendationId: string;
  dependencyId: string;
  conflictType:
    | "GOVERNANCE_RISK_CONFLICT"
    | "REPLAY_RISK_CONFLICT"
    | "TRUST_RISK_CONFLICT"
    | "DRIFT_RISK_CONFLICT"
    | "RESILIENCE_RISK_CONFLICT"
    | "AUTHORITY_BOUNDARY_CONFLICT";
  conflictHash: string;
}>;

export type DependencyRiskAnalysisReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "DEPENDENCY_FOUNDATION_REQUIRED"
  | "DEPENDENCY_FOUNDATION_UNSEALED"
  | "DEPENDENCY_ANALYSIS_REQUIRED"
  | "DEPENDENCY_ANALYSIS_UNSEALED"
  | "DEPENDENCY_REPLAY_REQUIRED"
  | "DEPENDENCY_REPLAY_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "TRUST_FOUNDATION_REQUIRED"
  | "TRUST_FOUNDATION_UNSEALED"
  | "TRUST_ANALYSIS_REQUIRED"
  | "TRUST_ANALYSIS_UNSEALED"
  | "TRUST_REPLAY_REQUIRED"
  | "TRUST_REPLAY_UNSEALED"
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_FOUNDATION_REQUIRED"
  | "DRIFT_FOUNDATION_UNSEALED"
  | "DRIFT_ANALYSIS_REQUIRED"
  | "DRIFT_ANALYSIS_UNSEALED"
  | "DRIFT_REPLAY_REQUIRED"
  | "DRIFT_REPLAY_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "RESILIENCE_FOUNDATION_REQUIRED"
  | "RESILIENCE_FOUNDATION_UNSEALED"
  | "RESILIENCE_ANALYSIS_REQUIRED"
  | "RESILIENCE_ANALYSIS_UNSEALED"
  | "RESILIENCE_REPLAY_REQUIRED"
  | "RESILIENCE_REPLAY_UNSEALED"
  | "RESILIENCE_CERTIFICATION_REQUIRED"
  | "RESILIENCE_CERTIFICATION_UNSEALED"
  | "IMPACT_FOUNDATION_REQUIRED"
  | "IMPACT_FOUNDATION_UNSEALED"
  | "IMPACT_ANALYSIS_REQUIRED"
  | "IMPACT_ANALYSIS_UNSEALED"
  | "IMPACT_REPLAY_REQUIRED"
  | "IMPACT_REPLAY_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
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
  | "CROSS_TENANT_DEPENDENCY_RISK_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "RISK_SEVERITY_ANALYZED"
  | "RISK_SEVERITY_LIMITED"
  | "RISK_CONCENTRATION_ANALYZED"
  | "RISK_CONCENTRATION_LIMITED"
  | "RISK_PROPAGATION_ANALYZED"
  | "RISK_PROPAGATION_LIMITED"
  | "RISK_GAPS_DETECTED"
  | "RISK_GAPS_ABSENT"
  | "RISK_CONFLICTS_DETECTED"
  | "RISK_CONFLICTS_ABSENT"
  | "GOVERNANCE_CONTINUITY_PRESERVED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CONTINUITY_PRESERVED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "RISK_EVIDENCE_PRESENT"
  | "RISK_EVIDENCE_MISSING"
  | "DEPENDENCY_REFERENCES_PRESENT"
  | "DEPENDENCY_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "GOVERNANCE_REFERENCES_PRESENT"
  | "GOVERNANCE_REFERENCES_MISSING"
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
  | "REMEDIATION_ABSENT"
  | "REMEDIATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ANALYSIS_MUTATION_BLOCKED"
  | "ANALYSIS_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "DEPENDENCY_RISK_RECORD_LIMIT_VALID"
  | "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED"
  | "DEPENDENCY_REFERENCE_LIMIT_VALID"
  | "DEPENDENCY_REFERENCE_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "DEPENDENCY_RISK_ANALYSIS_IS_NOT_CONTROL";

export type DependencyRiskAnalysisEvidencePath = Readonly<{
  scope: DependencyRiskAnalysisScope;
  dependencyRiskReferences: readonly string[];
  severityReferences: readonly string[];
  concentrationReferences: readonly string[];
  propagationReferences: readonly string[];
  gapReferences: readonly string[];
  conflictReferences: readonly string[];
  dependencyReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DependencyRiskAnalysisInput = Readonly<{
  request: DependencyRiskAnalysisRequest;
  foundation: SealedDependencyRiskFoundationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyAnalysis: SealedDependencyAnalysisRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  trustFoundation: SealedRecommendationTrustFoundationRecord;
  trustAnalysis: SealedTrustAnalysisRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftAnalysis: SealedDriftAnalysisRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceFoundation: SealedRecommendationResilienceFoundationRecord;
  resilienceAnalysis: SealedResilienceAnalysisRecord;
  resilienceReplay: SealedResilienceReplayRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactAnalysis: SealedImpactAnalysisRecord;
  impactReplay: SealedImpactReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
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
  remediationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyRiskAnalysisValidation = Readonly<{
  valid: boolean;
  analysisState: DependencyRiskAnalysisResult["analysisState"];
  reasonCodes: readonly DependencyRiskAnalysisReasonCode[];
  riskSeveritiesDetected: number;
  riskConcentrationsDetected: number;
  riskPropagationsDetected: number;
  riskGapsDetected: number;
  riskConflictsDetected: number;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  remediationAbsent: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type DependencyRiskAnalysisObservability = Readonly<{
  tenantId: string;
  analysisState: DependencyRiskAnalysisResult["analysisState"];
  riskSeveritiesDetected: number;
  riskConcentrationsDetected: number;
  riskPropagationsDetected: number;
  riskGapsDetected: number;
  riskConflictsDetected: number;
  analysisHash: string;
}>;

export type SealedDependencyRiskAnalysisRecord = Readonly<{
  result: Readonly<DependencyRiskAnalysisResult>;
  severities: readonly DependencyRiskSeverity[];
  concentrations: readonly DependencyRiskConcentration[];
  propagations: readonly DependencyRiskPropagation[];
  gaps: readonly DependencyRiskGap[];
  conflicts: readonly DependencyRiskConflict[];
  evidencePath: DependencyRiskAnalysisEvidencePath;
  validation: DependencyRiskAnalysisValidation;
  observability: DependencyRiskAnalysisObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  remediationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DependencyRiskObservabilityRequest {
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

export interface DependencyRiskObservabilityResult {
  tenantId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  dependencyRiskGraphVisible: boolean;
  severityVisible: boolean;
  propagationVisible: boolean;
  lineageVisible: boolean;
  governanceVisible: boolean;
  replayVisible: boolean;
  auditVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type DependencyRiskObservabilityScope = DependencyRiskObservabilityRequest["observabilityScope"];

export type DependencyRiskObservabilityReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "OBSERVABILITY_SCOPE_VALID"
  | "OBSERVABILITY_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "ANALYSIS_REQUIRED"
  | "ANALYSIS_UNSEALED"
  | "DEPENDENCY_REPLAY_REQUIRED"
  | "DEPENDENCY_REPLAY_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
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
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_VISIBILITY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "DEPENDENCY_RISK_GRAPH_VISIBLE"
  | "DEPENDENCY_RISK_GRAPH_VISIBILITY_INCOMPLETE"
  | "SEVERITY_VISIBLE"
  | "SEVERITY_VISIBILITY_INCOMPLETE"
  | "PROPAGATION_VISIBLE"
  | "PROPAGATION_VISIBILITY_INCOMPLETE"
  | "CONCENTRATION_VISIBLE"
  | "CONCENTRATION_VISIBILITY_INCOMPLETE"
  | "GAPS_VISIBLE"
  | "GAP_VISIBILITY_INCOMPLETE"
  | "CONFLICTS_VISIBLE"
  | "CONFLICT_VISIBILITY_INCOMPLETE"
  | "LINEAGE_VISIBLE"
  | "LINEAGE_VISIBILITY_INCOMPLETE"
  | "REPLAY_VISIBLE"
  | "REPLAY_VISIBILITY_MISSING"
  | "GOVERNANCE_VISIBLE"
  | "GOVERNANCE_VISIBILITY_MISSING"
  | "AUDIT_VISIBLE"
  | "AUDIT_VISIBILITY_INCOMPLETE"
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
  | "RANKING_BLOCKED"
  | "RANKING_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DEPENDENCY_RISK_RECORD_LIMIT_VALID"
  | "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED"
  | "VISIBLE_PROPAGATION_LIMIT_VALID"
  | "VISIBLE_PROPAGATION_LIMIT_EXCEEDED"
  | "VISIBLE_CONFLICT_LIMIT_VALID"
  | "VISIBLE_CONFLICT_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "DEPENDENCY_RISK_OBSERVABILITY_IS_NOT_CONTROL";

export type DependencyRiskObservabilityEvidencePath = Readonly<{
  scope: DependencyRiskObservabilityScope;
  dependencyRiskReferences: readonly string[];
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

export type DependencyRiskObservabilityInput = Readonly<{
  request: DependencyRiskObservabilityRequest;
  foundation: SealedDependencyRiskFoundationRecord;
  analysis: SealedDependencyRiskAnalysisRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceReplay: SealedResilienceReplayRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  observabilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyRiskObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: DependencyRiskObservabilityResult["observabilityState"];
  reasonCodes: readonly DependencyRiskObservabilityReasonCode[];
  dependencyRiskGraphVisible: boolean;
  severityVisible: boolean;
  propagationVisible: boolean;
  concentrationsVisible: boolean;
  gapsVisible: boolean;
  conflictsVisible: boolean;
  lineageVisible: boolean;
  governanceVisible: boolean;
  replayVisible: boolean;
  auditVisible: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  visiblePropagationCount: number;
  visibleConflictCount: number;
  visibleReplayReferenceCount: number;
}>;

export type DependencyRiskObservabilityObservability = Readonly<{
  tenantId: string;
  observabilityState: DependencyRiskObservabilityResult["observabilityState"];
  dependencyRiskGraphVisible: boolean;
  severityVisible: boolean;
  propagationVisible: boolean;
  lineageVisible: boolean;
  governanceVisible: boolean;
  replayVisible: boolean;
  auditVisible: boolean;
  observabilityHash: string;
}>;

export type SealedDependencyRiskObservabilityRecord = Readonly<{
  result: Readonly<DependencyRiskObservabilityResult>;
  evidencePath: DependencyRiskObservabilityEvidencePath;
  validation: DependencyRiskObservabilityValidation;
  observability: DependencyRiskObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DependencyRiskReplayRequest {
  tenantId: string;
  replayScope:
    | "RISK"
    | "SEVERITY"
    | "PROPAGATION"
    | "CONFLICTS"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface DependencyRiskReplayResult {
  tenantId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  riskReconstructed: boolean;
  severityReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type DependencyRiskReplayScope = DependencyRiskReplayRequest["replayScope"];

export type DependencyRiskReplayReasonCode =
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
  | "DEPENDENCY_REPLAY_REQUIRED"
  | "DEPENDENCY_REPLAY_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
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
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "RISK_RECONSTRUCTED"
  | "RISK_EVIDENCE_MISSING"
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
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "RANKING_BLOCKED"
  | "RANKING_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DEPENDENCY_RISK_RECORD_LIMIT_VALID"
  | "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "DEPENDENCY_RISK_REPLAY_IS_NOT_CONTROL";

export type DependencyRiskReplayEvidencePath = Readonly<{
  scope: DependencyRiskReplayScope;
  dependencyRiskReferences: readonly string[];
  severityReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  baselineReferences: readonly string[];
  dependencyReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DependencyRiskReplayInput = Readonly<{
  request: DependencyRiskReplayRequest;
  foundation: SealedDependencyRiskFoundationRecord;
  analysis: SealedDependencyRiskAnalysisRecord;
  observability: SealedDependencyRiskObservabilityRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceReplay: SealedResilienceReplayRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyRiskReplayValidation = Readonly<{
  valid: boolean;
  replayState: DependencyRiskReplayResult["replayState"];
  reasonCodes: readonly DependencyRiskReplayReasonCode[];
  riskReconstructed: boolean;
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
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type DependencyRiskReplayObservability = Readonly<{
  tenantId: string;
  replayState: DependencyRiskReplayResult["replayState"];
  riskReconstructed: boolean;
  severityReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedDependencyRiskReplayRecord = Readonly<{
  result: Readonly<DependencyRiskReplayResult>;
  evidencePath: DependencyRiskReplayEvidencePath;
  validation: DependencyRiskReplayValidation;
  observability: DependencyRiskReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DependencyRiskCertificationRequest {
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

export interface DependencyRiskCertificationResult {
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
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type DependencyRiskCertificationScope = DependencyRiskCertificationRequest["certificationScope"];

export type DependencyRiskCertificationReasonCode =
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
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "RESILIENCE_CERTIFICATION_REQUIRED"
  | "RESILIENCE_CERTIFICATION_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
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
  | "LINEAGE_CERTIFIED"
  | "LINEAGE_CORRUPTION_DETECTED"
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
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DEPENDENCY_RISK_RECORD_LIMIT_VALID"
  | "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "DEPENDENCY_RISK_CERTIFICATION_IS_NOT_CONTROL";

export type DependencyRiskCertificationEvidencePath = Readonly<{
  scope: DependencyRiskCertificationScope;
  dependencyRiskReferences: readonly string[];
  severityReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  baselineReferences: readonly string[];
  dependencyReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DependencyRiskCertificationInput = Readonly<{
  request: DependencyRiskCertificationRequest;
  foundation: SealedDependencyRiskFoundationRecord;
  analysis: SealedDependencyRiskAnalysisRecord;
  observability: SealedDependencyRiskObservabilityRecord;
  replay: SealedDependencyRiskReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftCertification: SealedDriftCertificationRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DependencyRiskCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: DependencyRiskCertificationResult["certificationState"];
  reasonCodes: readonly DependencyRiskCertificationReasonCode[];
  integrityCertified: boolean;
  severityCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  lineageCertified: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type DependencyRiskCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: DependencyRiskCertificationResult["certificationState"];
  integrityCertified: boolean;
  severityCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  certificationHash: string;
}>;

export type SealedDependencyRiskCertificationRecord = Readonly<{
  result: Readonly<DependencyRiskCertificationResult>;
  evidencePath: DependencyRiskCertificationEvidencePath;
  validation: DependencyRiskCertificationValidation;
  observability: DependencyRiskCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
