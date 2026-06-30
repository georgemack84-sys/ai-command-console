import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyHealthAnalysisEvidencePath,
  DependencyHealthAnalysisInput,
  DependencyHealthAnalysisObservability,
  DependencyHealthAnalysisReasonCode,
  DependencyHealthAnalysisRequest,
  DependencyHealthAnalysisResult,
  DependencyHealthAnalysisScope,
  DependencyHealthAnalysisValidation,
  DependencyHealthCondition,
  DependencyHealthType,
  RecommendationDependencyHealth,
  SealedDependencyHealthAnalysisRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_DEPENDENCY_HEALTH_RECORDS = 50_000;
const MAX_DEPENDENCIES = 50_000;
const MAX_ANALYSIS_REFERENCES = 10_000;

const ANALYSIS_SCOPES: readonly DependencyHealthAnalysisScope[] = Object.freeze([
  "STABILITY",
  "AVAILABILITY",
  "CONTINUITY",
  "RECOVERABILITY",
  "DEGRADATION",
  "RISK",
  "OBSERVABILITY",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  scoringBlocked: boolean;
  resourceAllocationBlocked: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DependencyHealthAnalysisReasonCode[], reason: DependencyHealthAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyHealthAnalysisRequest): DependencyHealthAnalysisRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    analysisScope: request.analysisScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DependencyHealthAnalysisInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function orderedHealthRecords(input: DependencyHealthAnalysisInput): RecommendationDependencyHealth[] {
  return [...input.foundation.healthRecords].sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.dependencyId.localeCompare(right.dependencyId)
    || left.healthType.localeCompare(right.healthType)
    || left.healthId.localeCompare(right.healthId)
  ));
}

function includesScope(scope: DependencyHealthAnalysisScope, requested: DependencyHealthAnalysisScope): boolean {
  return scope === "FULL" || scope === requested;
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "prioritizationAllowed",
    "recommendationRankingAllowed",
    "approvalAllowed",
    "recommendationScoringAllowed",
    "resourceAllocationAllowed",
    "authorityMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function governanceIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL";
}

function replayIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.replay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED";
}

function conditionReference(record: RecommendationDependencyHealth): string {
  return record.evidenceReference
    || record.lineageReference
    || record.replayReference
    || record.governanceReference
    || record.dependencyId;
}

function createCondition(record: RecommendationDependencyHealth): DependencyHealthCondition {
  const reference = conditionReference(record);
  return Object.freeze({
    conditionId: hashAnalysisValue("dependency-health-condition-id", {
      recommendationId: record.recommendationId,
      dependencyId: record.dependencyId,
      healthType: record.healthType,
      reference,
    }),
    recommendationId: record.recommendationId,
    dependencyId: record.dependencyId,
    healthType: record.healthType,
    healthState: record.healthState,
    conditionReference: reference,
    conditionHash: hashAnalysisValue("dependency-health-condition", {
      recommendationId: record.recommendationId,
      dependencyId: record.dependencyId,
      healthType: record.healthType,
      healthState: record.healthState,
      reference,
    }),
  });
}

function filterConditions(
  input: DependencyHealthAnalysisInput,
  type: DependencyHealthType,
): DependencyHealthCondition[] {
  return orderedHealthRecords(input)
    .filter((record) => record.healthType === type)
    .map(createCondition);
}

function analyzeDomain(
  conditions: readonly DependencyHealthCondition[],
  analyzedReason: DependencyHealthAnalysisReasonCode,
  limitedReason: DependencyHealthAnalysisReasonCode,
  reasons: DependencyHealthAnalysisReasonCode[],
): boolean {
  const analyzed = conditions.every((condition) => condition.healthState === "HEALTHY");
  addReason(reasons, analyzed ? analyzedReason : limitedReason);
  return analyzed;
}

function validateScope(scope: DependencyHealthAnalysisScope, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: DependencyHealthAnalysisRequest, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateFoundation(input: DependencyHealthAnalysisInput, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyHealthAnalysisInput, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.constraintFoundation.sealed === true
    && input.constraintReplay.sealed === true
    && input.constraintCertification.sealed === true
    && input.opportunityFoundation.sealed === true
    && input.opportunityReplay.sealed === true
    && input.opportunityCertification.sealed === true
    && input.dependencyRiskFoundation.sealed === true
    && input.dependencyRiskReplay.sealed === true
    && input.dependencyRiskCertification.sealed === true
    && input.dependencyFoundation.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.impactFoundation.sealed === true
    && input.impactReplay.sealed === true
    && input.impactCertification.sealed === true
    && input.trustFoundation.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftFoundation.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceFoundation.sealed === true
    && input.resilienceReplay.sealed === true
    && input.resilienceCertification.sealed === true
    && input.portfolio.sealed === true
    && input.portfolioReplay.sealed === true
    && input.portfolioCertification.sealed === true
    && orderedBundles(input).every((bundle) => [
      bundle.readiness,
      bundle.alignment,
      bundle.reviewPacket,
      bundle.replayFramework,
      bundle.readinessCertification,
      bundle.ledger,
      bundle.lineage,
      bundle.verification,
      bundle.replay,
      bundle.integrity,
      bundle.certification,
      bundle.observability,
      bundle.inspection,
      bundle.visibility,
      bundle.audit,
      bundle.observabilityCertification,
      bundle.binding,
      bundle.authorityScope,
      bundle.policyVisibility,
      bundle.governanceReplay,
      bundle.governanceCertification,
      bundle.governanceReferences,
      bundle.ownershipEvidence,
      bundle.replayEvidence,
    ].every((record) => record.sealed === true));

  addReason(reasons, input.constraintFoundation.sealed === true ? "CONSTRAINT_FOUNDATION_REQUIRED" : "CONSTRAINT_FOUNDATION_UNSEALED");
  addReason(reasons, input.constraintReplay.sealed === true ? "CONSTRAINT_REPLAY_REQUIRED" : "CONSTRAINT_REPLAY_UNSEALED");
  addReason(reasons, input.constraintCertification.sealed === true ? "CONSTRAINT_CERTIFICATION_REQUIRED" : "CONSTRAINT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.opportunityFoundation.sealed === true ? "OPPORTUNITY_FOUNDATION_REQUIRED" : "OPPORTUNITY_FOUNDATION_UNSEALED");
  addReason(reasons, input.opportunityReplay.sealed === true ? "OPPORTUNITY_REPLAY_REQUIRED" : "OPPORTUNITY_REPLAY_UNSEALED");
  addReason(reasons, input.opportunityCertification.sealed === true ? "OPPORTUNITY_CERTIFICATION_REQUIRED" : "OPPORTUNITY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyRiskFoundation.sealed === true ? "DEPENDENCY_RISK_FOUNDATION_REQUIRED" : "DEPENDENCY_RISK_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyRiskReplay.sealed === true ? "DEPENDENCY_RISK_REPLAY_REQUIRED" : "DEPENDENCY_RISK_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyRiskCertification.sealed === true ? "DEPENDENCY_RISK_CERTIFICATION_REQUIRED" : "DEPENDENCY_RISK_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyFoundation.sealed === true ? "DEPENDENCY_FOUNDATION_REQUIRED" : "DEPENDENCY_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyReplay.sealed === true ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactFoundation.sealed === true ? "IMPACT_FOUNDATION_REQUIRED" : "IMPACT_FOUNDATION_UNSEALED");
  addReason(reasons, input.impactReplay.sealed === true ? "IMPACT_REPLAY_REQUIRED" : "IMPACT_REPLAY_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustFoundation.sealed === true ? "TRUST_FOUNDATION_REQUIRED" : "TRUST_FOUNDATION_UNSEALED");
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftFoundation.sealed === true ? "DRIFT_FOUNDATION_REQUIRED" : "DRIFT_FOUNDATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceFoundation.sealed === true ? "RESILIENCE_FOUNDATION_REQUIRED" : "RESILIENCE_FOUNDATION_UNSEALED");
  addReason(reasons, input.resilienceReplay.sealed === true ? "RESILIENCE_REPLAY_REQUIRED" : "RESILIENCE_REPLAY_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolio.sealed === true ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  addReason(reasons, input.portfolioReplay.sealed === true ? "PORTFOLIO_REPLAY_REQUIRED" : "PORTFOLIO_REPLAY_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyHealthAnalysisInput, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.constraintFoundation.result.tenantIsolationVerified
    && input.constraintReplay.result.tenantIsolationVerified
    && input.constraintCertification.result.tenantIsolationVerified
    && input.opportunityFoundation.result.tenantIsolationVerified
    && input.opportunityReplay.result.tenantIsolationVerified
    && input.opportunityCertification.result.tenantIsolationVerified
    && input.dependencyRiskFoundation.result.tenantIsolationVerified
    && input.dependencyRiskReplay.result.tenantIsolationVerified
    && input.dependencyRiskCertification.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
    && input.impactReplay.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.trustFoundation.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftFoundation.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceFoundation.result.tenantIsolationVerified
    && input.resilienceReplay.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.portfolioReplay.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
      && bundle.readinessCertification.result.tenantIsolationVerified
      && bundle.observabilityCertification.result.tenantIsolationVerified
      && bundle.governanceCertification.result.tenantIsolationVerified
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_HEALTH_ANALYSIS_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyHealthAnalysisInput, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateHealthEvidence(input: DependencyHealthAnalysisInput, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const evidencePresent = input.foundation.healthRecords.length > 0
    && input.foundation.evidencePath.healthReferences.length > 0;
  addReason(reasons, evidencePresent ? "HEALTH_EVIDENCE_PRESENT" : "HEALTH_EVIDENCE_MISSING");
  addReason(reasons, input.foundation.evidencePath.governanceReferences.length > 0 ? "GOVERNANCE_REFERENCES_PRESENT" : "GOVERNANCE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.replayReferences.length > 0 ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.observabilityReferences.length > 0 ? "OBSERVABILITY_REFERENCES_PRESENT" : "OBSERVABILITY_REFERENCES_MISSING");
  return evidencePresent;
}

function validateGovernance(input: DependencyHealthAnalysisInput, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const valid = input.constraintCertification.result.governanceCertified
    && input.opportunityCertification.result.governanceCertified
    && input.dependencyRiskCertification.result.governanceCertified
    && input.dependencyCertification.result.governanceCertified
    && input.impactCertification.result.governanceCertified
    && input.trustCertification.result.governanceCertified
    && input.driftCertification.result.governanceCertified
    && input.resilienceCertification.result.governanceCertified
    && input.portfolioCertification.result.governanceCertified
    && !input.foundation.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    && orderedBundles(input).every(governanceIntegrity);
  addReason(reasons, valid ? "GOVERNANCE_CONTINUITY_PRESERVED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: DependencyHealthAnalysisInput, reasons: DependencyHealthAnalysisReasonCode[]): boolean {
  const valid = input.constraintReplay.result.replayState !== "INVALID"
    && input.constraintReplay.result.replayState !== "ESCALATED"
    && input.opportunityReplay.result.replayState !== "INVALID"
    && input.opportunityReplay.result.replayState !== "ESCALATED"
    && input.dependencyRiskReplay.result.replayState !== "INVALID"
    && input.dependencyRiskReplay.result.replayState !== "ESCALATED"
    && input.dependencyReplay.result.replayState !== "INVALID"
    && input.dependencyReplay.result.replayState !== "ESCALATED"
    && input.impactReplay.result.replayState !== "INVALID"
    && input.impactReplay.result.replayState !== "ESCALATED"
    && input.trustReplay.result.replayState !== "INVALID"
    && input.trustReplay.result.replayState !== "ESCALATED"
    && input.driftReplay.result.replayState !== "INVALID"
    && input.driftReplay.result.replayState !== "ESCALATED"
    && input.resilienceReplay.result.replayState !== "INVALID"
    && input.resilienceReplay.result.replayState !== "ESCALATED"
    && input.portfolioReplay.result.replayState !== "INVALID"
    && input.portfolioReplay.result.replayState !== "ESCALATED"
    && !input.foundation.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    && orderedBundles(input).every(replayIntegrity);
  addReason(reasons, valid ? "REPLAY_CONTINUITY_PRESERVED" : "REPLAY_CORRUPTION_DETECTED");
  return valid;
}

function validateBoundary(input: DependencyHealthAnalysisInput, reasons: DependencyHealthAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const scoringBlocked = input.recommendationScoringRequested !== true;
  const resourceAllocationBlocked = input.resourceAllocationRequested !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.constraintFoundation.controlSurfacePresent
    && !input.constraintReplay.controlSurfacePresent
    && !input.constraintCertification.controlSurfacePresent
    && !input.opportunityFoundation.controlSurfacePresent
    && !input.opportunityReplay.controlSurfacePresent
    && !input.opportunityCertification.controlSurfacePresent
    && !input.dependencyRiskFoundation.controlSurfacePresent
    && !input.dependencyRiskReplay.controlSurfacePresent
    && !input.dependencyRiskCertification.controlSurfacePresent
    && !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.impactFoundation.controlSurfacePresent
    && !input.impactReplay.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.trustFoundation.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftFoundation.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceFoundation.controlSurfacePresent
    && !input.resilienceReplay.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.portfolio.controlSurfacePresent
    && !input.portfolioReplay.controlSurfacePresent
    && !input.portfolioCertification.controlSurfacePresent
    && orderedBundles(input).every((bundle) => [
      bundle.readiness,
      bundle.alignment,
      bundle.reviewPacket,
      bundle.replayFramework,
      bundle.readinessCertification,
      bundle.ledger,
      bundle.lineage,
      bundle.verification,
      bundle.replay,
      bundle.integrity,
      bundle.certification,
      bundle.observability,
      bundle.inspection,
      bundle.visibility,
      bundle.audit,
      bundle.observabilityCertification,
      bundle.binding,
      bundle.authorityScope,
      bundle.policyVisibility,
      bundle.governanceReplay,
      bundle.governanceCertification,
    ].every(createBoundaryFlags));

  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RANKING_DETECTED" : "RANKING_BLOCKED");
  addReason(reasons, input.approvalRequested === true ? "APPROVAL_DETECTED" : "APPROVAL_BLOCKED");
  addReason(reasons, scoringBlocked ? "SCORING_BLOCKED" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationBlocked ? "RESOURCE_ALLOCATION_BLOCKED" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");

  return Object.freeze({
    executionImpossible,
    authorityBounded,
    scoringBlocked,
    resourceAllocationBlocked,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !scoringBlocked
      || !resourceAllocationBlocked
      || !authorityBounded
      || input.analysisMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyHealthAnalysisEvidencePath(
  input: DependencyHealthAnalysisInput,
  stabilityConditions: readonly DependencyHealthCondition[],
  availabilityConditions: readonly DependencyHealthCondition[],
  continuityConditions: readonly DependencyHealthCondition[],
  recoverabilityConditions: readonly DependencyHealthCondition[],
  degradationConditions: readonly DependencyHealthCondition[],
  riskConditions: readonly DependencyHealthCondition[],
  observabilityConditions: readonly DependencyHealthCondition[],
): DependencyHealthAnalysisEvidencePath {
  const allConditions = [
    ...stabilityConditions,
    ...availabilityConditions,
    ...continuityConditions,
    ...recoverabilityConditions,
    ...degradationConditions,
    ...riskConditions,
    ...observabilityConditions,
  ];

  return Object.freeze({
    scope: input.request.analysisScope,
    healthReferences: normalizeStrings(input.foundation.healthRecords.map((record) => record.healthId)),
    stabilityReferences: normalizeStrings(stabilityConditions.map((condition) => `${condition.recommendationId}:${condition.dependencyId}:${condition.healthState}`)),
    availabilityReferences: normalizeStrings(availabilityConditions.map((condition) => `${condition.recommendationId}:${condition.dependencyId}:${condition.healthState}`)),
    continuityReferences: normalizeStrings(continuityConditions.map((condition) => `${condition.recommendationId}:${condition.dependencyId}:${condition.healthState}`)),
    recoverabilityReferences: normalizeStrings(recoverabilityConditions.map((condition) => `${condition.recommendationId}:${condition.dependencyId}:${condition.healthState}`)),
    degradationReferences: normalizeStrings(degradationConditions.map((condition) => `${condition.recommendationId}:${condition.dependencyId}:${condition.healthState}`)),
    riskReferences: normalizeStrings(riskConditions.map((condition) => `${condition.recommendationId}:${condition.dependencyId}:${condition.healthState}`)),
    observabilityReferences: normalizeStrings(observabilityConditions.map((condition) => `${condition.recommendationId}:${condition.dependencyId}:${condition.healthState}`)),
    governanceReferences: normalizeStrings(input.foundation.evidencePath.governanceReferences),
    lineageReferences: normalizeStrings(input.foundation.evidencePath.lineageReferences),
    replayReferences: normalizeStrings(input.foundation.evidencePath.replayReferences),
    recommendationReferences: normalizeStrings(input.request.recommendationIds),
    evidenceHashes: normalizeStrings([
      input.foundation.result.healthGraphHash,
      input.constraintFoundation.result.constraintGraphHash,
      input.constraintReplay.result.replayHash,
      input.constraintCertification.result.certificationHash,
      input.opportunityFoundation.result.opportunityGraphHash,
      input.opportunityReplay.result.replayHash,
      input.opportunityCertification.result.certificationHash,
      input.dependencyRiskFoundation.result.dependencyRiskGraphHash,
      input.dependencyRiskReplay.result.replayHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.impactFoundation.result.impactGraphHash,
      input.impactReplay.result.replayHash,
      input.impactCertification.result.certificationHash,
      input.trustFoundation.result.trustGraphHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftFoundation.result.driftGraphHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.resilienceFoundation.result.resilienceGraphHash,
      input.resilienceReplay.result.replayHash,
      input.resilienceCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...allConditions.map((condition) => condition.conditionHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  healthRecordCount: number,
  dependencyCount: number,
  analysisReferenceCount: number,
  reasons: DependencyHealthAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS
    && dependencyCount <= MAX_DEPENDENCIES
    && analysisReferenceCount <= MAX_ANALYSIS_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS ? "DEPENDENCY_HEALTH_RECORD_LIMIT_VALID" : "DEPENDENCY_HEALTH_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, dependencyCount <= MAX_DEPENDENCIES ? "DEPENDENCY_LIMIT_VALID" : "DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, analysisReferenceCount <= MAX_ANALYSIS_REFERENCES ? "ANALYSIS_REFERENCE_LIMIT_VALID" : "ANALYSIS_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyHealthAnalysisRequest,
  analysisState: DependencyHealthAnalysisResult["analysisState"],
  stabilityConditions: readonly DependencyHealthCondition[],
  availabilityConditions: readonly DependencyHealthCondition[],
  continuityConditions: readonly DependencyHealthCondition[],
  recoverabilityConditions: readonly DependencyHealthCondition[],
  degradationConditions: readonly DependencyHealthCondition[],
  riskConditions: readonly DependencyHealthCondition[],
  observabilityConditions: readonly DependencyHealthCondition[],
  tenantIsolationVerified: boolean,
  analysisHash: string,
): DependencyHealthAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    stabilityConditionsDetected: stabilityConditions.length,
    availabilityConditionsDetected: availabilityConditions.length,
    continuityConditionsDetected: continuityConditions.length,
    recoverabilityConditionsDetected: recoverabilityConditions.length,
    degradationConditionsDetected: degradationConditions.length,
    riskConditionsDetected: riskConditions.length,
    observabilityConditionsDetected: observabilityConditions.length,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyHealthAnalysisResult): DependencyHealthAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    stabilityConditionsDetected: result.stabilityConditionsDetected,
    availabilityConditionsDetected: result.availabilityConditionsDetected,
    continuityConditionsDetected: result.continuityConditionsDetected,
    recoverabilityConditionsDetected: result.recoverabilityConditionsDetected,
    degradationConditionsDetected: result.degradationConditionsDetected,
    riskConditionsDetected: result.riskConditionsDetected,
    observabilityConditionsDetected: result.observabilityConditionsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: DependencyHealthAnalysisResult["analysisState"],
  reasonCodes: readonly DependencyHealthAnalysisReasonCode[],
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  result: DependencyHealthAnalysisResult,
): DependencyHealthAnalysisValidation {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    scoringBlocked: boundary.scoringBlocked,
    resourceAllocationBlocked: boundary.resourceAllocationBlocked,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    stabilityConditionsDetected: result.stabilityConditionsDetected,
    availabilityConditionsDetected: result.availabilityConditionsDetected,
    continuityConditionsDetected: result.continuityConditionsDetected,
    recoverabilityConditionsDetected: result.recoverabilityConditionsDetected,
    degradationConditionsDetected: result.degradationConditionsDetected,
    riskConditionsDetected: result.riskConditionsDetected,
    observabilityConditionsDetected: result.observabilityConditionsDetected,
  });
}

export function buildDependencyHealthAnalysisRequest(request: DependencyHealthAnalysisRequest): DependencyHealthAnalysisRequest {
  return requestCore(request);
}

export function sealDependencyHealthAnalysis(input: DependencyHealthAnalysisInput): SealedDependencyHealthAnalysisRecord {
  const reasons: DependencyHealthAnalysisReasonCode[] = [];
  const stabilityConditions = includesScope(input.request.analysisScope, "STABILITY")
    ? filterConditions(input, "DEPENDENCY_STABILITY")
    : [];
  const availabilityConditions = includesScope(input.request.analysisScope, "AVAILABILITY")
    ? filterConditions(input, "DEPENDENCY_AVAILABILITY")
    : [];
  const continuityConditions = includesScope(input.request.analysisScope, "CONTINUITY")
    ? filterConditions(input, "DEPENDENCY_CONTINUITY")
    : [];
  const recoverabilityConditions = includesScope(input.request.analysisScope, "RECOVERABILITY")
    ? filterConditions(input, "DEPENDENCY_RECOVERABILITY")
    : [];
  const degradationConditions = includesScope(input.request.analysisScope, "DEGRADATION")
    ? filterConditions(input, "DEPENDENCY_DEGRADATION")
    : [];
  const riskConditions = includesScope(input.request.analysisScope, "RISK")
    ? filterConditions(input, "DEPENDENCY_RISK")
    : [];
  const observabilityConditions = includesScope(input.request.analysisScope, "OBSERVABILITY")
    ? filterConditions(input, "DEPENDENCY_OBSERVABILITY")
    : [];

  const requestValid = validateRecommendationIds(input.request, reasons) && validateScope(input.request.analysisScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const evidencePresent = validateHealthEvidence(input, reasons);
  const governanceValid = validateGovernance(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const stabilityAnalyzed = includesScope(input.request.analysisScope, "STABILITY")
    ? analyzeDomain(stabilityConditions, "STABILITY_CONDITIONS_ANALYZED", "STABILITY_CONDITIONS_LIMITED", reasons)
    : true;
  const availabilityAnalyzed = includesScope(input.request.analysisScope, "AVAILABILITY")
    ? analyzeDomain(availabilityConditions, "AVAILABILITY_CONDITIONS_ANALYZED", "AVAILABILITY_CONDITIONS_LIMITED", reasons)
    : true;
  const continuityAnalyzed = includesScope(input.request.analysisScope, "CONTINUITY")
    ? analyzeDomain(continuityConditions, "CONTINUITY_CONDITIONS_ANALYZED", "CONTINUITY_CONDITIONS_LIMITED", reasons)
    : true;
  const recoverabilityAnalyzed = includesScope(input.request.analysisScope, "RECOVERABILITY")
    ? analyzeDomain(recoverabilityConditions, "RECOVERABILITY_CONDITIONS_ANALYZED", "RECOVERABILITY_CONDITIONS_LIMITED", reasons)
    : true;
  const degradationAnalyzed = includesScope(input.request.analysisScope, "DEGRADATION")
    ? analyzeDomain(degradationConditions, "DEGRADATION_CONDITIONS_ANALYZED", "DEGRADATION_CONDITIONS_LIMITED", reasons)
    : true;
  const riskAnalyzed = includesScope(input.request.analysisScope, "RISK")
    ? analyzeDomain(riskConditions, "RISK_CONDITIONS_ANALYZED", "RISK_CONDITIONS_LIMITED", reasons)
    : true;
  const observabilityAnalyzed = includesScope(input.request.analysisScope, "OBSERVABILITY")
    ? analyzeDomain(observabilityConditions, "OBSERVABILITY_CONDITIONS_ANALYZED", "OBSERVABILITY_CONDITIONS_LIMITED", reasons)
    : true;

  const evidencePath = createDependencyHealthAnalysisEvidencePath(
    input,
    stabilityConditions,
    availabilityConditions,
    continuityConditions,
    recoverabilityConditions,
    degradationConditions,
    riskConditions,
    observabilityConditions,
  );
  const dependencyCount = new Set(input.foundation.healthRecords.map((record) => `${record.recommendationId}:${record.dependencyId}`)).size;
  const analysisReferenceCount = normalizeStrings([
    ...evidencePath.stabilityReferences,
    ...evidencePath.availabilityReferences,
    ...evidencePath.continuityReferences,
    ...evidencePath.recoverabilityReferences,
    ...evidencePath.degradationReferences,
    ...evidencePath.riskReferences,
    ...evidencePath.observabilityReferences,
    ...evidencePath.governanceReferences,
    ...evidencePath.lineageReferences,
    ...evidencePath.replayReferences,
  ]).length;
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    input.foundation.healthRecords.length,
    dependencyCount,
    analysisReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_HEALTH_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValid
    || boundary.invalidBoundary;
  const observe = !invalid && (
    !evidencePresent
    || input.foundation.result.overallHealthState === "UNKNOWN"
  );
  const limited = !invalid && !observe && (
    !stabilityAnalyzed
    || !availabilityAnalyzed
    || !continuityAnalyzed
    || !recoverabilityAnalyzed
    || !degradationAnalyzed
    || !riskAnalyzed
    || !observabilityAnalyzed
    || !limitsValid
    || input.foundation.result.overallHealthState === "STABLE"
    || input.foundation.result.overallHealthState === "DEGRADED"
    || input.foundation.result.overallHealthState === "AT_RISK"
    || evidencePath.observabilityReferences.length === 0
  );
  const analysisState = invalid ? "INVALID" : observe ? "OBSERVE" : limited ? "LIMITED" : "ANALYZED";

  const analysisHash = hashAnalysisValue("dependency-health-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    healthReferences: evidencePath.healthReferences,
    stabilityReferences: evidencePath.stabilityReferences,
    availabilityReferences: evidencePath.availabilityReferences,
    continuityReferences: evidencePath.continuityReferences,
    recoverabilityReferences: evidencePath.recoverabilityReferences,
    degradationReferences: evidencePath.degradationReferences,
    riskReferences: evidencePath.riskReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    governanceReferences: evidencePath.governanceReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    recommendationReferences: evidencePath.recommendationReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    analysisState,
    stabilityConditions,
    availabilityConditions,
    continuityConditions,
    recoverabilityConditions,
    degradationConditions,
    riskConditions,
    observabilityConditions,
    tenantIsolationVerified,
    analysisHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    analysisState,
    reasons,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    result,
  );

  return Object.freeze({
    result,
    stabilityConditions: Object.freeze(stabilityConditions),
    availabilityConditions: Object.freeze(availabilityConditions),
    continuityConditions: Object.freeze(continuityConditions),
    recoverabilityConditions: Object.freeze(recoverabilityConditions),
    degradationConditions: Object.freeze(degradationConditions),
    riskConditions: Object.freeze(riskConditions),
    observabilityConditions: Object.freeze(observabilityConditions),
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    analysisOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    recommendationRankingAllowed: false,
    approvalAllowed: false,
    recommendationScoringAllowed: false,
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
