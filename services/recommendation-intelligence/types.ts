import type {
  SealedConstraintCertificationRecord,
  SealedRecommendationConstraintFoundationRecord,
  SealedConstraintReplayRecord,
} from "@/services/recommendation-constraint";
import type {
  SealedDependencyCertificationRecord,
  SealedRecommendationDependencyFoundationRecord,
  SealedDependencyReplayRecord,
} from "@/services/recommendation-dependency";
import type {
  SealedDependencyHealthCertificationRecord,
  SealedRecommendationDependencyHealthFoundationRecord,
  SealedDependencyHealthReplayRecord,
} from "@/services/recommendation-dependency-health";
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
  SealedOpportunityCertificationRecord,
  SealedRecommendationOpportunityFoundationRecord,
  SealedOpportunityReplayRecord,
} from "@/services/recommendation-opportunity";
import type {
  RecommendationPortfolioBundle,
  SealedPortfolioCertificationRecord,
  SealedRecommendationPortfolioRecord,
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

export type RecommendationIntelligenceDomain =
  | "MEMORY"
  | "OBSERVABILITY"
  | "GOVERNANCE"
  | "READINESS"
  | "PORTFOLIO"
  | "DEPENDENCY"
  | "IMPACT"
  | "DRIFT"
  | "TRUST"
  | "RESILIENCE"
  | "DEPENDENCY_RISK"
  | "OPPORTUNITY"
  | "CONSTRAINT"
  | "DEPENDENCY_HEALTH";

export type DomainCompletionState =
  | "COMPLETE"
  | "PARTIAL"
  | "INCOMPLETE"
  | "UNKNOWN";

export interface RecommendationIntelligenceCompletionContract {
  completionId: string;
  tenantId: string;
  domain: RecommendationIntelligenceDomain;
  completionState: DomainCompletionState;
  governanceReference: string;
  lineageReference: string;
  replayReference: string;
  certificationReference: string;
  completionHash: string;
}

export interface RecommendationIntelligenceCompletionRequest {
  tenantId: string;
  graphVersion: string;
}

export interface RecommendationIntelligenceCompletionResult {
  tenantId: string;
  overallCompletionState: DomainCompletionState;
  domainsEvaluated: number;
  completeDomains: number;
  partialDomains: number;
  incompleteDomains: number;
  unknownDomains: number;
  tenantIsolationVerified: boolean;
  completionHash: string;
  deterministic: boolean;
}

export type RecommendationIntelligenceCompletionReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "ARTIFACTS_SEALED"
  | "ARTIFACT_UNSEALED"
  | "ALL_DOMAINS_REPRESENTED"
  | "DOMAIN_REPRESENTATION_INCOMPLETE"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_COMPLETION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_REFERENCES_PRESENT"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "LINEAGE_REFERENCES_PRESENT"
  | "LINEAGE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_PRESENT"
  | "REPLAY_REFERENCES_MISSING"
  | "CERTIFICATION_REFERENCES_PRESENT"
  | "CERTIFICATION_REFERENCES_MISSING"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "COMPLETION_MUTATION_BLOCKED"
  | "COMPLETION_MUTATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DOMAIN_LIMIT_VALID"
  | "DOMAIN_LIMIT_EXCEEDED"
  | "COMPLETION_RECORD_LIMIT_VALID"
  | "COMPLETION_RECORD_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "CERTIFICATION_REFERENCE_LIMIT_VALID"
  | "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_INTELLIGENCE_COMPLETION_IS_NOT_CONTROL";

export type RecommendationIntelligenceCompletionEvidencePath = Readonly<{
  domains: readonly RecommendationIntelligenceDomain[];
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationIntelligenceCompletionInput = Readonly<{
  request: RecommendationIntelligenceCompletionRequest;
  recommendations: readonly RecommendationPortfolioBundle[];
  portfolio: SealedRecommendationPortfolioRecord;
  portfolioReplay: SealedPortfolioReplayRecord;
  portfolioCertification: SealedPortfolioCertificationRecord;
  dependencyFoundation: SealedRecommendationDependencyFoundationRecord;
  dependencyReplay: SealedDependencyReplayRecord;
  dependencyCertification: SealedDependencyCertificationRecord;
  impactFoundation: SealedRecommendationImpactFoundationRecord;
  impactReplay: SealedImpactReplayRecord;
  impactCertification: SealedImpactCertificationRecord;
  driftFoundation: SealedRecommendationDriftFoundationRecord;
  driftReplay: SealedDriftReplayRecord;
  driftCertification: SealedDriftCertificationRecord;
  trustFoundation: SealedRecommendationTrustFoundationRecord;
  trustReplay: SealedTrustReplayRecord;
  trustCertification: SealedTrustCertificationRecord;
  resilienceFoundation: SealedRecommendationResilienceFoundationRecord;
  resilienceReplay: SealedResilienceReplayRecord;
  resilienceCertification: SealedResilienceCertificationRecord;
  dependencyRiskFoundation: SealedDependencyRiskFoundationRecord;
  dependencyRiskReplay: SealedDependencyRiskReplayRecord;
  dependencyRiskCertification: SealedDependencyRiskCertificationRecord;
  opportunityFoundation: SealedRecommendationOpportunityFoundationRecord;
  opportunityReplay: SealedOpportunityReplayRecord;
  opportunityCertification: SealedOpportunityCertificationRecord;
  constraintFoundation: SealedRecommendationConstraintFoundationRecord;
  constraintReplay: SealedConstraintReplayRecord;
  constraintCertification: SealedConstraintCertificationRecord;
  dependencyHealthFoundation: SealedRecommendationDependencyHealthFoundationRecord;
  dependencyHealthReplay: SealedDependencyHealthReplayRecord;
  dependencyHealthCertification: SealedDependencyHealthCertificationRecord;
  completionMutationAttempted?: boolean;
  executionRequested?: boolean;
  workflowRoutingRequested?: boolean;
  approvalRequested?: boolean;
  recommendationRankingRequested?: boolean;
  prioritizationRequested?: boolean;
  recommendationScoringRequested?: boolean;
  resourceAllocationRequested?: boolean;
  authorityExpansionDetected?: boolean;
}>;

export type RecommendationIntelligenceCompletionValidation = Readonly<{
  valid: boolean;
  overallCompletionState: RecommendationIntelligenceCompletionResult["overallCompletionState"];
  reasonCodes: readonly RecommendationIntelligenceCompletionReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  domainsEvaluated: number;
  governanceReferenceCount: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
  certificationReferenceCount: number;
}>;

export type RecommendationIntelligenceCompletionObservability = Readonly<{
  tenantId: string;
  overallCompletionState: RecommendationIntelligenceCompletionResult["overallCompletionState"];
  domainsEvaluated: number;
  completeDomains: number;
  partialDomains: number;
  incompleteDomains: number;
  unknownDomains: number;
  completionHash: string;
}>;

export type SealedRecommendationIntelligenceCompletionRecord = Readonly<{
  result: Readonly<RecommendationIntelligenceCompletionResult>;
  contracts: readonly RecommendationIntelligenceCompletionContract[];
  evidencePath: RecommendationIntelligenceCompletionEvidencePath;
  validation: RecommendationIntelligenceCompletionValidation;
  observability: RecommendationIntelligenceCompletionObservability;
  sealed: true;
  readOnly: true;
  completionOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalAllowed: false;
  recommendationRankingAllowed: false;
  prioritizationAllowed: false;
  recommendationScoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type ValidationDomain = RecommendationIntelligenceDomain;

export type ValidationState = "VALID" | "PARTIAL" | "INVALID" | "UNKNOWN";

export interface CrossDomainValidation {
  validationId: string;
  sourceDomain: ValidationDomain;
  targetDomain: ValidationDomain;
  validationState: ValidationState;
  governanceReference: string;
  lineageReference: string;
  replayReference: string;
  validationHash: string;
}

export interface CrossDomainValidationRequest {
  tenantId: string;
  graphVersion: string;
}

export interface CrossDomainValidationResult {
  tenantId: string;
  overallValidationState: ValidationState;
  domainsEvaluated: number;
  validationsEvaluated: number;
  validValidations: number;
  partialValidations: number;
  invalidValidations: number;
  unknownValidations: number;
  tenantIsolationVerified: boolean;
  validationHash: string;
  deterministic: boolean;
}

export type CrossDomainValidationReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "ARTIFACTS_SEALED"
  | "ARTIFACT_UNSEALED"
  | "COMPLETION_RECORD_SEALED"
  | "COMPLETION_RECORD_UNSEALED"
  | "COMPLETION_REFERENCES_PRESENT"
  | "COMPLETION_REFERENCES_MISSING"
  | "DOMAIN_LIMIT_VALID"
  | "DOMAIN_LIMIT_EXCEEDED"
  | "VALIDATION_RECORD_LIMIT_VALID"
  | "VALIDATION_RECORD_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "CERTIFICATION_REFERENCE_LIMIT_VALID"
  | "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_VALIDATION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_ALIGNMENT_VALID"
  | "GOVERNANCE_CONFLICT_DETECTED"
  | "LINEAGE_CONTINUITY_VALID"
  | "LINEAGE_BREAK_DETECTED"
  | "REPLAY_CONTINUITY_VALID"
  | "REPLAY_BREAK_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "VALIDATION_MUTATION_BLOCKED"
  | "VALIDATION_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "REQUIRED_RELATIONSHIPS_REPRESENTED"
  | "REQUIRED_RELATIONSHIPS_INCOMPLETE"
  | "CROSS_DOMAIN_VALIDATION_IS_NOT_CONTROL";

export type CrossDomainValidationEvidencePath = Readonly<{
  domains: readonly ValidationDomain[];
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type CrossDomainValidationInput = RecommendationIntelligenceCompletionInput & Readonly<{
  completion: SealedRecommendationIntelligenceCompletionRecord;
  request: CrossDomainValidationRequest;
  validationMutationAttempted?: boolean;
}>;

export type CrossDomainValidationValidation = Readonly<{
  valid: boolean;
  overallValidationState: CrossDomainValidationResult["overallValidationState"];
  reasonCodes: readonly CrossDomainValidationReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  governanceAligned: boolean;
  lineageContinuous: boolean;
  replayContinuous: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  domainsEvaluated: number;
  validationsEvaluated: number;
  governanceReferenceCount: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
  certificationReferenceCount: number;
}>;

export type CrossDomainValidationObservability = Readonly<{
  tenantId: string;
  overallValidationState: CrossDomainValidationResult["overallValidationState"];
  domainsEvaluated: number;
  validationsEvaluated: number;
  validValidations: number;
  partialValidations: number;
  invalidValidations: number;
  unknownValidations: number;
  validationHash: string;
}>;

export type SealedCrossDomainValidationRecord = Readonly<{
  result: Readonly<CrossDomainValidationResult>;
  validations: readonly CrossDomainValidation[];
  evidencePath: CrossDomainValidationEvidencePath;
  validation: CrossDomainValidationValidation;
  observability: CrossDomainValidationObservability;
  sealed: true;
  readOnly: true;
  validationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalAllowed: false;
  recommendationRankingAllowed: false;
  prioritizationAllowed: false;
  recommendationScoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type RecommendationIntelligenceVisibilityScope =
  | "SUMMARY"
  | "COMPLETION"
  | "VALIDATION"
  | "GOVERNANCE"
  | "LINEAGE"
  | "REPLAY"
  | "AUDIT"
  | "CERTIFICATION"
  | "FULL";

export type RecommendationIntelligenceObservabilityState =
  | "VISIBLE"
  | "LIMITED"
  | "OBSERVE"
  | "INVALID";

export interface RecommendationIntelligenceObservability {
  observabilityId: string;
  tenantId: string;
  scope: RecommendationIntelligenceVisibilityScope;
  observabilityState: RecommendationIntelligenceObservabilityState;
  governanceReference: string;
  lineageReference: string;
  replayReference: string;
  certificationReference: string;
  observabilityHash: string;
}

export interface RecommendationIntelligenceObservabilityRequest {
  tenantId: string;
  graphVersion: string;
}

export interface RecommendationIntelligenceObservabilityResult {
  tenantId: string;
  overallObservabilityState: RecommendationIntelligenceObservabilityState;
  domainsEvaluated: number;
  scopesEvaluated: number;
  visibleScopes: number;
  limitedScopes: number;
  observeScopes: number;
  invalidScopes: number;
  tenantIsolationVerified: boolean;
  observabilityHash: string;
  deterministic: boolean;
}

export type RecommendationIntelligenceObservabilityReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "ARTIFACTS_SEALED"
  | "ARTIFACT_UNSEALED"
  | "COMPLETION_RECORD_SEALED"
  | "COMPLETION_RECORD_UNSEALED"
  | "VALIDATION_RECORD_SEALED"
  | "VALIDATION_RECORD_UNSEALED"
  | "COMPLETION_VISIBILITY_REPRODUCIBLE"
  | "COMPLETION_VISIBILITY_INCOMPLETE"
  | "VALIDATION_VISIBILITY_REPRODUCIBLE"
  | "VALIDATION_VISIBILITY_INCOMPLETE"
  | "GOVERNANCE_VISIBILITY_REPRODUCIBLE"
  | "GOVERNANCE_VISIBILITY_INCOMPLETE"
  | "LINEAGE_VISIBILITY_REPRODUCIBLE"
  | "LINEAGE_VISIBILITY_INCOMPLETE"
  | "REPLAY_VISIBILITY_REPRODUCIBLE"
  | "REPLAY_VISIBILITY_INCOMPLETE"
  | "AUDIT_VISIBILITY_REPRODUCIBLE"
  | "AUDIT_VISIBILITY_INCOMPLETE"
  | "CERTIFICATION_VISIBILITY_REPRODUCIBLE"
  | "CERTIFICATION_VISIBILITY_INCOMPLETE"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_VISIBILITY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_ALIGNMENT_VALID"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "LINEAGE_CONTINUITY_VALID"
  | "LINEAGE_BREAK_DETECTED"
  | "REPLAY_CONTINUITY_VALID"
  | "REPLAY_CORRUPTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "OBSERVABILITY_MUTATION_BLOCKED"
  | "OBSERVABILITY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "SCOPE_LIMIT_VALID"
  | "SCOPE_LIMIT_EXCEEDED"
  | "VISIBLE_REFERENCE_LIMIT_VALID"
  | "VISIBLE_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "CERTIFICATION_REFERENCE_LIMIT_VALID"
  | "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_INTELLIGENCE_OBSERVABILITY_IS_NOT_CONTROL";

export type RecommendationIntelligenceObservabilityEvidencePath = Readonly<{
  scopes: readonly RecommendationIntelligenceVisibilityScope[];
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationIntelligenceObservabilityInput = CrossDomainValidationInput & Readonly<{
  request: RecommendationIntelligenceObservabilityRequest;
  completion: SealedRecommendationIntelligenceCompletionRecord;
  validationRecord: SealedCrossDomainValidationRecord;
  observabilityMutationAttempted?: boolean;
}>;

export type RecommendationIntelligenceObservabilityValidation = Readonly<{
  valid: boolean;
  overallObservabilityState: RecommendationIntelligenceObservabilityResult["overallObservabilityState"];
  reasonCodes: readonly RecommendationIntelligenceObservabilityReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  governanceAligned: boolean;
  lineageContinuous: boolean;
  replayContinuous: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  domainsEvaluated: number;
  scopesEvaluated: number;
  governanceReferenceCount: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
  certificationReferenceCount: number;
}>;

export type RecommendationIntelligenceLayerObservability = Readonly<{
  tenantId: string;
  overallObservabilityState: RecommendationIntelligenceObservabilityResult["overallObservabilityState"];
  domainsEvaluated: number;
  scopesEvaluated: number;
  visibleScopes: number;
  limitedScopes: number;
  observeScopes: number;
  invalidScopes: number;
  observabilityHash: string;
}>;

export type SealedRecommendationIntelligenceObservabilityRecord = Readonly<{
  result: Readonly<RecommendationIntelligenceObservabilityResult>;
  observabilityRecords: readonly RecommendationIntelligenceObservability[];
  evidencePath: RecommendationIntelligenceObservabilityEvidencePath;
  validation: RecommendationIntelligenceObservabilityValidation;
  observability: RecommendationIntelligenceLayerObservability;
  sealed: true;
  readOnly: true;
  observabilityOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalAllowed: false;
  recommendationRankingAllowed: false;
  prioritizationAllowed: false;
  recommendationScoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type RecommendationReplayScope =
  | "COMPLETION"
  | "VALIDATION"
  | "GOVERNANCE"
  | "LINEAGE"
  | "OBSERVABILITY"
  | "CERTIFICATION"
  | "FULL";

export type RecommendationReplayState =
  | "REPLAYABLE"
  | "LIMITED"
  | "ESCALATED"
  | "INVALID";

export interface RecommendationIntelligenceReplay {
  replayId: string;
  tenantId: string;
  replayScope: RecommendationReplayScope;
  replayState: RecommendationReplayState;
  completionReference: string;
  validationReference: string;
  governanceReference: string;
  lineageReference: string;
  observabilityReference: string;
  certificationReference: string;
  replayHash: string;
  reconstructionHash: string;
}

export interface RecommendationIntelligenceReplayRequest {
  tenantId: string;
  graphVersion: string;
}

export interface RecommendationIntelligenceReplayResult {
  tenantId: string;
  overallReplayState: RecommendationReplayState;
  domainsEvaluated: number;
  scopesEvaluated: number;
  replayableScopes: number;
  limitedScopes: number;
  escalatedScopes: number;
  invalidScopes: number;
  tenantIsolationVerified: boolean;
  replayHash: string;
  reconstructionHash: string;
  deterministic: boolean;
}

export type RecommendationIntelligenceReplayReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "ARTIFACTS_SEALED"
  | "ARTIFACT_UNSEALED"
  | "COMPLETION_RECORD_SEALED"
  | "COMPLETION_RECORD_UNSEALED"
  | "VALIDATION_RECORD_SEALED"
  | "VALIDATION_RECORD_UNSEALED"
  | "OBSERVABILITY_RECORD_SEALED"
  | "OBSERVABILITY_RECORD_UNSEALED"
  | "COMPLETION_RECONSTRUCTION_REPRODUCIBLE"
  | "COMPLETION_RECONSTRUCTION_INCOMPLETE"
  | "VALIDATION_RECONSTRUCTION_REPRODUCIBLE"
  | "VALIDATION_RECONSTRUCTION_INCOMPLETE"
  | "GOVERNANCE_RECONSTRUCTION_REPRODUCIBLE"
  | "GOVERNANCE_RECONSTRUCTION_INCOMPLETE"
  | "LINEAGE_RECONSTRUCTION_REPRODUCIBLE"
  | "LINEAGE_RECONSTRUCTION_INCOMPLETE"
  | "OBSERVABILITY_RECONSTRUCTION_REPRODUCIBLE"
  | "OBSERVABILITY_RECONSTRUCTION_INCOMPLETE"
  | "CERTIFICATION_RECONSTRUCTION_REPRODUCIBLE"
  | "CERTIFICATION_RECONSTRUCTION_INCOMPLETE"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_REPLAY_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_ALIGNMENT_VALID"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "LINEAGE_CONTINUITY_VALID"
  | "LINEAGE_BREAK_DETECTED"
  | "REPLAY_CONTINUITY_VALID"
  | "REPLAY_CORRUPTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "REPLAY_MUTATION_BLOCKED"
  | "REPLAY_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "SCOPE_LIMIT_VALID"
  | "SCOPE_LIMIT_EXCEEDED"
  | "COMPLETION_REFERENCE_LIMIT_VALID"
  | "COMPLETION_REFERENCE_LIMIT_EXCEEDED"
  | "VALIDATION_REFERENCE_LIMIT_VALID"
  | "VALIDATION_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "CERTIFICATION_REFERENCE_LIMIT_VALID"
  | "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_INTELLIGENCE_REPLAY_IS_NOT_CONTROL";

export type RecommendationIntelligenceReplayEvidencePath = Readonly<{
  scopes: readonly RecommendationReplayScope[];
  completionReferences: readonly string[];
  validationReferences: readonly string[];
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationIntelligenceReplayInput = RecommendationIntelligenceObservabilityInput & Readonly<{
  request: RecommendationIntelligenceReplayRequest;
  completion: SealedRecommendationIntelligenceCompletionRecord;
  validationRecord: SealedCrossDomainValidationRecord;
  observabilityRecord: SealedRecommendationIntelligenceObservabilityRecord;
  replayMutationAttempted?: boolean;
}>;

export type RecommendationIntelligenceReplayValidation = Readonly<{
  valid: boolean;
  overallReplayState: RecommendationIntelligenceReplayResult["overallReplayState"];
  reasonCodes: readonly RecommendationIntelligenceReplayReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  governanceAligned: boolean;
  lineageContinuous: boolean;
  replayContinuous: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  domainsEvaluated: number;
  scopesEvaluated: number;
  completionReferenceCount: number;
  validationReferenceCount: number;
  governanceReferenceCount: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
  certificationReferenceCount: number;
}>;

export type RecommendationIntelligenceReplayObservability = Readonly<{
  tenantId: string;
  overallReplayState: RecommendationIntelligenceReplayResult["overallReplayState"];
  domainsEvaluated: number;
  scopesEvaluated: number;
  replayableScopes: number;
  limitedScopes: number;
  escalatedScopes: number;
  invalidScopes: number;
  replayHash: string;
  reconstructionHash: string;
}>;

export type SealedRecommendationIntelligenceReplayRecord = Readonly<{
  result: Readonly<RecommendationIntelligenceReplayResult>;
  replayRecords: readonly RecommendationIntelligenceReplay[];
  evidencePath: RecommendationIntelligenceReplayEvidencePath;
  validation: RecommendationIntelligenceReplayValidation;
  observability: RecommendationIntelligenceReplayObservability;
  sealed: true;
  readOnly: true;
  replayOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalAllowed: false;
  recommendationRankingAllowed: false;
  prioritizationAllowed: false;
  recommendationScoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;

export type RecommendationIntelligenceCertificationState =
  | "PASS"
  | "CONDITIONAL_PASS"
  | "FAIL";

export interface RecommendationIntelligenceCertification {
  certificationId: string;
  tenantId: string;
  certificationState: RecommendationIntelligenceCertificationState;
  completionCertified: boolean;
  validationCertified: boolean;
  observabilityCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  lineageCertified: boolean;
  evidenceCertified: boolean;
  tenantIsolationCertified: boolean;
  certificationHash: string;
  deterministic: boolean;
}

export interface RecommendationIntelligenceCertificationRequest {
  tenantId: string;
  graphVersion: string;
}

export interface RecommendationIntelligenceCertificationResult {
  tenantId: string;
  certificationState: RecommendationIntelligenceCertificationState;
  completionCertified: boolean;
  validationCertified: boolean;
  observabilityCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  lineageCertified: boolean;
  evidenceCertified: boolean;
  tenantIsolationCertified: boolean;
  domainsEvaluated: number;
  certificationHash: string;
  deterministic: boolean;
}

export type RecommendationIntelligenceCertificationReasonCode =
  | "TENANT_ID_PRESENT"
  | "TENANT_ID_MISSING"
  | "ARTIFACTS_SEALED"
  | "ARTIFACT_UNSEALED"
  | "COMPLETION_RECORD_SEALED"
  | "COMPLETION_RECORD_UNSEALED"
  | "VALIDATION_RECORD_SEALED"
  | "VALIDATION_RECORD_UNSEALED"
  | "OBSERVABILITY_RECORD_SEALED"
  | "OBSERVABILITY_RECORD_UNSEALED"
  | "REPLAY_RECORD_SEALED"
  | "REPLAY_RECORD_UNSEALED"
  | "COMPLETION_CERTIFIED"
  | "COMPLETION_NOT_CERTIFIED"
  | "VALIDATION_CERTIFIED"
  | "VALIDATION_NOT_CERTIFIED"
  | "OBSERVABILITY_CERTIFIED"
  | "OBSERVABILITY_NOT_CERTIFIED"
  | "REPLAY_CERTIFIED"
  | "REPLAY_NOT_CERTIFIED"
  | "GOVERNANCE_CERTIFIED"
  | "GOVERNANCE_NOT_CERTIFIED"
  | "LINEAGE_CERTIFIED"
  | "LINEAGE_NOT_CERTIFIED"
  | "EVIDENCE_CERTIFIED"
  | "EVIDENCE_NOT_CERTIFIED"
  | "TENANT_ISOLATION_CERTIFIED"
  | "TENANT_ISOLATION_NOT_CERTIFIED"
  | "TENANT_SCOPE_VALID"
  | "CROSS_TENANT_CERTIFICATION_BLOCKED"
  | "OWNERSHIP_VALID"
  | "OWNERSHIP_MISMATCH"
  | "GOVERNANCE_ALIGNMENT_VALID"
  | "GOVERNANCE_CORRUPTION_DETECTED"
  | "LINEAGE_CONTINUITY_VALID"
  | "LINEAGE_CORRUPTION_DETECTED"
  | "REPLAY_CONTINUITY_VALID"
  | "REPLAY_CORRUPTION_DETECTED"
  | "AUTHORITY_BOUNDED"
  | "AUTHORITY_EXPANSION_DETECTED"
  | "CERTIFICATION_MUTATION_BLOCKED"
  | "CERTIFICATION_MUTATION_DETECTED"
  | "EXECUTION_IMPOSSIBLE"
  | "EXECUTION_REQUEST_BLOCKED"
  | "WORKFLOW_ROUTING_BLOCKED"
  | "WORKFLOW_ROUTING_DETECTED"
  | "APPROVAL_ABSENT"
  | "APPROVAL_DETECTED"
  | "RANKING_ABSENT"
  | "RANKING_DETECTED"
  | "PRIORITIZATION_ABSENT"
  | "PRIORITIZATION_DETECTED"
  | "SCORING_ABSENT"
  | "SCORING_DETECTED"
  | "RESOURCE_ALLOCATION_ABSENT"
  | "RESOURCE_ALLOCATION_DETECTED"
  | "CONTROL_SURFACE_ABSENT"
  | "CONTROL_SURFACE_DETECTED"
  | "DOMAIN_LIMIT_VALID"
  | "DOMAIN_LIMIT_EXCEEDED"
  | "CERTIFICATION_REFERENCE_LIMIT_VALID"
  | "CERTIFICATION_REFERENCE_LIMIT_EXCEEDED"
  | "LINEAGE_REFERENCE_LIMIT_VALID"
  | "LINEAGE_REFERENCE_LIMIT_EXCEEDED"
  | "REPLAY_REFERENCE_LIMIT_VALID"
  | "REPLAY_REFERENCE_LIMIT_EXCEEDED"
  | "GOVERNANCE_REFERENCE_LIMIT_VALID"
  | "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED"
  | "EVIDENCE_REFERENCE_LIMIT_VALID"
  | "EVIDENCE_REFERENCE_LIMIT_EXCEEDED"
  | "RECOMMENDATION_INTELLIGENCE_CERTIFICATION_IS_NOT_CONTROL";

export type RecommendationIntelligenceCertificationEvidencePath = Readonly<{
  domains: readonly RecommendationIntelligenceDomain[];
  governanceReferences: readonly string[];
  lineageReferences: readonly string[];
  replayReferences: readonly string[];
  certificationReferences: readonly string[];
  evidenceHashes: readonly string[];
}>;

export type RecommendationIntelligenceCertificationInput = RecommendationIntelligenceReplayInput & Readonly<{
  request: RecommendationIntelligenceCertificationRequest;
  completion: SealedRecommendationIntelligenceCompletionRecord;
  validationRecord: SealedCrossDomainValidationRecord;
  observabilityRecord: SealedRecommendationIntelligenceObservabilityRecord;
  replayRecord: SealedRecommendationIntelligenceReplayRecord;
  certificationMutationAttempted?: boolean;
}>;

export type RecommendationIntelligenceCertificationValidation = Readonly<{
  valid: boolean;
  certificationState: RecommendationIntelligenceCertificationResult["certificationState"];
  reasonCodes: readonly RecommendationIntelligenceCertificationReasonCode[];
  ownershipValid: boolean;
  tenantIsolationVerified: boolean;
  governanceAligned: boolean;
  lineageContinuous: boolean;
  replayContinuous: boolean;
  deterministic: true;
  readOnly: true;
  executionImpossible: boolean;
  approvalAbsent: boolean;
  rankingAbsent: boolean;
  prioritizationAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  controlSurfaceAbsent: boolean;
  domainsEvaluated: number;
  governanceReferenceCount: number;
  lineageReferenceCount: number;
  replayReferenceCount: number;
  certificationReferenceCount: number;
  evidenceReferenceCount: number;
}>;

export type RecommendationIntelligenceCertificationObservability = Readonly<{
  tenantId: string;
  certificationState: RecommendationIntelligenceCertificationResult["certificationState"];
  completionCertified: boolean;
  validationCertified: boolean;
  observabilityCertified: boolean;
  replayCertified: boolean;
  governanceCertified: boolean;
  lineageCertified: boolean;
  evidenceCertified: boolean;
  tenantIsolationCertified: boolean;
  certificationHash: string;
}>;

export type SealedRecommendationIntelligenceCertificationRecord = Readonly<{
  result: Readonly<RecommendationIntelligenceCertificationResult>;
  certification: RecommendationIntelligenceCertification;
  evidencePath: RecommendationIntelligenceCertificationEvidencePath;
  validation: RecommendationIntelligenceCertificationValidation;
  observability: RecommendationIntelligenceCertificationObservability;
  sealed: true;
  readOnly: true;
  certificationOnly: true;
  executionAuthorized: false;
  workflowRoutingAllowed: false;
  approvalAllowed: false;
  recommendationRankingAllowed: false;
  prioritizationAllowed: false;
  recommendationScoringAllowed: false;
  resourceAllocationAllowed: false;
  authorityMutationAllowed: false;
  controlSurfacePresent: false;
}>;
