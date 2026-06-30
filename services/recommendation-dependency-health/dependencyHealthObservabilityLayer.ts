import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyHealthObservabilityEvidencePath,
  DependencyHealthObservabilityInput,
  DependencyHealthObservabilityObservability,
  DependencyHealthObservabilityReasonCode,
  DependencyHealthObservabilityRequest,
  DependencyHealthObservabilityResult,
  DependencyHealthObservabilityScope,
  DependencyHealthObservabilityValidation,
  SealedDependencyHealthObservabilityRecord,
} from "./types";

const MAX_DEPENDENCY_HEALTH_RECORDS = 50_000;
const MAX_VISIBLE_DEPENDENCIES = 50_000;
const MAX_VISIBLE_REPLAY_REFERENCES = 10_000;
const MAX_VISIBLE_AUDIT_REFERENCES = 10_000;

const OBSERVABILITY_SCOPES: readonly DependencyHealthObservabilityScope[] = Object.freeze([
  "SUMMARY",
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
  prioritizationAbsent: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  scoringAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DependencyHealthObservabilityReasonCode[], reason: DependencyHealthObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyHealthObservabilityRequest): DependencyHealthObservabilityRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityScope: request.observabilityScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DependencyHealthObservabilityInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
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

function lineageIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.lineage.result.reconstructionState !== "INVALID"
    && bundle.lineage.result.lineageIntegrity
    && bundle.integrity.result.lineageIntegrity;
}

function replayIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.replay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED";
}

function governanceIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL";
}

function collectLineageReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.lineageReferences,
    ...bundle.lineage.ancestryChain.map((node) => node.lineageReference),
    ...bundle.lineage.evidencePath.lineageReferences,
    ...bundle.verification.evidencePath.lineageReferences,
    ...bundle.audit.evidencePath.lineageReferences,
    ...bundle.reviewPacket.evidencePath.lineageReferences,
    ...bundle.replayFramework.evidencePath.lineageReferences,
    ...bundle.readinessCertification.evidencePath.lineageReferences,
  ]);
}

function collectReplayReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.replayEvidence.replayReferences,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.governanceReplay.evidencePath.replayReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readiness.evidencePath.replayReferences,
    ...bundle.readinessCertification.evidencePath.replayReferences,
  ]);
}

function collectGovernanceReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.governanceReferences.governanceReferences,
    ...bundle.binding.evidencePath.governanceReferences,
    ...bundle.authorityScope.evidencePath.governanceReferences,
    ...bundle.policyVisibility.evidencePath.governanceReferences,
    ...bundle.governanceReplay.evidencePath.governanceReferences,
    ...bundle.governanceCertification.evidencePath.governanceReferences,
    ...bundle.readiness.evidencePath.governanceReferences,
    ...bundle.alignment.evidencePath.governanceReferences,
  ]);
}

function collectAuditReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.lineageReferences,
    bundle.audit.result.exportHash,
    bundle.certification.result.certificationHash,
    bundle.observabilityCertification.result.certificationHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.readinessCertification.result.certificationHash,
  ]);
}

function collectEvidenceHashes(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    bundle.ledger.result.ledgerHash,
    bundle.lineage.result.reconstructionHash,
    bundle.verification.result.verificationHash,
    bundle.replay.result.replayHash,
    bundle.integrity.result.integrityHash,
    bundle.certification.result.certificationHash,
    bundle.observability.result.observabilityHash,
    bundle.audit.result.exportHash,
    bundle.binding.result.governanceHash,
    bundle.authorityScope.result.authorityHash,
    bundle.policyVisibility.result.policyHash,
    bundle.governanceReplay.result.replayHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.readiness.result.readinessHash,
    bundle.alignment.result.alignmentHash,
    bundle.reviewPacket.result.packetHash,
    bundle.replayFramework.result.replayHash,
    bundle.readinessCertification.result.certificationHash,
  ]);
}

function validateTenantId(request: DependencyHealthObservabilityRequest, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DependencyHealthObservabilityScope, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OBSERVABILITY_SCOPE_VALID" : "OBSERVABILITY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.constraintFoundation.sealed === true
    && input.constraintCertification.sealed === true
    && input.opportunityFoundation.sealed === true
    && input.opportunityCertification.sealed === true
    && input.dependencyRiskFoundation.sealed === true
    && input.dependencyRiskCertification.sealed === true
    && input.dependencyFoundation.sealed === true
    && input.dependencyCertification.sealed === true
    && input.impactFoundation.sealed === true
    && input.impactCertification.sealed === true
    && input.trustFoundation.sealed === true
    && input.trustCertification.sealed === true
    && input.driftFoundation.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceFoundation.sealed === true
    && input.resilienceCertification.sealed === true
    && input.portfolio.sealed === true
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
  addReason(reasons, input.constraintCertification.sealed === true ? "CONSTRAINT_CERTIFICATION_REQUIRED" : "CONSTRAINT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.opportunityFoundation.sealed === true ? "OPPORTUNITY_FOUNDATION_REQUIRED" : "OPPORTUNITY_FOUNDATION_UNSEALED");
  addReason(reasons, input.opportunityCertification.sealed === true ? "OPPORTUNITY_CERTIFICATION_REQUIRED" : "OPPORTUNITY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyRiskFoundation.sealed === true ? "DEPENDENCY_RISK_FOUNDATION_REQUIRED" : "DEPENDENCY_RISK_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyRiskCertification.sealed === true ? "DEPENDENCY_RISK_CERTIFICATION_REQUIRED" : "DEPENDENCY_RISK_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyFoundation.sealed === true ? "DEPENDENCY_FOUNDATION_REQUIRED" : "DEPENDENCY_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactFoundation.sealed === true ? "IMPACT_FOUNDATION_REQUIRED" : "IMPACT_FOUNDATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustFoundation.sealed === true ? "TRUST_FOUNDATION_REQUIRED" : "TRUST_FOUNDATION_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftFoundation.sealed === true ? "DRIFT_FOUNDATION_REQUIRED" : "DRIFT_FOUNDATION_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceFoundation.sealed === true ? "RESILIENCE_FOUNDATION_REQUIRED" : "RESILIENCE_FOUNDATION_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolio.sealed === true ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.constraintFoundation.result.tenantIsolationVerified
    && input.constraintCertification.result.tenantIsolationVerified
    && input.opportunityFoundation.result.tenantIsolationVerified
    && input.opportunityCertification.result.tenantIsolationVerified
    && input.dependencyRiskFoundation.result.tenantIsolationVerified
    && input.dependencyRiskCertification.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.trustFoundation.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftFoundation.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceFoundation.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_VISIBILITY_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateHealthGraphVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = input.foundation.healthRecords.length > 0
    && input.foundation.evidencePath.healthReferences.length === input.foundation.healthRecords.length
    && input.foundation.result.healthRecordsCreated === input.foundation.healthRecords.length;
  addReason(reasons, visible ? "HEALTH_GRAPH_VISIBLE" : "HEALTH_GRAPH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateStabilityVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = input.analysis.stabilityConditions.length > 0
    && input.analysis.evidencePath.stabilityReferences.length === input.analysis.result.stabilityConditionsDetected;
  addReason(reasons, visible ? "STABILITY_VISIBLE" : "STABILITY_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateAvailabilityVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = input.analysis.availabilityConditions.length > 0
    && input.analysis.evidencePath.availabilityReferences.length === input.analysis.result.availabilityConditionsDetected;
  addReason(reasons, visible ? "AVAILABILITY_VISIBLE" : "AVAILABILITY_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateContinuityVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = input.analysis.continuityConditions.length > 0
    && input.analysis.evidencePath.continuityReferences.length === input.analysis.result.continuityConditionsDetected;
  addReason(reasons, visible ? "CONTINUITY_VISIBLE" : "CONTINUITY_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateRecoverabilityVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = input.analysis.recoverabilityConditions.length > 0
    && input.analysis.evidencePath.recoverabilityReferences.length === input.analysis.result.recoverabilityConditionsDetected;
  addReason(reasons, visible ? "RECOVERABILITY_VISIBLE" : "RECOVERABILITY_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDegradationVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = input.analysis.degradationConditions.length > 0
    && input.analysis.evidencePath.degradationReferences.length === input.analysis.result.degradationConditionsDetected;
  addReason(reasons, visible ? "DEGRADATION_VISIBLE" : "DEGRADATION_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateRiskVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = input.analysis.riskConditions.length > 0
    && input.analysis.evidencePath.riskReferences.length === input.analysis.result.riskConditionsDetected;
  addReason(reasons, visible ? "RISK_VISIBLE" : "RISK_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateCoverageVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = input.analysis.observabilityConditions.length > 0
    && input.analysis.evidencePath.observabilityReferences.length === input.analysis.result.observabilityConditionsDetected;
  addReason(reasons, visible ? "OBSERVABILITY_COVERAGE_VISIBLE" : "OBSERVABILITY_COVERAGE_INCOMPLETE");
  return visible;
}

function validateLineageVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input).every((bundle) => collectLineageReferences(bundle).length > 0 && lineageIntegrity(bundle));
  addReason(reasons, visible ? "LINEAGE_VISIBLE" : "LINEAGE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateReplayVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || orderedBundles(input).some((bundle) => !replayIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.replayReferences.length === 0
    || orderedBundles(input).some((bundle) => collectReplayReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "REPLAY_VISIBLE" : "REPLAY_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateGovernanceVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || orderedBundles(input).some((bundle) => !governanceIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.governanceReferences.length === 0
    || orderedBundles(input).some((bundle) => collectGovernanceReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "GOVERNANCE_VISIBLE" : "GOVERNANCE_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateAuditVisibility(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input).every((bundle) => collectAuditReferences(bundle).length > 0)
    && input.foundation.evidencePath.evidenceHashes.length > 0
    && input.analysis.evidencePath.evidenceHashes.length > 0;
  addReason(reasons, visible ? "AUDIT_VISIBLE" : "AUDIT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateVisibilityEvidence(checks: readonly boolean[], reasons: DependencyHealthObservabilityReasonCode[]): boolean {
  const complete = checks.every(Boolean);
  addReason(reasons, complete ? "VISIBILITY_EVIDENCE_COMPLETE" : "VISIBILITY_EVIDENCE_MISSING");
  return complete;
}

function validateBoundary(input: DependencyHealthObservabilityInput, reasons: DependencyHealthObservabilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.constraintFoundation.controlSurfacePresent
    && !input.constraintCertification.controlSurfacePresent
    && !input.opportunityFoundation.controlSurfacePresent
    && !input.opportunityCertification.controlSurfacePresent
    && !input.dependencyRiskFoundation.controlSurfacePresent
    && !input.dependencyRiskCertification.controlSurfacePresent
    && !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.impactFoundation.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.trustFoundation.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftFoundation.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceFoundation.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.portfolio.controlSurfacePresent
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
  addReason(reasons, prioritizationAbsent ? "PRIORITIZATION_ABSENT" : "PRIORITIZATION_DETECTED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, scoringAbsent ? "SCORING_ABSENT" : "SCORING_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");

  return Object.freeze({
    executionImpossible,
    prioritizationAbsent,
    rankingAbsent,
    approvalAbsent,
    scoringAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || !prioritizationAbsent
      || !rankingAbsent
      || !approvalAbsent
      || !scoringAbsent
      || !resourceAllocationAbsent
      || !authorityBounded
      || input.observabilityMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyHealthObservabilityEvidencePath(input: DependencyHealthObservabilityInput): DependencyHealthObservabilityEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.observabilityScope,
    healthReferences: normalizeStrings(input.foundation.evidencePath.healthReferences),
    stabilityReferences: normalizeStrings(input.analysis.evidencePath.stabilityReferences),
    availabilityReferences: normalizeStrings(input.analysis.evidencePath.availabilityReferences),
    continuityReferences: normalizeStrings(input.analysis.evidencePath.continuityReferences),
    recoverabilityReferences: normalizeStrings(input.analysis.evidencePath.recoverabilityReferences),
    degradationReferences: normalizeStrings(input.analysis.evidencePath.degradationReferences),
    riskReferences: normalizeStrings(input.analysis.evidencePath.riskReferences),
    observabilityReferences: normalizeStrings(input.analysis.evidencePath.observabilityReferences),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    governanceReferences: normalizeStrings([
      ...input.foundation.evidencePath.governanceReferences,
      ...bundles.flatMap(collectGovernanceReferences),
    ]),
    replayReferences: normalizeStrings([
      ...input.foundation.evidencePath.replayReferences,
      ...bundles.flatMap(collectReplayReferences),
    ]),
    auditReferences: normalizeStrings(bundles.flatMap(collectAuditReferences)),
    evidenceHashes: normalizeStrings([
      input.foundation.result.healthGraphHash,
      input.analysis.result.analysisHash,
      input.constraintFoundation.result.constraintGraphHash,
      input.constraintCertification.result.certificationHash,
      input.opportunityFoundation.result.opportunityGraphHash,
      input.opportunityCertification.result.certificationHash,
      input.dependencyRiskFoundation.result.dependencyRiskGraphHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyCertification.result.certificationHash,
      input.impactFoundation.result.impactGraphHash,
      input.impactCertification.result.certificationHash,
      input.trustFoundation.result.trustGraphHash,
      input.trustCertification.result.certificationHash,
      input.driftFoundation.result.driftGraphHash,
      input.driftCertification.result.certificationHash,
      input.resilienceFoundation.result.resilienceGraphHash,
      input.resilienceCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  healthRecordCount: number,
  visibleDependencyCount: number,
  visibleReplayReferenceCount: number,
  visibleAuditReferenceCount: number,
  reasons: DependencyHealthObservabilityReasonCode[],
): boolean {
  const valid = healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS
    && visibleDependencyCount <= MAX_VISIBLE_DEPENDENCIES
    && visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES
    && visibleAuditReferenceCount <= MAX_VISIBLE_AUDIT_REFERENCES;
  addReason(reasons, healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS ? "DEPENDENCY_HEALTH_RECORD_LIMIT_VALID" : "DEPENDENCY_HEALTH_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, visibleDependencyCount <= MAX_VISIBLE_DEPENDENCIES ? "VISIBLE_DEPENDENCY_LIMIT_VALID" : "VISIBLE_DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES ? "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID" : "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, visibleAuditReferenceCount <= MAX_VISIBLE_AUDIT_REFERENCES ? "VISIBLE_AUDIT_REFERENCE_LIMIT_VALID" : "VISIBLE_AUDIT_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyHealthObservabilityRequest,
  observabilityState: DependencyHealthObservabilityResult["observabilityState"],
  visibility: Readonly<{
    healthGraphVisible: boolean;
    stabilityVisible: boolean;
    availabilityVisible: boolean;
    continuityVisible: boolean;
    recoverabilityVisible: boolean;
    degradationVisible: boolean;
    riskVisible: boolean;
    observabilityCoverageVisible: boolean;
    lineageVisible: boolean;
    governanceVisible: boolean;
    replayVisible: boolean;
    auditVisible: boolean;
  }>,
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): DependencyHealthObservabilityResult {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityState,
    ...visibility,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyHealthObservabilityResult): DependencyHealthObservabilityObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    observabilityState: result.observabilityState,
    healthGraphVisible: result.healthGraphVisible,
    stabilityVisible: result.stabilityVisible,
    availabilityVisible: result.availabilityVisible,
    continuityVisible: result.continuityVisible,
    recoverabilityVisible: result.recoverabilityVisible,
    degradationVisible: result.degradationVisible,
    riskVisible: result.riskVisible,
    observabilityCoverageVisible: result.observabilityCoverageVisible,
    lineageVisible: result.lineageVisible,
    governanceVisible: result.governanceVisible,
    replayVisible: result.replayVisible,
    auditVisible: result.auditVisible,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  observabilityState: DependencyHealthObservabilityResult["observabilityState"],
  reasonCodes: readonly DependencyHealthObservabilityReasonCode[],
  visibility: Readonly<{
    healthGraphVisible: boolean;
    stabilityVisible: boolean;
    availabilityVisible: boolean;
    continuityVisible: boolean;
    recoverabilityVisible: boolean;
    degradationVisible: boolean;
    riskVisible: boolean;
    observabilityCoverageVisible: boolean;
    lineageVisible: boolean;
    governanceVisible: boolean;
    replayVisible: boolean;
    auditVisible: boolean;
  }>,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    visibleDependencyCount: number;
    visibleReplayReferenceCount: number;
    visibleAuditReferenceCount: number;
  }>,
): DependencyHealthObservabilityValidation {
  return Object.freeze({
    valid: observabilityState !== "INVALID",
    observabilityState,
    reasonCodes: [...reasonCodes],
    ...visibility,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    prioritizationAbsent: boundary.prioritizationAbsent,
    rankingAbsent: boundary.rankingAbsent,
    approvalAbsent: boundary.approvalAbsent,
    scoringAbsent: boundary.scoringAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildDependencyHealthObservabilityRequest(request: DependencyHealthObservabilityRequest): DependencyHealthObservabilityRequest {
  return requestCore(request);
}

export function sealDependencyHealthObservability(input: DependencyHealthObservabilityInput): SealedDependencyHealthObservabilityRecord {
  const reasons: DependencyHealthObservabilityReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.observabilityScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const healthGraphVisible = validateHealthGraphVisibility(input, reasons);
  const stabilityVisible = validateStabilityVisibility(input, reasons);
  const availabilityVisible = validateAvailabilityVisibility(input, reasons);
  const continuityVisible = validateContinuityVisibility(input, reasons);
  const recoverabilityVisible = validateRecoverabilityVisibility(input, reasons);
  const degradationVisible = validateDegradationVisibility(input, reasons);
  const riskVisible = validateRiskVisibility(input, reasons);
  const observabilityCoverageVisible = validateCoverageVisibility(input, reasons);
  const lineageVisible = validateLineageVisibility(input, reasons);
  const governanceVisibility = validateGovernanceVisibility(input, reasons);
  const replayVisibility = validateReplayVisibility(input, reasons);
  const auditVisible = validateAuditVisibility(input, reasons);
  const visibilityEvidenceComplete = validateVisibilityEvidence([
    healthGraphVisible,
    stabilityVisible,
    availabilityVisible,
    continuityVisible,
    recoverabilityVisible,
    degradationVisible,
    riskVisible,
    observabilityCoverageVisible,
    lineageVisible,
    auditVisible,
  ], reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyHealthObservabilityEvidencePath(input);
  const counts = Object.freeze({
    visibleDependencyCount: new Set(input.foundation.healthRecords.map((record) => `${record.recommendationId}:${record.dependencyId}`)).size,
    visibleReplayReferenceCount: evidencePath.replayReferences.length,
    visibleAuditReferenceCount: evidencePath.auditReferences.length,
  });
  const limitsValid = validateLimits(
    input.foundation.healthRecords.length,
    counts.visibleDependencyCount,
    counts.visibleReplayReferenceCount,
    counts.visibleAuditReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_HEALTH_OBSERVABILITY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !analysisValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || governanceVisibility.corrupted
    || replayVisibility.corrupted;
  const observe = !invalid && !visibilityEvidenceComplete;
  const limited = !invalid && !observe && (
    !governanceVisibility.visible
    || !replayVisibility.visible
    || governanceVisibility.degraded
    || replayVisibility.degraded
    || !limitsValid
  );
  const observabilityState = invalid ? "INVALID" : observe ? "OBSERVE" : limited ? "LIMITED" : "VISIBLE";

  const observabilityHash = hashObservabilityValue("dependency-health-observability-layer", {
    request: requestCore(input.request),
    observabilityState,
    healthReferences: evidencePath.healthReferences,
    stabilityReferences: evidencePath.stabilityReferences,
    availabilityReferences: evidencePath.availabilityReferences,
    continuityReferences: evidencePath.continuityReferences,
    recoverabilityReferences: evidencePath.recoverabilityReferences,
    degradationReferences: evidencePath.degradationReferences,
    riskReferences: evidencePath.riskReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    lineageReferences: evidencePath.lineageReferences,
    governanceReferences: evidencePath.governanceReferences,
    replayReferences: evidencePath.replayReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const visibility = Object.freeze({
    healthGraphVisible,
    stabilityVisible,
    availabilityVisible,
    continuityVisible,
    recoverabilityVisible,
    degradationVisible,
    riskVisible,
    observabilityCoverageVisible,
    lineageVisible,
    governanceVisible: governanceVisibility.visible,
    replayVisible: replayVisibility.visible,
    auditVisible,
  });
  const result = buildResult(
    input.request,
    observabilityState,
    visibility,
    tenantIsolationVerified,
    observabilityHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    observabilityState,
    reasons,
    visibility,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    counts,
  );

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    visibilityOnly: true,
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
