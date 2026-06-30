import type { RecommendationPortfolioBundle, SealedPortfolioCertificationRecord } from "@/services/recommendation-portfolio";
import type { SealedDependencyCertificationRecord } from "@/services/recommendation-dependency";
import type { SealedImpactCertificationRecord } from "@/services/recommendation-impact";
import type {
  SealedDriftCertificationRecord,
  SealedDriftReplayRecord,
  SealedRecommendationDriftFoundationRecord,
} from "@/services/recommendation-drift";
import type {
  SealedRecommendationTrustFoundationRecord,
  SealedTrustCertificationRecord,
  SealedTrustReplayRecord,
} from "@/services/recommendation-trust";

export type RecommendationResilienceDimension =
  | "EVIDENCE_RESILIENCE"
  | "LINEAGE_RESILIENCE"
  | "GOVERNANCE_RESILIENCE"
  | "REPLAY_RESILIENCE"
  | "READINESS_RESILIENCE"
  | "PORTFOLIO_RESILIENCE"
  | "DEPENDENCY_RESILIENCE"
  | "IMPACT_RESILIENCE"
  | "DRIFT_RESILIENCE"
  | "TRUST_RESILIENCE";

export type RecommendationResilienceState =
  | "RESILIENT"
  | "CONDITIONALLY_RESILIENT"
  | "DEGRADED"
  | "FRAGILE"
  | "UNKNOWN";

export interface RecommendationResilience {
  resilienceId: string;
  recommendationId: string;
  resilienceDimension: RecommendationResilienceDimension;
  baselineReference: string;
  disruptionReference: string;
  resilienceState: RecommendationResilienceState;
  resilienceHash: string;
}

export interface RecommendationResilienceFoundationRequest {
  tenantId: string;
  recommendationIds: string[];
  resilienceScope:
    | "EVIDENCE"
    | "LINEAGE"
    | "GOVERNANCE"
    | "REPLAY"
    | "READINESS"
    | "PORTFOLIO"
    | "DEPENDENCY"
    | "IMPACT"
    | "DRIFT"
    | "TRUST"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationResilienceFoundationResult {
  tenantId: string;
  resilienceState: RecommendationResilienceState;
  resilienceRecordsCreated: number;
  evidenceResilienceDetected: number;
  lineageResilienceDetected: number;
  governanceResilienceDetected: number;
  replayResilienceDetected: number;
  readinessResilienceDetected: number;
  portfolioResilienceDetected: number;
  dependencyResilienceDetected: number;
  impactResilienceDetected: number;
  driftResilienceDetected: number;
  trustResilienceDetected: number;
  tenantIsolationVerified: boolean;
  resilienceGraphHash: string;
  deterministic: boolean;
}

export type RecommendationResilienceScope = RecommendationResilienceFoundationRequest["resilienceScope"];

export type RecommendationResilienceFoundationReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "RESILIENCE_SCOPE_VALID"
  | "RESILIENCE_SCOPE_INVALID"
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
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_RESILIENCE_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "EVIDENCE_RESILIENCE_RESILIENT"
  | "EVIDENCE_RESILIENCE_CONDITIONAL"
  | "EVIDENCE_RESILIENCE_UNKNOWN"
  | "LINEAGE_RESILIENCE_RESILIENT"
  | "LINEAGE_RESILIENCE_CONDITIONAL"
  | "LINEAGE_RESILIENCE_UNKNOWN"
  | "LINEAGE_RESILIENCE_FRAGILE"
  | "GOVERNANCE_RESILIENCE_RESILIENT"
  | "GOVERNANCE_RESILIENCE_CONDITIONAL"
  | "GOVERNANCE_RESILIENCE_UNKNOWN"
  | "GOVERNANCE_RESILIENCE_FRAGILE"
  | "REPLAY_RESILIENCE_RESILIENT"
  | "REPLAY_RESILIENCE_CONDITIONAL"
  | "REPLAY_RESILIENCE_UNKNOWN"
  | "REPLAY_RESILIENCE_FRAGILE"
  | "READINESS_RESILIENCE_RESILIENT"
  | "READINESS_RESILIENCE_CONDITIONAL"
  | "READINESS_RESILIENCE_UNKNOWN"
  | "READINESS_RESILIENCE_FRAGILE"
  | "PORTFOLIO_RESILIENCE_RESILIENT"
  | "PORTFOLIO_RESILIENCE_CONDITIONAL"
  | "PORTFOLIO_RESILIENCE_UNKNOWN"
  | "PORTFOLIO_RESILIENCE_FRAGILE"
  | "DEPENDENCY_RESILIENCE_RESILIENT"
  | "DEPENDENCY_RESILIENCE_CONDITIONAL"
  | "DEPENDENCY_RESILIENCE_UNKNOWN"
  | "DEPENDENCY_RESILIENCE_FRAGILE"
  | "IMPACT_RESILIENCE_RESILIENT"
  | "IMPACT_RESILIENCE_CONDITIONAL"
  | "IMPACT_RESILIENCE_UNKNOWN"
  | "IMPACT_RESILIENCE_FRAGILE"
  | "DRIFT_RESILIENCE_RESILIENT"
  | "DRIFT_RESILIENCE_CONDITIONAL"
  | "DRIFT_RESILIENCE_UNKNOWN"
  | "DRIFT_RESILIENCE_FRAGILE"
  | "TRUST_RESILIENCE_RESILIENT"
  | "TRUST_RESILIENCE_CONDITIONAL"
  | "TRUST_RESILIENCE_UNKNOWN"
  | "TRUST_RESILIENCE_FRAGILE"
  | "RESILIENCE_EVIDENCE_PRESENT"
  | "RESILIENCE_EVIDENCE_MISSING"
  | "DISRUPTION_REFERENCES_PRESENT"
  | "DISRUPTION_REFERENCES_MISSING"
  | "REPLAY_EVIDENCE_PRESENT"
  | "REPLAY_EVIDENCE_MISSING"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "BOUNDED_DEGRADATION_DETECTED"
  | "MULTIPLE_RESILIENCE_CONCERNS_DETECTED"
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
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "RESILIENCE_MUTATION_BLOCKED"
  | "RESILIENCE_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "RESILIENCE_RECORD_LIMIT_VALID"
  | "RESILIENCE_RECORD_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "DISRUPTION_REFERENCE_LIMIT_VALID"
  | "DISRUPTION_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_RESILIENCE_FOUNDATION_IS_NOT_CONTROL";

export type RecommendationResilienceEvidencePath = Readonly<{
  scope: RecommendationResilienceScope;
  resilienceReferences: readonly string[];
  baselineReferences: readonly string[];
  disruptionReferences: readonly string[];
  evidenceReferences: readonly string[];
  lineageReferences: readonly string[];
  governanceReferences: readonly string[];
  replayReferences: readonly string[];
  readinessReferences: readonly string[];
  portfolioReferences: readonly string[];
  dependencyReferences: readonly string[];
  impactReferences: readonly string[];
  driftReferences: readonly string[];
  trustReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationResilienceFoundationInput = Readonly<{
  request: RecommendationResilienceFoundationRequest;
  trustFoundation: SealedRecommendationTrustFoundationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  resilienceMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationResilienceFoundationValidation = Readonly<{
  valid: boolean;
  resilienceState: RecommendationResilienceFoundationResult["resilienceState"];
  reasonCodes: readonly RecommendationResilienceFoundationReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
  resilienceRecordsCreated: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
  disruptionReferenceCount: number;
}>;

export type RecommendationResilienceFoundationObservability = Readonly<{
  tenantId: string;
  resilienceState: RecommendationResilienceFoundationResult["resilienceState"];
  resilienceRecordsCreated: number;
  evidenceResilienceDetected: number;
  lineageResilienceDetected: number;
  governanceResilienceDetected: number;
  replayResilienceDetected: number;
  readinessResilienceDetected: number;
  portfolioResilienceDetected: number;
  dependencyResilienceDetected: number;
  impactResilienceDetected: number;
  driftResilienceDetected: number;
  trustResilienceDetected: number;
  resilienceGraphHash: string;
}>;

export type SealedRecommendationResilienceFoundationRecord = Readonly<{
  result: Readonly<RecommendationResilienceFoundationResult>;
  resiliences: readonly RecommendationResilience[];
  evidencePath: RecommendationResilienceEvidencePath;
  validation: RecommendationResilienceFoundationValidation;
  observability: RecommendationResilienceFoundationObservability;
  sealed: true;
  readOnly: true;
  resilienceOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface ResilienceAnalysisRequest {
  tenantId: string;
  recommendationIds: string[];
  analysisScope:
    | "STRENGTH"
    | "CONCENTRATION"
    | "PROPAGATION"
    | "GAPS"
    | "FAILURES"
    | "FULL";
  graphVersion: string;
}

export interface ResilienceAnalysisResult {
  tenantId: string;
  analysisState:
    | "ANALYZED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  resilienceStrengthsDetected: number;
  resilienceConcentrationsDetected: number;
  resiliencePropagationsDetected: number;
  resilienceGapsDetected: number;
  resilienceFailuresDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type ResilienceAnalysisScope = ResilienceAnalysisRequest["analysisScope"];

export type RecommendationResilienceStrengthClass =
  | "VERY_RESILIENT"
  | "RESILIENT"
  | "MODERATELY_RESILIENT"
  | "WEAK"
  | "FRAGILE";

export type RecommendationResilienceStrength = Readonly<{
  recommendationId: string;
  resilienceClass: RecommendationResilienceStrengthClass;
  resilientDimensions: readonly RecommendationResilienceDimension[];
  degradedDimensions: readonly RecommendationResilienceDimension[];
  unknownDimensions: readonly RecommendationResilienceDimension[];
  strengthHash: string;
}>;

export type RecommendationResilienceConcentration = Readonly<{
  concentrationId: string;
  recommendationId: string;
  concentrationType:
    | "HIGH_RESILIENCE_CLUSTER"
    | "LOW_RESILIENCE_CLUSTER"
    | "GOVERNANCE_RESILIENCE_CONCENTRATION"
    | "DEPENDENCY_RESILIENCE_CONCENTRATION"
    | "IMPACT_RESILIENCE_CONCENTRATION"
    | "PORTFOLIO_RESILIENCE_CONCENTRATION";
  concentrationHash: string;
}>;

export type RecommendationResiliencePropagation = Readonly<{
  propagationId: string;
  recommendationId: string;
  propagationType:
    | "RESILIENCE_PATH"
    | "FAILURE_PROPAGATION"
    | "RECOVERABILITY_CONTINUITY"
    | "DEPENDENCY_DISRUPTION_PROPAGATION"
    | "IMPACT_DISRUPTION_PROPAGATION";
  propagationReference: string;
  propagationHash: string;
}>;

export type RecommendationResilienceGap = Readonly<{
  gapId: string;
  recommendationId: string;
  gapType:
    | "MISSING_RESILIENCE_EVIDENCE"
    | "MISSING_LINEAGE_RESILIENCE"
    | "MISSING_GOVERNANCE_RESILIENCE"
    | "MISSING_REPLAY_RESILIENCE"
    | "MISSING_DEPENDENCY_RESILIENCE"
    | "MISSING_TRUST_RESILIENCE";
  gapHash: string;
}>;

export type RecommendationResilienceFailure = Readonly<{
  failureId: string;
  recommendationId: string;
  failureType:
    | "GOVERNANCE_RESILIENCE_FAILURE"
    | "LINEAGE_RESILIENCE_FAILURE"
    | "REPLAY_RESILIENCE_FAILURE"
    | "DEPENDENCY_RESILIENCE_FAILURE"
    | "IMPACT_RESILIENCE_FAILURE"
    | "DRIFT_RESILIENCE_FAILURE"
    | "TRUST_RESILIENCE_FAILURE"
    | "AUTHORITY_BOUNDARY_FAILURE";
  failureHash: string;
}>;

export type ResilienceAnalysisReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "TRUST_REPLAY_REQUIRED"
  | "TRUST_REPLAY_UNSEALED"
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_REPLAY_REQUIRED"
  | "DRIFT_REPLAY_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_RESILIENCE_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "RESILIENCE_STRENGTH_ANALYZED"
  | "RESILIENCE_STRENGTH_LIMITED"
  | "RESILIENCE_CONCENTRATION_ANALYZED"
  | "RESILIENCE_CONCENTRATION_LIMITED"
  | "RESILIENCE_PROPAGATION_ANALYZED"
  | "RESILIENCE_PROPAGATION_LIMITED"
  | "RESILIENCE_GAPS_DETECTED"
  | "RESILIENCE_GAPS_ABSENT"
  | "RESILIENCE_FAILURES_DETECTED"
  | "RESILIENCE_FAILURES_ABSENT"
  | "GOVERNANCE_CONTINUITY_PRESERVED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CONTINUITY_PRESERVED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "RESILIENCE_EVIDENCE_PRESENT"
  | "RESILIENCE_EVIDENCE_MISSING"
  | "BASELINE_REFERENCES_PRESENT"
  | "BASELINE_REFERENCES_MISSING"
  | "DISRUPTION_REFERENCES_PRESENT"
  | "DISRUPTION_REFERENCES_MISSING"
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
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
  | "ANALYSIS_MUTATION_BLOCKED"
  | "ANALYSIS_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "RESILIENCE_RECORD_LIMIT_VALID"
  | "RESILIENCE_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "FAILURE_LIMIT_VALID"
  | "FAILURE_LIMIT_EXCEEDED"
  | "RESILIENCE_ANALYSIS_IS_NOT_CONTROL";

export type ResilienceAnalysisEvidencePath = Readonly<{
  scope: ResilienceAnalysisScope;
  resilienceReferences: readonly string[];
  strengthReferences: readonly string[];
  concentrationReferences: readonly string[];
  propagationReferences: readonly string[];
  gapReferences: readonly string[];
  failureReferences: readonly string[];
  baselineReferences: readonly string[];
  disruptionReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ResilienceAnalysisInput = Readonly<{
  request: ResilienceAnalysisRequest;
  foundation: SealedRecommendationResilienceFoundationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  analysisMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ResilienceAnalysisValidation = Readonly<{
  valid: boolean;
  analysisState: ResilienceAnalysisResult["analysisState"];
  reasonCodes: readonly ResilienceAnalysisReasonCode[];
  resilienceStrengthsDetected: number;
  resilienceConcentrationsDetected: number;
  resiliencePropagationsDetected: number;
  resilienceGapsDetected: number;
  resilienceFailuresDetected: number;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type ResilienceAnalysisObservability = Readonly<{
  tenantId: string;
  analysisState: ResilienceAnalysisResult["analysisState"];
  resilienceStrengthsDetected: number;
  resilienceConcentrationsDetected: number;
  resiliencePropagationsDetected: number;
  resilienceGapsDetected: number;
  resilienceFailuresDetected: number;
  analysisHash: string;
}>;

export type SealedResilienceAnalysisRecord = Readonly<{
  result: Readonly<ResilienceAnalysisResult>;
  strengths: readonly RecommendationResilienceStrength[];
  concentrations: readonly RecommendationResilienceConcentration[];
  propagations: readonly RecommendationResiliencePropagation[];
  gaps: readonly RecommendationResilienceGap[];
  failures: readonly RecommendationResilienceFailure[];
  evidencePath: ResilienceAnalysisEvidencePath;
  validation: ResilienceAnalysisValidation;
  observability: ResilienceAnalysisObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface ResilienceObservabilityRequest {
  tenantId: string;
  observabilityScope:
    | "SUMMARY"
    | "STRENGTH"
    | "PROPAGATION"
    | "FAILURES"
    | "LINEAGE"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface ResilienceObservabilityResult {
  tenantId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  resilienceGraphVisible: boolean;
  resilienceStrengthVisible: boolean;
  resiliencePropagationVisible: boolean;
  resilienceLineageVisible: boolean;
  resilienceGovernanceVisible: boolean;
  resilienceReplayVisible: boolean;
  resilienceAuditVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type ResilienceObservabilityScope = ResilienceObservabilityRequest["observabilityScope"];

export type ResilienceObservabilityReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "OBSERVABILITY_SCOPE_VALID"
  | "OBSERVABILITY_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "ANALYSIS_REQUIRED"
  | "ANALYSIS_UNSEALED"
  | "TRUST_REPLAY_REQUIRED"
  | "TRUST_REPLAY_UNSEALED"
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_REPLAY_REQUIRED"
  | "DRIFT_REPLAY_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_VISIBILITY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "RESILIENCE_GRAPH_VISIBLE"
  | "RESILIENCE_GRAPH_VISIBILITY_INCOMPLETE"
  | "RESILIENCE_STRENGTH_VISIBLE"
  | "RESILIENCE_STRENGTH_VISIBILITY_INCOMPLETE"
  | "RESILIENCE_PROPAGATION_VISIBLE"
  | "RESILIENCE_PROPAGATION_VISIBILITY_INCOMPLETE"
  | "RESILIENCE_FAILURES_VISIBLE"
  | "RESILIENCE_FAILURE_VISIBILITY_INCOMPLETE"
  | "RESILIENCE_LINEAGE_VISIBLE"
  | "RESILIENCE_LINEAGE_VISIBILITY_INCOMPLETE"
  | "RESILIENCE_REPLAY_VISIBLE"
  | "RESILIENCE_REPLAY_VISIBILITY_MISSING"
  | "GOVERNANCE_VISIBLE"
  | "GOVERNANCE_VISIBILITY_MISSING"
  | "RESILIENCE_AUDIT_VISIBLE"
  | "RESILIENCE_AUDIT_VISIBILITY_INCOMPLETE"
  | "VISIBILITY_EVIDENCE_COMPLETE"
  | "VISIBILITY_EVIDENCE_MISSING"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
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
  | "RESILIENCE_RECORD_LIMIT_VALID"
  | "RESILIENCE_RECORD_LIMIT_EXCEEDED"
  | "VISIBLE_PROPAGATION_LIMIT_VALID"
  | "VISIBLE_PROPAGATION_LIMIT_EXCEEDED"
  | "VISIBLE_FAILURE_LIMIT_VALID"
  | "VISIBLE_FAILURE_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "RESILIENCE_OBSERVABILITY_IS_NOT_CONTROL";

export type ResilienceObservabilityEvidencePath = Readonly<{
  scope: ResilienceObservabilityScope;
  resilienceReferences: readonly string[];
  strengthReferences: readonly string[];
  propagationReferences: readonly string[];
  concentrationReferences: readonly string[];
  gapReferences: readonly string[];
  failureReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ResilienceObservabilityInput = Readonly<{
  request: ResilienceObservabilityRequest;
  foundation: SealedRecommendationResilienceFoundationRecord;
  analysis: SealedResilienceAnalysisRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  observabilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ResilienceObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: ResilienceObservabilityResult["observabilityState"];
  reasonCodes: readonly ResilienceObservabilityReasonCode[];
  resilienceGraphVisible: boolean;
  resilienceStrengthVisible: boolean;
  resiliencePropagationVisible: boolean;
  resilienceFailuresVisible: boolean;
  resilienceLineageVisible: boolean;
  resilienceGovernanceVisible: boolean;
  resilienceReplayVisible: boolean;
  resilienceAuditVisible: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
  visiblePropagationCount: number;
  visibleFailureCount: number;
  visibleReplayReferenceCount: number;
}>;

export type ResilienceObservabilityObservability = Readonly<{
  tenantId: string;
  observabilityState: ResilienceObservabilityResult["observabilityState"];
  resilienceGraphVisible: boolean;
  resilienceStrengthVisible: boolean;
  resiliencePropagationVisible: boolean;
  resilienceLineageVisible: boolean;
  resilienceGovernanceVisible: boolean;
  resilienceReplayVisible: boolean;
  resilienceAuditVisible: boolean;
  observabilityHash: string;
}>;

export type SealedResilienceObservabilityRecord = Readonly<{
  result: Readonly<ResilienceObservabilityResult>;
  evidencePath: ResilienceObservabilityEvidencePath;
  validation: ResilienceObservabilityValidation;
  observability: ResilienceObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface ResilienceReplayRequest {
  tenantId: string;
  replayScope:
    | "RESILIENCE"
    | "STRENGTH"
    | "PROPAGATION"
    | "FAILURES"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface ResilienceReplayResult {
  tenantId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  resilienceReconstructed: boolean;
  strengthReconstructed: boolean;
  propagationReconstructed: boolean;
  failuresReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type ResilienceReplayScope = ResilienceReplayRequest["replayScope"];

export type ResilienceReplayReasonCode =
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
  | "TRUST_REPLAY_REQUIRED"
  | "TRUST_REPLAY_UNSEALED"
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_REPLAY_REQUIRED"
  | "DRIFT_REPLAY_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
  | "PORTFOLIO_CERTIFICATION_REQUIRED"
  | "PORTFOLIO_CERTIFICATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "RESILIENCE_RECONSTRUCTED"
  | "RESILIENCE_EVIDENCE_MISSING"
  | "STRENGTH_RECONSTRUCTED"
  | "STRENGTH_RECONSTRUCTION_BROKEN"
  | "EVIDENCE_RECONSTRUCTED"
  | "REPLAY_ARTIFACTS_MISSING"
  | "PROPAGATION_RECONSTRUCTED"
  | "PROPAGATION_MISMATCH_DETECTED"
  | "FAILURES_RECONSTRUCTED"
  | "FAILURE_RECONSTRUCTION_BROKEN"
  | "GOVERNANCE_RECONSTRUCTED"
  | "GOVERNANCE_DEGRADATION_SURFACED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_HASH_VERIFIED"
  | "REPLAY_HASH_MISMATCH"
  | "LINEAGE_CONTINUITY_PRESERVED"
  | "LINEAGE_CONTINUITY_BROKEN"
  | "OBSERVABILITY_RECONSTRUCTED"
  | "OBSERVABILITY_RECONSTRUCTION_BROKEN"
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
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
  | "RESILIENCE_RECORD_LIMIT_VALID"
  | "RESILIENCE_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "DISRUPTION_REFERENCE_LIMIT_VALID"
  | "DISRUPTION_REFERENCE_LIMIT_EXCEEDED"
  | "RESILIENCE_REPLAY_IS_NOT_CONTROL";

export type ResilienceReplayEvidencePath = Readonly<{
  scope: ResilienceReplayScope;
  resilienceReferences: readonly string[];
  strengthReferences: readonly string[];
  propagationReferences: readonly string[];
  failureReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  baselineReferences: readonly string[];
  disruptionReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ResilienceReplayInput = Readonly<{
  request: ResilienceReplayRequest;
  foundation: SealedRecommendationResilienceFoundationRecord;
  analysis: SealedResilienceAnalysisRecord;
  observability: SealedResilienceObservabilityRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ResilienceReplayValidation = Readonly<{
  valid: boolean;
  replayState: ResilienceReplayResult["replayState"];
  reasonCodes: readonly ResilienceReplayReasonCode[];
  resilienceReconstructed: boolean;
  strengthReconstructed: boolean;
  propagationReconstructed: boolean;
  failuresReconstructed: boolean;
  governanceReconstructed: boolean;
  observabilityReconstructed: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
  disruptionReferenceCount: number;
}>;

export type ResilienceReplayObservability = Readonly<{
  tenantId: string;
  replayState: ResilienceReplayResult["replayState"];
  resilienceReconstructed: boolean;
  strengthReconstructed: boolean;
  propagationReconstructed: boolean;
  failuresReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedResilienceReplayRecord = Readonly<{
  result: Readonly<ResilienceReplayResult>;
  evidencePath: ResilienceReplayEvidencePath;
  validation: ResilienceReplayValidation;
  observability: ResilienceReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface ResilienceCertificationRequest {
  tenantId: string;
  certificationScope:
    | "INTEGRITY"
    | "STRENGTH"
    | "PROPAGATION"
    | "REPLAY"
    | "GOVERNANCE"
    | "FULL";
  graphVersion: string;
}

export interface ResilienceCertificationResult {
  tenantId: string;
  certificationState:
    | "PASS"
    | "CONDITIONAL_PASS"
    | "FAIL";
  integrityCertified: boolean;
  strengthCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  recoverabilityCertified: boolean;
  disruptionToleranceCertified: boolean;
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type ResilienceCertificationScope = ResilienceCertificationRequest["certificationScope"];

export type ResilienceCertificationReasonCode =
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
  | "TRUST_CERTIFICATION_REQUIRED"
  | "TRUST_CERTIFICATION_UNSEALED"
  | "DRIFT_CERTIFICATION_REQUIRED"
  | "DRIFT_CERTIFICATION_UNSEALED"
  | "IMPACT_CERTIFICATION_REQUIRED"
  | "IMPACT_CERTIFICATION_UNSEALED"
  | "DEPENDENCY_CERTIFICATION_REQUIRED"
  | "DEPENDENCY_CERTIFICATION_UNSEALED"
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
  | "RECOVERABILITY_CERTIFIED"
  | "RECOVERABILITY_BROKEN"
  | "DISRUPTION_TOLERANCE_CERTIFIED"
  | "DISRUPTION_TOLERANCE_BROKEN"
  | "BOUNDED_DISRUPTION_CONCERN"
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
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RESILIENCE_RECORD_LIMIT_VALID"
  | "RESILIENCE_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "DISRUPTION_REFERENCE_LIMIT_VALID"
  | "DISRUPTION_REFERENCE_LIMIT_EXCEEDED"
  | "RESILIENCE_CERTIFICATION_IS_NOT_CONTROL";

export type ResilienceCertificationEvidencePath = Readonly<{
  scope: ResilienceCertificationScope;
  resilienceReferences: readonly string[];
  strengthReferences: readonly string[];
  propagationReferences: readonly string[];
  failureReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  baselineReferences: readonly string[];
  disruptionReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type ResilienceCertificationInput = Readonly<{
  request: ResilienceCertificationRequest;
  foundation: SealedRecommendationResilienceFoundationRecord;
  analysis: SealedResilienceAnalysisRecord;
  observability: SealedResilienceObservabilityRecord;
  replay: SealedResilienceReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  driftCertification: SealedDriftCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type ResilienceCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: ResilienceCertificationResult["certificationState"];
  reasonCodes: readonly ResilienceCertificationReasonCode[];
  integrityCertified: boolean;
  strengthCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  recoverabilityCertified: boolean;
  disruptionToleranceCertified: boolean;
  lineageCertified: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
  disruptionReferenceCount: number;
}>;

export type ResilienceCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: ResilienceCertificationResult["certificationState"];
  integrityCertified: boolean;
  strengthCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  recoverabilityCertified: boolean;
  disruptionToleranceCertified: boolean;
  certificationHash: string;
}>;

export type SealedResilienceCertificationRecord = Readonly<{
  result: Readonly<ResilienceCertificationResult>;
  evidencePath: ResilienceCertificationEvidencePath;
  validation: ResilienceCertificationValidation;
  observability: ResilienceCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
