import type {
  RecommendationPortfolioBundle,
  SealedPortfolioCertificationRecord,
  SealedPortfolioObservabilityRecord,
  SealedPortfolioRelationshipAnalysisRecord,
  SealedPortfolioReplayRecord,
  SealedRecommendationPortfolioRecord,
} from "@/services/recommendation-portfolio";
import type {
  SealedDependencyAnalysisRecord,
  SealedDependencyCertificationRecord,
  SealedDependencyObservabilityRecord,
  SealedDependencyReplayRecord,
  SealedRecommendationDependencyFoundationRecord,
} from "@/services/recommendation-dependency";
import type {
  SealedImpactAnalysisRecord,
  SealedImpactCertificationRecord,
  SealedImpactObservabilityRecord,
  SealedImpactReplayRecord,
  SealedRecommendationImpactFoundationRecord,
} from "@/services/recommendation-impact";

export type RecommendationDriftType =
  | "EVIDENCE_DRIFT"
  | "LINEAGE_DRIFT"
  | "GOVERNANCE_DRIFT"
  | "REPLAY_DRIFT"
  | "READINESS_DRIFT"
  | "PORTFOLIO_DRIFT"
  | "DEPENDENCY_DRIFT"
  | "IMPACT_DRIFT";

export interface RecommendationDrift {
  driftId: string;
  recommendationId: string;
  driftType: RecommendationDriftType;
  baselineReference: string;
  currentReference: string;
  driftDetected: boolean;
  driftHash: string;
}

export interface RecommendationDriftFoundationRequest {
  tenantId: string;
  recommendationIds: string[];
  driftScope:
    | "EVIDENCE"
    | "LINEAGE"
    | "GOVERNANCE"
    | "REPLAY"
    | "READINESS"
    | "PORTFOLIO"
    | "DEPENDENCY"
    | "IMPACT"
    | "FULL";
  graphVersion: string;
}

export interface RecommendationDriftFoundationResult {
  tenantId: string;
  driftState:
    | "STABLE"
    | "DRIFT_DETECTED"
    | "OBSERVE"
    | "INVALID";
  driftsCreated: number;
  evidenceDriftsDetected: number;
  lineageDriftsDetected: number;
  governanceDriftsDetected: number;
  replayDriftsDetected: number;
  readinessDriftsDetected: number;
  portfolioDriftsDetected: number;
  dependencyDriftsDetected: number;
  impactDriftsDetected: number;
  tenantIsolationVerified: boolean;
  driftGraphHash: string;
  deterministic: boolean;
}

export type RecommendationDriftScope = RecommendationDriftFoundationRequest["driftScope"];

export type RecommendationDriftFoundationReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "DRIFT_SCOPE_VALID"
  | "DRIFT_SCOPE_INVALID"
  | "BASELINE_REQUIRED"
  | "BASELINE_UNSEALED"
  | "CURRENT_REQUIRED"
  | "CURRENT_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_DRIFT_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_CONTINUITY_PRESERVED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CONTINUITY_PRESERVED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "BASELINE_REFERENCES_PRESENT"
  | "BASELINE_REFERENCES_MISSING"
  | "CURRENT_REFERENCES_PRESENT"
  | "CURRENT_REFERENCES_MISSING"
  | "EVIDENCE_DRIFT_STABLE"
  | "EVIDENCE_DRIFT_DETECTED"
  | "LINEAGE_DRIFT_STABLE"
  | "LINEAGE_DRIFT_DETECTED"
  | "GOVERNANCE_DRIFT_STABLE"
  | "GOVERNANCE_DRIFT_DETECTED"
  | "REPLAY_DRIFT_STABLE"
  | "REPLAY_DRIFT_DETECTED"
  | "READINESS_DRIFT_STABLE"
  | "READINESS_DRIFT_DETECTED"
  | "PORTFOLIO_DRIFT_STABLE"
  | "PORTFOLIO_DRIFT_DETECTED"
  | "DEPENDENCY_DRIFT_STABLE"
  | "DEPENDENCY_DRIFT_DETECTED"
  | "IMPACT_DRIFT_STABLE"
  | "IMPACT_DRIFT_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "PRIORITIZATION_BLOCKED"
  | "PRIORITIZATION_DETECTED"
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "DRIFT_MUTATION_BLOCKED"
  | "DRIFT_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "DRIFT_LIMIT_VALID"
  | "DRIFT_LIMIT_EXCEEDED"
  | "BASELINE_REFERENCE_LIMIT_VALID"
  | "BASELINE_REFERENCE_LIMIT_EXCEEDED"
  | "CURRENT_REFERENCE_LIMIT_VALID"
  | "CURRENT_REFERENCE_LIMIT_EXCEEDED"
  | "DRIFT_FOUNDATION_IS_NOT_CONTROL";

export type RecommendationDriftEvidencePath = Readonly<{
  scope: RecommendationDriftScope;
  driftReferences: readonly string[];
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
  evidenceHashes: readonly string[];
}>;

export type RecommendationDriftFoundationInput = Readonly<{
  request: RecommendationDriftFoundationRequest;
  baselineImpactFoundation: SealedRecommendationImpactFoundationRecord;
  currentImpactFoundation: SealedRecommendationImpactFoundationRecord;
  baselineImpactAnalysis: SealedImpactAnalysisRecord;
  currentImpactAnalysis: SealedImpactAnalysisRecord;
  baselineImpactObservability: SealedImpactObservabilityRecord;
  currentImpactObservability: SealedImpactObservabilityRecord;
  baselineImpactReplay: SealedImpactReplayRecord;
  currentImpactReplay: SealedImpactReplayRecord;
  baselineImpactCertification: SealedImpactCertificationRecord;
  currentImpactCertification: SealedImpactCertificationRecord;
  baselineDependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  currentDependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  baselineDependencyAnalysis: SealedDependencyAnalysisRecord;
  currentDependencyAnalysis: SealedDependencyAnalysisRecord;
  baselineDependencyReplay: SealedDependencyReplayRecord;
  currentDependencyReplay: SealedDependencyReplayRecord;
  baselineDependencyCertification: SealedDependencyCertificationRecord;
  currentDependencyCertification: SealedDependencyCertificationRecord;
  baselinePortfolio: SealedRecommendationPortfolioRecord;
  currentPortfolio: SealedRecommendationPortfolioRecord;
  baselineRelationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  currentRelationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  baselinePortfolioReplay: SealedPortfolioReplayRecord;
  currentPortfolioReplay: SealedPortfolioReplayRecord;
  baselinePortfolioCertification: SealedPortfolioCertificationRecord;
  currentPortfolioCertification: SealedPortfolioCertificationRecord;
  baselineRecommendations: readonly RecommendationPortfolioBundle[];
  currentRecommendations: readonly RecommendationPortfolioBundle[];
  driftMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationDriftFoundationValidation = Readonly<{
  valid: boolean;
  driftState: RecommendationDriftFoundationResult["driftState"];
  reasonCodes: readonly RecommendationDriftFoundationReasonCode[];
  evidenceDriftDetected: boolean;
  lineageDriftDetected: boolean;
  governanceDriftDetected: boolean;
  replayDriftDetected: boolean;
  readinessDriftDetected: boolean;
  portfolioDriftDetected: boolean;
  dependencyDriftDetected: boolean;
  impactDriftDetected: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
  driftsCreated: number;
  baselineReferenceCount: number;
  currentReferenceCount: number;
}>;

export type RecommendationDriftFoundationObservability = Readonly<{
  tenantId: string;
  driftState: RecommendationDriftFoundationResult["driftState"];
  driftsCreated: number;
  evidenceDriftsDetected: number;
  lineageDriftsDetected: number;
  governanceDriftsDetected: number;
  replayDriftsDetected: number;
  readinessDriftsDetected: number;
  portfolioDriftsDetected: number;
  dependencyDriftsDetected: number;
  impactDriftsDetected: number;
  driftGraphHash: string;
}>;

export type SealedRecommendationDriftFoundationRecord = Readonly<{
  result: Readonly<RecommendationDriftFoundationResult>;
  drifts: readonly RecommendationDrift[];
  evidencePath: RecommendationDriftEvidencePath;
  validation: RecommendationDriftFoundationValidation;
  observability: RecommendationDriftFoundationObservability;
  sealed: true;
  readOnly: true;
  driftOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DriftAnalysisRequest {
  tenantId: string;
  recommendationIds: string[];
  analysisScope:
    | "SEVERITY"
    | "PROPAGATION"
    | "CONCENTRATION"
    | "GAPS"
    | "CONFLICTS"
    | "FULL";
  graphVersion: string;
}

export interface DriftAnalysisResult {
  tenantId: string;
  analysisState:
    | "ANALYZED"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  driftSeveritiesDetected: number;
  propagationPathsDetected: number;
  driftConcentrationsDetected: number;
  driftGapsDetected: number;
  driftConflictsDetected: number;
  tenantIsolationVerified: boolean;
  analysisHash: string;
  deterministic: boolean;
}

export type DriftAnalysisScope = DriftAnalysisRequest["analysisScope"];

export type DriftSeverity = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type DriftAnalysisReasonCode =
  | "RECOMMENDATION_IDS_PRESENT"
  | "RECOMMENDATION_IDS_MISSING"
  | "ANALYSIS_SCOPE_VALID"
  | "ANALYSIS_SCOPE_INVALID"
  | "FOUNDATION_REQUIRED"
  | "FOUNDATION_UNSEALED"
  | "SEALED_ARTIFACTS_VERIFIED"
  | "UNSEALED_ARTIFACTS_BLOCKED"
  | "MEMBERSHIP_COMPLETE"
  | "DRIFT_EVIDENCE_MISSING"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_DRIFT_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "SEVERITY_ANALYZED"
  | "SEVERITY_LIMITED"
  | "PROPAGATION_ANALYZED"
  | "PROPAGATION_LIMITED"
  | "CONCENTRATION_ANALYZED"
  | "CONCENTRATION_LIMITED"
  | "DRIFT_GAPS_DETECTED"
  | "DRIFT_GAPS_ABSENT"
  | "DRIFT_CONFLICTS_DETECTED"
  | "DRIFT_CONFLICTS_ABSENT"
  | "GOVERNANCE_CONTINUITY_PRESERVED"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "REPLAY_CONTINUITY_PRESERVED"
  | "REPLAY_CORRUPTION_DETECTED"
  | "DRIFT_REFERENCES_PRESENT"
  | "DRIFT_REFERENCES_MISSING"
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
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "ANALYSIS_MUTATION_BLOCKED"
  | "ANALYSIS_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "RECOMMENDATION_LIMIT_VALID"
  | "RECOMMENDATION_LIMIT_EXCEEDED"
  | "DRIFT_LIMIT_VALID"
  | "DRIFT_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "CONFLICT_LIMIT_VALID"
  | "CONFLICT_LIMIT_EXCEEDED"
  | "DRIFT_ANALYSIS_IS_NOT_CONTROL";

export type DriftAnalysisEvidencePath = Readonly<{
  scope: DriftAnalysisScope;
  driftReferences: readonly string[];
  severityReferences: readonly string[];
  propagationReferences: readonly string[];
  concentrationReferences: readonly string[];
  gapReferences: readonly string[];
  conflictReferences: readonly string[];
  baselineReferences: readonly string[];
  currentReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DriftAnalysisInput = Readonly<{
  request: DriftAnalysisRequest;
  foundation: SealedRecommendationDriftFoundationRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactAnalysis: SealedImpactAnalysisRecord;
  impactReplay: SealedImpactReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
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
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DriftAnalysisValidation = Readonly<{
  valid: boolean;
  analysisState: DriftAnalysisResult["analysisState"];
  reasonCodes: readonly DriftAnalysisReasonCode[];
  driftSeveritiesDetected: number;
  propagationPathsDetected: number;
  driftConcentrationsDetected: number;
  driftGapsDetected: number;
  driftConflictsDetected: number;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
}>;

export type DriftAnalysisObservability = Readonly<{
  tenantId: string;
  analysisState: DriftAnalysisResult["analysisState"];
  driftSeveritiesDetected: number;
  propagationPathsDetected: number;
  driftConcentrationsDetected: number;
  driftGapsDetected: number;
  driftConflictsDetected: number;
  analysisHash: string;
}>;

export type SealedDriftAnalysisRecord = Readonly<{
  result: Readonly<DriftAnalysisResult>;
  evidencePath: DriftAnalysisEvidencePath;
  validation: DriftAnalysisValidation;
  observability: DriftAnalysisObservability;
  sealed: true;
  readOnly: true;
  analysisOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DriftObservabilityRequest {
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

export interface DriftObservabilityResult {
  tenantId: string;
  observabilityState:
    | "VISIBLE"
    | "LIMITED"
    | "OBSERVE"
    | "INVALID";
  driftGraphVisible: boolean;
  driftSeverityVisible: boolean;
  driftPropagationVisible: boolean;
  driftLineageVisible: boolean;
  driftGovernanceVisible: boolean;
  driftReplayVisible: boolean;
  driftAuditVisible: boolean;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type DriftObservabilityScope = DriftObservabilityRequest["observabilityScope"];

export type DriftObservabilityReasonCode =
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
  | "DRIFT_GRAPH_VISIBLE"
  | "DRIFT_GRAPH_VISIBILITY_INCOMPLETE"
  | "DRIFT_SEVERITY_VISIBLE"
  | "DRIFT_SEVERITY_VISIBILITY_INCOMPLETE"
  | "DRIFT_PROPAGATION_VISIBLE"
  | "DRIFT_PROPAGATION_VISIBILITY_INCOMPLETE"
  | "DRIFT_CONFLICTS_VISIBLE"
  | "DRIFT_CONFLICT_VISIBILITY_INCOMPLETE"
  | "DRIFT_LINEAGE_VISIBLE"
  | "DRIFT_LINEAGE_VISIBILITY_INCOMPLETE"
  | "DRIFT_REPLAY_VISIBLE"
  | "DRIFT_REPLAY_VISIBILITY_MISSING"
  | "GOVERNANCE_VISIBLE"
  | "GOVERNANCE_VISIBILITY_MISSING"
  | "DRIFT_AUDIT_VISIBLE"
  | "DRIFT_AUDIT_VISIBILITY_INCOMPLETE"
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
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DRIFT_LIMIT_VALID"
  | "DRIFT_LIMIT_EXCEEDED"
  | "VISIBLE_PROPAGATION_LIMIT_VALID"
  | "VISIBLE_PROPAGATION_LIMIT_EXCEEDED"
  | "VISIBLE_CONFLICT_LIMIT_VALID"
  | "VISIBLE_CONFLICT_LIMIT_EXCEEDED"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "DRIFT_OBSERVABILITY_IS_NOT_CONTROL";

export type DriftObservabilityEvidencePath = Readonly<{
  scope: DriftObservabilityScope;
  driftReferences: readonly string[];
  severityReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  auditReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DriftObservabilityInput = Readonly<{
  request: DriftObservabilityRequest;
  foundation: SealedRecommendationDriftFoundationRecord;
  analysis: SealedDriftAnalysisRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactAnalysis: SealedImpactAnalysisRecord;
  impactObservability: SealedImpactObservabilityRecord;
  impactReplay: SealedImpactReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyAnalysis: SealedDependencyAnalysisRecord;
  dependencyObservability: SealedDependencyObservabilityRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioObservability: SealedPortfolioObservabilityRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  observabilityMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DriftObservabilityValidation = Readonly<{
  valid: boolean;
  observabilityState: DriftObservabilityResult["observabilityState"];
  reasonCodes: readonly DriftObservabilityReasonCode[];
  driftGraphVisible: boolean;
  driftSeverityVisible: boolean;
  driftPropagationVisible: boolean;
  driftConflictsVisible: boolean;
  driftLineageVisible: boolean;
  driftGovernanceVisible: boolean;
  driftReplayVisible: boolean;
  driftAuditVisible: boolean;
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
  visiblePropagationCount: number;
  visibleConflictCount: number;
  visibleReplayReferenceCount: number;
}>;

export type DriftObservabilityObservability = Readonly<{
  tenantId: string;
  observabilityState: DriftObservabilityResult["observabilityState"];
  driftGraphVisible: boolean;
  driftSeverityVisible: boolean;
  driftPropagationVisible: boolean;
  driftLineageVisible: boolean;
  driftGovernanceVisible: boolean;
  driftReplayVisible: boolean;
  driftAuditVisible: boolean;
  observabilityHash: string;
}>;

export type SealedDriftObservabilityRecord = Readonly<{
  result: Readonly<DriftObservabilityResult>;
  evidencePath: DriftObservabilityEvidencePath;
  validation: DriftObservabilityValidation;
  observability: DriftObservabilityObservability;
  sealed: true;
  readOnly: true;
  visibilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DriftReplayRequest {
  tenantId: string;
  replayScope:
    | "DRIFT"
    | "SEVERITY"
    | "PROPAGATION"
    | "CONFLICTS"
    | "FULL";
  replayVersion: string;
  graphVersion: string;
}

export interface DriftReplayResult {
  tenantId: string;
  replayState:
    | "REPLAYABLE"
    | "LIMITED"
    | "ESCALATED"
    | "INVALID";
  driftReconstructed: boolean;
  severityReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type DriftReplayScope = DriftReplayRequest["replayScope"];

export type DriftReplayReasonCode =
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
  | "DRIFT_RECONSTRUCTED"
  | "DRIFT_EVIDENCE_MISSING"
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
  | "APPROVAL_BLOCKED"
  | "APPROVAL_DETECTED"
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DRIFT_LIMIT_VALID"
  | "DRIFT_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "DRIFT_REPLAY_IS_NOT_CONTROL";

export type DriftReplayEvidencePath = Readonly<{
  scope: DriftReplayScope;
  driftReferences: readonly string[];
  severityReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  observabilityReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DriftReplayInput = Readonly<{
  request: DriftReplayRequest;
  foundation: SealedRecommendationDriftFoundationRecord;
  analysis: SealedDriftAnalysisRecord;
  observability: SealedDriftObservabilityRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactAnalysis: SealedImpactAnalysisRecord;
  impactObservability: SealedImpactObservabilityRecord;
  impactReplay: SealedImpactReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyAnalysis: SealedDependencyAnalysisRecord;
  dependencyObservability: SealedDependencyObservabilityRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolio: SealedRecommendationPortfolioRecord;
  relationshipAnalysis: SealedPortfolioRelationshipAnalysisRecord;
  portfolioObservability: SealedPortfolioObservabilityRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  replayMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DriftReplayValidation = Readonly<{
  valid: boolean;
  replayState: DriftReplayResult["replayState"];
  reasonCodes: readonly DriftReplayReasonCode[];
  driftReconstructed: boolean;
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
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type DriftReplayObservability = Readonly<{
  tenantId: string;
  replayState: DriftReplayResult["replayState"];
  driftReconstructed: boolean;
  severityReconstructed: boolean;
  propagationReconstructed: boolean;
  conflictsReconstructed: boolean;
  governanceReconstructed: boolean;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedDriftReplayRecord = Readonly<{
  result: Readonly<DriftReplayResult>;
  evidencePath: DriftReplayEvidencePath;
  validation: DriftReplayValidation;
  observability: DriftReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export interface DriftCertificationRequest {
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

export interface DriftCertificationResult {
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

export type DriftCertificationScope = DriftCertificationRequest["certificationScope"];

export type DriftCertificationReasonCode =
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
  | "REPAIR_ABSENT"
  | "REPAIR_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DRIFT_LIMIT_VALID"
  | "DRIFT_LIMIT_EXCEEDED"
  | "PROPAGATION_LIMIT_VALID"
  | "PROPAGATION_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "DRIFT_CERTIFICATION_IS_NOT_CONTROL";

export type DriftCertificationEvidencePath = Readonly<{
  scope: DriftCertificationScope;
  driftReferences: readonly string[];
  severityReferences: readonly string[];
  propagationReferences: readonly string[];
  conflictReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  governanceReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type DriftCertificationInput = Readonly<{
  request: DriftCertificationRequest;
  foundation: SealedRecommendationDriftFoundationRecord;
  analysis: SealedDriftAnalysisRecord;
  observability: SealedDriftObservabilityRecord;
  replay: SealedDriftReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  recommendations: readonly RecommendationPortfolioBundle[];
  certificationMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  prioritizationRequested?: boolean;
  approvalRequested?: boolean;
  repairRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type DriftCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: DriftCertificationResult["certificationState"];
  reasonCodes: readonly DriftCertificationReasonCode[];
  integrityCertified: boolean;
  severityCertified: boolean;
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
  repairAbsent: boolean;
  controlSurfaceAbsent: boolean;
  propagationCount: number;
  replayReferenceCount: number;
  lineageReferenceCount: number;
}>;

export type DriftCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: DriftCertificationResult["certificationState"];
  integrityCertified: boolean;
  severityCertified: boolean;
  propagationCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  observabilityCertified: boolean;
  certificationHash: string;
}>;

export type SealedDriftCertificationRecord = Readonly<{
  result: Readonly<DriftCertificationResult>;
  evidencePath: DriftCertificationEvidencePath;
  validation: DriftCertificationValidation;
  observability: DriftCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  prioritizationAllowed: false;
  approvalAllowed: false;
  repairAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
