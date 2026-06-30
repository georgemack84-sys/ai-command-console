import type { RecommendationPortfolioBundle, SealedPortfolioCertificationRecord } from "@/services/recommendation-portfolio";
import type { SealedDependencyCertificationRecord } from "@/services/recommendation-dependency";
import type { SealedImpactCertificationRecord } from "@/services/recommendation-impact";
import type {
  SealedDriftCertificationRecord,
  SealedDriftReplayRecord,
  SealedRecommendationDriftFoundationRecord,
} from "@/services/recommendation-drift";

export type RecommendationTrustDimension =
  | "EVIDENCE_TRUST"
  | "LINEAGE_TRUST"
  | "GOVERNANCE_TRUST"
  | "REPLAY_TRUST"
  | "READINESS_TRUST"
  | "PORTFOLIO_TRUST"
  | "DEPENDENCY_TRUST"
  | "IMPACT_TRUST"
  | "DRIFT_TRUST";

export type RecommendationTrustState =
  | "TRUSTED"
  | "CONDITIONALLY_TRUSTED"
  | "DEGRADED"
  | "UNTRUSTED"
  | "UNKNOWN";

export interface RecommendationTrust {
  trustId: string;
  recommendationId: string;
  trustDimension: RecommendationTrustDimension;
  baselineReference: string;
  currentReference: string;
  trustState: RecommendationTrustState;
  trustHash: string;
}

export interface RecommendationTrustFoundationRequest {
  tenantId: string;
  recommendationIds: string[];
  trustScope:
    | "EVIDENCE"
    | "LINEAGE"
    | "GOVERNANCE"
    | "REPLAY"
    | "READINESS"
    | "PORTFOLIO"
    | "DEPENDENCY"
    | "IMPACT"
    | "DRIFT"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationTrustFoundationResult {
  tenantId: string;
  trustState: RecommendationTrustState;
  trustRecordsCreated: number;
  evidenceTrustDetected: number;
  lineageTrustDetected: number;
  governanceTrustDetected: number;
  replayTrustDetected: number;
  readinessTrustDetected: number;
  portfolioTrustDetected: number;
  dependencyTrustDetected: number;
  impactTrustDetected: number;
  driftTrustDetected: number;
  tenantIsolationVerified: boolean;
  trustGraphHash: string;
  deterministic: boolean;
}

export type RecommendationTrustScope = RecommendationTrustFoundationRequest["trustScope"];

export type RecommendationTrustFoundationReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "TRUST_SCOPE_VALID"
  | "TRUST_SCOPE_INVALID"
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
  | "CROSS_TENANT_TRUST_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "EVIDENCE_TRUST_TRUSTED"
  | "EVIDENCE_TRUST_CONDITIONAL"
  | "EVIDENCE_TRUST_UNKNOWN"
  | "LINEAGE_TRUST_TRUSTED"
  | "LINEAGE_TRUST_UNKNOWN"
  | "LINEAGE_TRUST_UNTRUSTED"
  | "GOVERNANCE_TRUST_TRUSTED"
  | "GOVERNANCE_TRUST_UNKNOWN"
  | "GOVERNANCE_TRUST_UNTRUSTED"
  | "REPLAY_TRUST_TRUSTED"
  | "REPLAY_TRUST_CONDITIONAL"
  | "REPLAY_TRUST_UNKNOWN"
  | "REPLAY_TRUST_UNTRUSTED"
  | "READINESS_TRUST_TRUSTED"
  | "READINESS_TRUST_CONDITIONAL"
  | "READINESS_TRUST_UNKNOWN"
  | "READINESS_TRUST_UNTRUSTED"
  | "PORTFOLIO_TRUST_TRUSTED"
  | "PORTFOLIO_TRUST_CONDITIONAL"
  | "PORTFOLIO_TRUST_UNTRUSTED"
  | "DEPENDENCY_TRUST_TRUSTED"
  | "DEPENDENCY_TRUST_CONDITIONAL"
  | "DEPENDENCY_TRUST_UNTRUSTED"
  | "IMPACT_TRUST_TRUSTED"
  | "IMPACT_TRUST_CONDITIONAL"
  | "IMPACT_TRUST_UNTRUSTED"
  | "DRIFT_TRUST_TRUSTED"
  | "DRIFT_TRUST_CONDITIONAL"
  | "DRIFT_TRUST_UNKNOWN"
  | "DRIFT_TRUST_UNTRUSTED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "TRUST_EVIDENCE_MISSING"
  | "LINEAGE_EVIDENCE_MISSING"
  | "REPLAY_EVIDENCE_MISSING"
  | "BOUNDED_DEGRADATION_DETECTED"
  | "MULTIPLE_TRUST_CONCERNS_DETECTED"
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
  | "TRUST_MUTATION_BLOCKED"
  | "TRUST_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "TRUST_RECORD_LIMIT_VALID"
  | "TRUST_RECORD_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "TRUST_FOUNDATION_IS_NOT_CONTROL";

export type RecommendationTrustEvidencePath = Readonly<{
  scope: RecommendationTrustScope;
  trustReferences: readonly string[];
  baselineReferences: readonly string[];
  currentReferences: readonly string[];
  evidenceReferences: readonly string[];
  lineageReferences: readonly string[];
  governanceReferences: readonly string[];
  replayReferences: readonly string[];
  readinessReferences: readonly string[];
  portfolioReferences: readonly string[];
  dependencyReferences: readonly string[];
  impactReferences: readonly string[];
  driftReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationTrustFoundationInput = Readonly<{
  request: RecommendationTrustFoundationRequest;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  trustMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationRankingRequested?: boolean;
  approvalRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationTrustFoundationValidation = Readonly<{
  valid: boolean;
  trustState: RecommendationTrustFoundationResult["trustState"];
  reasonCodes: readonly RecommendationTrustFoundationReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  trustRecordsCreated: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
}>;

export type RecommendationTrustFoundationObservability = Readonly<{
  tenantId: string;
  trustState: RecommendationTrustFoundationResult["trustState"];
  trustRecordsCreated: number;
  evidenceTrustDetected: number;
  lineageTrustDetected: number;
  governanceTrustDetected: number;
  replayTrustDetected: number;
  readinessTrustDetected: number;
  portfolioTrustDetected: number;
  dependencyTrustDetected: number;
  impactTrustDetected: number;
  driftTrustDetected: number;
  trustGraphHash: string;
}>;

export type SealedRecommendationTrustFoundationRecord = Readonly<{
  result: Readonly<RecommendationTrustFoundationResult>;
  trusts: readonly RecommendationTrust[];
  evidencePath: RecommendationTrustEvidencePath;
  validation: RecommendationTrustFoundationValidation;
  observability: RecommendationTrustFoundationObservability;
  sealed: true;
  readOnly: true;
  trustOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface TrustAnalysisRequest {
  tenantId: string;
  recommendationIds: string[];
  analysisScope:
    | "STRENGTH"
    | "CONCENTRATION"
    | "PROPAGATION"
    | "GAPS"
    | "CONFLICTS"
    | "FULL";
  graphVersion: string;
}

export interface TrustAnalysisResult {
  tenantId: string;
  analysisState:
    | "ANALYZED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  trustStrengthsDetected: number;
  trustConcentrationsDetected: number;
  trustPropagationsDetected: number;
  trustGapsDetected: number;
  trustConflictsDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type TrustAnalysisScope = TrustAnalysisRequest["analysisScope"];

export type RecommendationTrustStrengthClass =
  | "VERY_STRONG"
  | "STRONG"
  | "MODERATE"
  | "WEAK"
  | "CRITICAL";

export type RecommendationTrustStrength = Readonly<{
  recommendationId: string;
  trustClass: RecommendationTrustStrengthClass;
  trustedDimensions: readonly RecommendationTrustDimension[];
  degradedDimensions: readonly RecommendationTrustDimension[];
  unknownDimensions: readonly RecommendationTrustDimension[];
  strengthHash: string;
}>;

export type RecommendationTrustConcentration = Readonly<{
  concentrationId: string;
  recommendationId: string;
  concentrationType:
    | "HIGH_TRUST_CLUSTER"
    | "LOW_TRUST_CLUSTER"
    | "GOVERNANCE_CONCENTRATION"
    | "DEPENDENCY_CONCENTRATION"
    | "IMPACT_CONCENTRATION"
    | "PORTFOLIO_CONCENTRATION";
  concentrationHash: string;
}>;

export type RecommendationTrustPropagation = Readonly<{
  propagationId: string;
  recommendationId: string;
  propagationType:
    | "TRUST_PATH"
    | "INHERITANCE_CHAIN"
    | "CONTINUITY_PATH"
    | "DEPENDENCY_PROPAGATION"
    | "IMPACT_PROPAGATION";
  propagationReference: string;
  propagationHash: string;
}>;

export type RecommendationTrustGap = Readonly<{
  gapId: string;
  recommendationId: string;
  gapType:
    | "MISSING_TRUST_EVIDENCE"
    | "MISSING_LINEAGE_TRUST"
    | "MISSING_GOVERNANCE_TRUST"
    | "MISSING_REPLAY_TRUST"
    | "MISSING_READINESS_TRUST"
    | "MISSING_CERTIFICATION_TRUST";
  gapHash: string;
}>;

export type RecommendationTrustConflict = Readonly<{
  conflictId: string;
  recommendationId: string;
  conflictType:
    | "GOVERNANCE_TRUST_CONFLICT"
    | "LINEAGE_TRUST_CONFLICT"
    | "REPLAY_TRUST_CONFLICT"
    | "DEPENDENCY_TRUST_CONFLICT"
    | "IMPACT_TRUST_CONFLICT"
    | "DRIFT_TRUST_CONFLICT"
    | "AUTHORITY_BOUNDARY_CONFLICT";
  conflictHash: string;
}>;

export type TrustAnalysisReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
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
  | "CROSS_TENANT_TRUST_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "TRUST_STRENGTH_ANALYZED"
  | "TRUST_STRENGTH_LIMITED"
  | "TRUST_CONCENTRATION_ANALYZED"
  | "TRUST_CONCENTRATION_LIMITED"
  | "TRUST_PROPAGATION_ANALYZED"
  | "TRUST_PROPAGATION_LIMITED"
  | "TRUST_GAPS_DETECTED"
  | "TRUST_GAPS_ABSENT"
  | "TRUST_CONFLICTS_DETECTED"
  | "TRUST_CONFLICTS_ABSENT"
  | "GOVERNANCE_CONTINUITY_PRESERVED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CONTINUITY_PRESERVED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "TRUST_EVIDENCE_PRESENT"
  | "TRUST_EVIDENCE_MISSING"
  | "BASELINE_REFERENCES_PRESENT"
  | "BASELINE_REFERENCES_MISSING"
  | "CURRENT_REFERENCES_PRESENT"
  | "CURRENT_REFERENCES_MISSING"
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
  | "TRUST_RECORD_LIMIT_VALID"
  | "TRUST_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "CONFLICT_LIMIT_VALID"
  | "CONFLICT_LIMIT_EXCEEDED"
  | "TRUST_ANALYSIS_IS_NOT_CONTROL";

export type TrustAnalysisEvidencePath = Readonly<{
  scope: TrustAnalysisScope;
  trustReferences: readonly string[];
  strengthReferences: readonly string[];
  concentrationReferences: readonly string[];
  propagationReferences: readonly string[];
  gapReferences: readonly string[];
  conflictReferences: readonly string[];
  baselineReferences: readonly string[];
  currentReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type TrustAnalysisInput = Readonly<{
  request: TrustAnalysisRequest;
  foundation: SealedRecommendationTrustFoundationRecord;
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
  authorityExpansionDetected?: boolean;
}>;

export type TrustAnalysisValidation = Readonly<{
  valid: boolean;
  analysisState: TrustAnalysisResult["analysisState"];
  reasonCodes: readonly TrustAnalysisReasonCode[];
  trustStrengthsDetected: number;
  trustConcentrationsDetected: number;
  trustPropagationsDetected: number;
  trustGapsDetected: number;
  trustConflictsDetected: number;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type TrustAnalysisObservability = Readonly<{
  tenantId: string;
  analysisState: TrustAnalysisResult["analysisState"];
  trustStrengthsDetected: number;
  trustConcentrationsDetected: number;
  trustPropagationsDetected: number;
  trustGapsDetected: number;
  trustConflictsDetected: number;
  analysisHash: string;
}>;

export type SealedTrustAnalysisRecord = Readonly<{
  result: Readonly<TrustAnalysisResult>;
  strengths: readonly RecommendationTrustStrength[];
  concentrations: readonly RecommendationTrustConcentration[];
  propagations: readonly RecommendationTrustPropagation[];
  gaps: readonly RecommendationTrustGap[];
  conflicts: readonly RecommendationTrustConflict[];
  evidencePath: TrustAnalysisEvidencePath;
  validation: TrustAnalysisValidation;
  observability: TrustAnalysisObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  recommendationRankingAllowed: false;
  approvalAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface TrustObservabilityRequest {
  tenantId: string;
  observabilityScope:
    | "SUMMARY"
    | "STRENGTH"
    | "PROPAGATION"
    | "CONFLICTS"
    | "LINEAGE"
    | "REPLAY"
    | "FULL";
  graphVersion: string;
}

export interface TrustObservabilityResult {
  tenantId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  trustGraphVisible: boolean;
  trustStrengthVisible: boolean;
  trustPropagationVisible: boolean;
  trustLineageVisible: boolean;
  trustGovernanceVisible: boolean;
  trustReplayVisible: boolean;
  trustAuditVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type TrustObservabilityScope = TrustObservabilityRequest["observabilityScope"];

export type TrustObservabilityReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "OBSERVABILITY_SCOPE_VALID"
  | "OBSERVABILITY_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "ANALYSIS_REQUIRED"
  | "ANALYSIS_UNSEALED"
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
  | "TRUST_GRAPH_VISIBLE"
  | "TRUST_GRAPH_VISIBILITY_INCOMPLETE"
  | "TRUST_STRENGTH_VISIBLE"
  | "TRUST_STRENGTH_VISIBILITY_INCOMPLETE"
  | "TRUST_PROPAGATION_VISIBLE"
  | "TRUST_PROPAGATION_VISIBILITY_INCOMPLETE"
  | "TRUST_CONFLICTS_VISIBLE"
  | "TRUST_CONFLICT_VISIBILITY_INCOMPLETE"
  | "TRUST_LINEAGE_VISIBLE"
  | "TRUST_LINEAGE_VISIBILITY_INCOMPLETE"
  | "TRUST_REPLAY_VISIBLE"
  | "TRUST_REPLAY_VISIBILITY_MISSING"
  | "GOVERNANCE_VISIBLE"
  | "GOVERNANCE_VISIBILITY_MISSING"
  | "TRUST_AUDIT_VISIBLE"
  | "TRUST_AUDIT_VISIBILITY_INCOMPLETE"
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
  | "TRUST_RECORD_LIMIT_VALID"
  | "TRUST_RECORD_LIMIT_EXCEEDED"
  | "VISIBLE_PROPAGATION_LIMIT_VALID"
  | "VISIBLE_PROPAGATION_LIMIT_EXCEEDED"
  | "VISIBLE_CONFLICT_LIMIT_VALID"
  | "VISIBLE_CONFLICT_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "TRUST_OBSERVABILITY_IS_NOT_CONTROL";

export type TrustObservabilityEvidencePath = Readonly<{
  scope: TrustObservabilityScope;
  trustReferences: readonly string[];
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

export type TrustObservabilityInput = Readonly<{
  request: TrustObservabilityRequest;
  foundation: SealedRecommendationTrustFoundationRecord;
  analysis: SealedTrustAnalysisRecord;
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
  authorityExpansionDetected?: boolean;
}>;

export type TrustObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: TrustObservabilityResult["observabilityState"];
  reasonCodes: readonly TrustObservabilityReasonCode[];
  trustGraphVisible: boolean;
  trustStrengthVisible: boolean;
  trustPropagationVisible: boolean;
  trustConflictsVisible: boolean;
  trustLineageVisible: boolean;
  trustGovernanceVisible: boolean;
  trustReplayVisible: boolean;
  trustAuditVisible: boolean;
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

export type TrustObservabilityObservability = Readonly<{
  tenantId: string;
  observabilityState: TrustObservabilityResult["observabilityState"];
  trustGraphVisible: boolean;
  trustStrengthVisible: boolean;
  trustPropagationVisible: boolean;
  trustLineageVisible: boolean;
  trustGovernanceVisible: boolean;
  trustReplayVisible: boolean;
  trustAuditVisible: boolean;
  observabilityHash: string;
}>;

export type SealedTrustObservabilityRecord = Readonly<{
  result: Readonly<TrustObservabilityResult>;
  evidencePath: TrustObservabilityEvidencePath;
  validation: TrustObservabilityValidation;
  observability: TrustObservabilityObservability;
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

export interface TrustReplayRequest {
  tenantId: string;
  replayScope:
    | "TRUST"
    | "STRENGTH"
    | "PROPAGATION"
    | "CONFLICTS"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface TrustReplayResult {
  tenantId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  trustReconstructed: boolean;
  strengthReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type TrustReplayScope = TrustReplayRequest["replayScope"];

export type TrustReplayReasonCode =
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
  | "TRUST_RECONSTRUCTED"
  | "TRUST_EVIDENCE_MISSING"
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
  | "TRUST_RECORD_LIMIT_VALID"
  | "TRUST_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "TRUST_REPLAY_IS_NOT_CONTROL";

export type TrustReplayEvidencePath = Readonly<{
  scope: TrustReplayScope;
  trustReferences: readonly string[];
  strengthReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type TrustReplayInput = Readonly<{
  request: TrustReplayRequest;
  foundation: SealedRecommendationTrustFoundationRecord;
  analysis: SealedTrustAnalysisRecord;
  observability: SealedTrustObservabilityRecord;
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
  authorityExpansionDetected?: boolean;
}>;

export type TrustReplayValidation = Readonly<{
  valid: boolean;
  replayState: TrustReplayResult["replayState"];
  reasonCodes: readonly TrustReplayReasonCode[];
  trustReconstructed: boolean;
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
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type TrustReplayObservability = Readonly<{
  tenantId: string;
  replayState: TrustReplayResult["replayState"];
  trustReconstructed: boolean;
  strengthReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedTrustReplayRecord = Readonly<{
  result: Readonly<TrustReplayResult>;
  evidencePath: TrustReplayEvidencePath;
  validation: TrustReplayValidation;
  observability: TrustReplayObservability;
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

export interface TrustCertificationRequest {
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

export interface TrustCertificationResult {
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
  tenantIsolationVerified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export type TrustCertificationScope = TrustCertificationRequest["certificationScope"];

export type TrustCertificationReasonCode =
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
  | "TRUST_RECORD_LIMIT_VALID"
  | "TRUST_RECORD_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "TRUST_CERTIFICATION_IS_NOT_CONTROL";

export type TrustCertificationEvidencePath = Readonly<{
  scope: TrustCertificationScope;
  trustReferences: readonly string[];
  strengthReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type TrustCertificationInput = Readonly<{
  request: TrustCertificationRequest;
  foundation: SealedRecommendationTrustFoundationRecord;
  analysis: SealedTrustAnalysisRecord;
  observability: SealedTrustObservabilityRecord;
  replay: SealedTrustReplayRecord;
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
  authorityExpansionDetected?: boolean;
}>;

export type TrustCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: TrustCertificationResult["certificationState"];
  reasonCodes: readonly TrustCertificationReasonCode[];
  integrityCertified: boolean;
  strengthCertified: boolean;
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

export type TrustCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: TrustCertificationResult["certificationState"];
  integrityCertified: boolean;
  strengthCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  certificationHash: string;
}>;

export type SealedTrustCertificationRecord = Readonly<{
  result: Readonly<TrustCertificationResult>;
  evidencePath: TrustCertificationEvidencePath;
  validation: TrustCertificationValidation;
  observability: TrustCertificationObservability;
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
