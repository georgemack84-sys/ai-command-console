import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyHealthCertificationEvidencePath,
  DependencyHealthCertificationInput,
  DependencyHealthCertificationObservability,
  DependencyHealthCertificationReasonCode,
  DependencyHealthCertificationRequest,
  DependencyHealthCertificationResult,
  DependencyHealthCertificationScope,
  DependencyHealthCertificationValidation,
  SealedDependencyHealthCertificationRecord,
} from "./types";

const MAX_DEPENDENCY_HEALTH_RECORDS = 50_000;
const MAX_DEPENDENCIES = 50_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_EVIDENCE_REFERENCES = 10_000;

const CERTIFICATION_SCOPES: readonly DependencyHealthCertificationScope[] = Object.freeze([
  "INTEGRITY",
  "STABILITY",
  "AVAILABILITY",
  "CONTINUITY",
  "RECOVERABILITY",
  "DEGRADATION",
  "RISK",
  "REPLAY",
  "GOVERNANCE",
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

function addReason(
  reasons: DependencyHealthCertificationReasonCode[],
  reason: DependencyHealthCertificationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: DependencyHealthCertificationRequest,
): DependencyHealthCertificationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(
  input: DependencyHealthCertificationInput,
): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => (
    recommendationId(left).localeCompare(recommendationId(right))
  ));
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

function collectObservabilityReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    bundle.observability.result.observabilityHash,
    bundle.visibility.result.visibilityHash,
    bundle.audit.result.exportHash,
    bundle.observabilityCertification.result.certificationHash,
    bundle.readinessCertification.result.certificationHash,
    bundle.governanceCertification.result.certificationHash,
  ]);
}

function collectEvidenceReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.lineageReferences,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.replayEvidence.replayReferences,
    ...bundle.ownershipEvidence.ownershipReferences,
    bundle.audit.result.exportHash,
    bundle.certification.result.certificationHash,
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
    bundle.observabilityCertification.result.certificationHash,
  ]);
}

function lineageIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.lineage.result.reconstructionState !== "INVALID"
    && bundle.lineage.result.lineageIntegrity
    && bundle.integrity.result.lineageIntegrity;
}

function governanceIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL"
    && bundle.readinessCertification.result.certificationState !== "FAIL";
}

function validateTenantId(
  request: DependencyHealthCertificationRequest,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(
  scope: DependencyHealthCertificationScope,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateFoundation(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const valid = input.foundation.sealed === true
    && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const valid = input.analysis.sealed === true
    && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const valid = input.observability.sealed === true
    && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateReplay(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const valid = input.replay.sealed === true
    && input.replay.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "REPLAY_REQUIRED" : "REPLAY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  addReason(reasons, input.constraintFoundation.sealed ? "CONSTRAINT_FOUNDATION_REQUIRED" : "CONSTRAINT_FOUNDATION_UNSEALED");
  addReason(reasons, input.constraintCertification.sealed ? "CONSTRAINT_CERTIFICATION_REQUIRED" : "CONSTRAINT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.opportunityFoundation.sealed ? "OPPORTUNITY_FOUNDATION_REQUIRED" : "OPPORTUNITY_FOUNDATION_UNSEALED");
  addReason(reasons, input.opportunityCertification.sealed ? "OPPORTUNITY_CERTIFICATION_REQUIRED" : "OPPORTUNITY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyRiskFoundation.sealed ? "DEPENDENCY_RISK_FOUNDATION_REQUIRED" : "DEPENDENCY_RISK_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyRiskCertification.sealed ? "DEPENDENCY_RISK_CERTIFICATION_REQUIRED" : "DEPENDENCY_RISK_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyFoundation.sealed ? "DEPENDENCY_FOUNDATION_REQUIRED" : "DEPENDENCY_FOUNDATION_UNSEALED");
  addReason(reasons, input.dependencyReplay.sealed ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactFoundation.sealed ? "IMPACT_FOUNDATION_REQUIRED" : "IMPACT_FOUNDATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustFoundation.sealed ? "TRUST_FOUNDATION_REQUIRED" : "TRUST_FOUNDATION_UNSEALED");
  addReason(reasons, input.trustReplay.sealed ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftFoundation.sealed ? "DRIFT_FOUNDATION_REQUIRED" : "DRIFT_FOUNDATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceFoundation.sealed ? "RESILIENCE_FOUNDATION_REQUIRED" : "RESILIENCE_FOUNDATION_UNSEALED");
  addReason(reasons, input.resilienceReplay.sealed ? "RESILIENCE_REPLAY_REQUIRED" : "RESILIENCE_REPLAY_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolio.sealed ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");

  const sealed = input.foundation.sealed
    && input.analysis.sealed
    && input.observability.sealed
    && input.replay.sealed
    && input.constraintFoundation.sealed
    && input.constraintCertification.sealed
    && input.opportunityFoundation.sealed
    && input.opportunityCertification.sealed
    && input.dependencyRiskFoundation.sealed
    && input.dependencyRiskCertification.sealed
    && input.dependencyFoundation.sealed
    && input.dependencyReplay.sealed
    && input.dependencyCertification.sealed
    && input.impactFoundation.sealed
    && input.impactCertification.sealed
    && input.trustFoundation.sealed
    && input.trustReplay.sealed
    && input.trustCertification.sealed
    && input.driftFoundation.sealed
    && input.driftReplay.sealed
    && input.driftCertification.sealed
    && input.resilienceFoundation.sealed
    && input.resilienceReplay.sealed
    && input.resilienceCertification.sealed
    && input.portfolio.sealed
    && input.portfolioCertification.sealed
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

  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.constraintFoundation.result.tenantIsolationVerified
    && input.constraintCertification.result.tenantIsolationVerified
    && input.opportunityFoundation.result.tenantIsolationVerified
    && input.opportunityCertification.result.tenantIsolationVerified
    && input.dependencyRiskFoundation.result.tenantIsolationVerified
    && input.dependencyRiskCertification.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CERTIFICATION_BLOCKED");
  return valid;
}

function validateOwnership(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateIntegrity(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const certified = input.foundation.healthRecords.length > 0
    && input.foundation.result.healthRecordsCreated === input.foundation.healthRecords.length
    && input.foundation.evidencePath.healthReferences.length === input.foundation.healthRecords.length
    && input.foundation.evidencePath.evidenceHashes.every((hash) => hash.length === 64);
  addReason(reasons, certified ? "INTEGRITY_CERTIFIED" : "INTEGRITY_BROKEN");
  return certified;
}

function validateDomainCertification(
  sourceCount: number,
  analysisCount: number,
  replayReconstructed: boolean,
  successReason: DependencyHealthCertificationReasonCode,
  failureReason: DependencyHealthCertificationReasonCode,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const certified = sourceCount > 0
    && analysisCount === sourceCount
    && replayReconstructed;
  addReason(reasons, certified ? successReason : failureReason);
  return certified;
}

function validateReplayCertification(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): { certified: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.replay.result.replayState === "INVALID"
    || input.replay.result.replayState === "ESCALATED"
    || input.replay.result.replayHash.length !== 64
    || input.replay.result.reconstructionHash.length !== 64;
  const degraded = !corrupted && input.replay.result.replayState === "LIMITED";
  const certified = !corrupted && !degraded && input.replay.result.replayState === "REPLAYABLE";
  addReason(reasons, corrupted ? "REPLAY_CORRUPTION_DETECTED" : degraded ? "REPLAY_DEGRADED" : "REPLAY_CERTIFIED");
  return { certified, degraded, corrupted };
}

function validateGovernance(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const certified = input.replay.result.governanceReconstructed
    && input.constraintCertification.result.governanceCertified
    && input.opportunityCertification.result.governanceCertified
    && input.dependencyRiskCertification.result.governanceCertified
    && input.dependencyCertification.result.governanceCertified
    && input.impactCertification.result.governanceCertified
    && input.trustCertification.result.governanceCertified
    && input.driftCertification.result.governanceCertified
    && input.resilienceCertification.result.governanceCertified
    && input.portfolioCertification.result.governanceCertified
    && orderedBundles(input).every((bundle) => governanceIntegrity(bundle));
  addReason(reasons, certified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return certified;
}

function validateObservabilityCertification(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): { certified: boolean; incomplete: boolean } {
  const incomplete = input.observability.result.observabilityState === "OBSERVE"
    || input.observability.result.observabilityState === "LIMITED"
    || !input.observability.result.healthGraphVisible
    || !input.observability.result.stabilityVisible
    || !input.observability.result.availabilityVisible
    || !input.observability.result.continuityVisible
    || !input.observability.result.recoverabilityVisible
    || !input.observability.result.degradationVisible
    || !input.observability.result.riskVisible
    || !input.observability.result.observabilityCoverageVisible
    || !input.observability.result.lineageVisible
    || !input.observability.result.governanceVisible
    || !input.observability.result.replayVisible
    || !input.observability.result.auditVisible;
  const certified = !incomplete && input.observability.result.observabilityState === "VISIBLE";
  addReason(reasons, certified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_INCOMPLETE");
  return { certified, incomplete };
}

function validateEvidenceCertification(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): { certified: boolean; degraded: boolean; broken: boolean } {
  const foundationalRefsPresent = input.foundation.evidencePath.healthReferences.length > 0
    && input.foundation.evidencePath.lineageReferences.length > 0
    && input.foundation.evidencePath.replayReferences.length > 0
    && input.foundation.evidencePath.governanceReferences.length > 0;
  const broken = !foundationalRefsPresent
    || input.foundation.evidencePath.evidenceHashes.length === 0
    || input.analysis.evidencePath.evidenceHashes.length === 0
    || input.observability.evidencePath.evidenceHashes.length === 0
    || input.replay.evidencePath.evidenceHashes.length === 0
    || [
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...input.observability.evidencePath.evidenceHashes,
      ...input.replay.evidencePath.evidenceHashes,
    ].some((hash) => hash.length !== 64);
  const degraded = !broken && (
    input.observability.evidencePath.auditReferences.length === 0
    || input.observability.evidencePath.governanceReferences.length === 0
    || input.replay.evidencePath.auditReferences.length === 0
  );
  const certified = !broken && !degraded;
  addReason(reasons, certified ? "EVIDENCE_CERTIFIED" : broken ? "EVIDENCE_CONTINUITY_BROKEN" : "EVIDENCE_DEGRADED");
  return { certified, degraded, broken };
}

function validateLineage(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const certified = input.foundation.evidencePath.lineageReferences.length > 0
    && input.replay.evidencePath.lineageReferences.length > 0
    && orderedBundles(input).every((bundle) => (
      lineageIntegrity(bundle)
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, certified ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return certified;
}

function validateBoundary(
  input: DependencyHealthCertificationInput,
  reasons: DependencyHealthCertificationReasonCode[],
): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const prioritizationAbsent = input.prioritizationRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const scoringAbsent = input.recommendationScoringRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.observability.controlSurfacePresent
    && !input.replay.controlSurfacePresent
    && !input.constraintFoundation.controlSurfacePresent
    && !input.constraintCertification.controlSurfacePresent
    && !input.opportunityFoundation.controlSurfacePresent
    && !input.opportunityCertification.controlSurfacePresent
    && !input.dependencyRiskFoundation.controlSurfacePresent
    && !input.dependencyRiskCertification.controlSurfacePresent
    && !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.impactFoundation.controlSurfacePresent
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
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
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
      || !prioritizationAbsent
      || !rankingAbsent
      || !approvalAbsent
      || !scoringAbsent
      || !resourceAllocationAbsent
      || input.workflowRoutingRequested === true
      || !authorityBounded
      || input.certificationMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyHealthCertificationEvidencePath(
  input: DependencyHealthCertificationInput,
): DependencyHealthCertificationEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.certificationScope,
    healthReferences: normalizeStrings([
      ...input.foundation.evidencePath.healthReferences,
      ...input.analysis.evidencePath.healthReferences,
      ...input.observability.evidencePath.healthReferences,
      ...input.replay.evidencePath.healthReferences,
    ]),
    stabilityReferences: normalizeStrings([
      ...input.analysis.evidencePath.stabilityReferences,
      ...input.observability.evidencePath.stabilityReferences,
      ...input.replay.evidencePath.stabilityReferences,
    ]),
    availabilityReferences: normalizeStrings([
      ...input.analysis.evidencePath.availabilityReferences,
      ...input.observability.evidencePath.availabilityReferences,
      ...input.replay.evidencePath.availabilityReferences,
    ]),
    continuityReferences: normalizeStrings([
      ...input.analysis.evidencePath.continuityReferences,
      ...input.observability.evidencePath.continuityReferences,
      ...input.replay.evidencePath.continuityReferences,
    ]),
    recoverabilityReferences: normalizeStrings([
      ...input.analysis.evidencePath.recoverabilityReferences,
      ...input.observability.evidencePath.recoverabilityReferences,
      ...input.replay.evidencePath.recoverabilityReferences,
    ]),
    degradationReferences: normalizeStrings([
      ...input.analysis.evidencePath.degradationReferences,
      ...input.observability.evidencePath.degradationReferences,
      ...input.replay.evidencePath.degradationReferences,
    ]),
    riskReferences: normalizeStrings([
      ...input.analysis.evidencePath.riskReferences,
      ...input.observability.evidencePath.riskReferences,
      ...input.replay.evidencePath.riskReferences,
    ]),
    lineageReferences: normalizeStrings([
      ...input.foundation.evidencePath.lineageReferences,
      ...input.observability.evidencePath.lineageReferences,
      ...input.replay.evidencePath.lineageReferences,
      ...bundles.flatMap(collectLineageReferences),
    ]),
    replayReferences: normalizeStrings([
      ...input.foundation.evidencePath.replayReferences,
      ...input.observability.evidencePath.replayReferences,
      ...input.replay.evidencePath.replayReferences,
      ...bundles.flatMap(collectReplayReferences),
    ]),
    governanceReferences: normalizeStrings([
      ...input.foundation.evidencePath.governanceReferences,
      ...input.observability.evidencePath.governanceReferences,
      ...input.replay.evidencePath.governanceReferences,
      ...bundles.flatMap(collectGovernanceReferences),
    ]),
    observabilityReferences: normalizeStrings([
      input.observability.result.observabilityHash,
      ...input.observability.evidencePath.auditReferences,
      ...input.replay.evidencePath.observabilityReferences,
      ...bundles.flatMap(collectObservabilityReferences),
    ]),
    evidenceReferences: normalizeStrings([
      ...input.observability.evidencePath.auditReferences,
      ...input.replay.evidencePath.auditReferences,
      ...bundles.flatMap(collectEvidenceReferences),
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.healthGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.replay.result.reconstructionHash,
      input.constraintFoundation.result.constraintGraphHash,
      input.constraintCertification.result.certificationHash,
      input.opportunityFoundation.result.opportunityGraphHash,
      input.opportunityCertification.result.certificationHash,
      input.dependencyRiskFoundation.result.dependencyRiskGraphHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.impactFoundation.result.impactGraphHash,
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
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...input.observability.evidencePath.evidenceHashes,
      ...input.replay.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  healthRecordCount: number,
  dependencyCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  evidenceReferenceCount: number,
  reasons: DependencyHealthCertificationReasonCode[],
): boolean {
  const valid = healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS
    && dependencyCount <= MAX_DEPENDENCIES
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && evidenceReferenceCount <= MAX_EVIDENCE_REFERENCES;
  addReason(reasons, healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS ? "DEPENDENCY_HEALTH_RECORD_LIMIT_VALID" : "DEPENDENCY_HEALTH_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, dependencyCount <= MAX_DEPENDENCIES ? "DEPENDENCY_LIMIT_VALID" : "DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidenceReferenceCount <= MAX_EVIDENCE_REFERENCES ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyHealthCertificationRequest,
  certificationState: DependencyHealthCertificationResult["certificationState"],
  integrityCertified: boolean,
  stabilityCertified: boolean,
  availabilityCertified: boolean,
  continuityCertified: boolean,
  recoverabilityCertified: boolean,
  degradationCertified: boolean,
  riskCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  evidenceCertified: boolean,
  tenantIsolationVerified: boolean,
  certificationHash: string,
): DependencyHealthCertificationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationState,
    integrityCertified,
    stabilityCertified,
    availabilityCertified,
    continuityCertified,
    recoverabilityCertified,
    degradationCertified,
    riskCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    evidenceCertified,
    tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

function buildObservability(
  result: DependencyHealthCertificationResult,
): DependencyHealthCertificationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    certificationState: result.certificationState,
    integrityCertified: result.integrityCertified,
    stabilityCertified: result.stabilityCertified,
    availabilityCertified: result.availabilityCertified,
    continuityCertified: result.continuityCertified,
    recoverabilityCertified: result.recoverabilityCertified,
    degradationCertified: result.degradationCertified,
    riskCertified: result.riskCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    observabilityCertified: result.observabilityCertified,
    evidenceCertified: result.evidenceCertified,
    certificationHash: result.certificationHash,
  });
}

function buildValidation(
  certificationState: DependencyHealthCertificationResult["certificationState"],
  reasonCodes: readonly DependencyHealthCertificationReasonCode[],
  flags: Readonly<{
    integrityCertified: boolean;
    stabilityCertified: boolean;
    availabilityCertified: boolean;
    continuityCertified: boolean;
    recoverabilityCertified: boolean;
    degradationCertified: boolean;
    riskCertified: boolean;
    replayCertified: boolean;
    governanceCertified: boolean;
    observabilityCertified: boolean;
    evidenceCertified: boolean;
    lineageCertified: boolean;
    ownershipValid: boolean;
    tenantIsolationVerified: boolean;
  }>,
  boundary: BoundaryValidation,
  counts: Readonly<{
    dependencyCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
    evidenceReferenceCount: number;
  }>,
): DependencyHealthCertificationValidation {
  return Object.freeze({
    valid: certificationState !== "FAIL",
    certificationState,
    reasonCodes: [...reasonCodes],
    ...flags,
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

export function buildDependencyHealthCertificationRequest(
  request: DependencyHealthCertificationRequest,
): DependencyHealthCertificationRequest {
  return requestCore(request);
}

export function sealDependencyHealthCertification(
  input: DependencyHealthCertificationInput,
): SealedDependencyHealthCertificationRecord {
  const reasons: DependencyHealthCertificationReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.certificationScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const observabilityValid = validateObservability(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const integrityCertified = validateIntegrity(input, reasons);
  const stabilityCertified = validateDomainCertification(
    input.foundation.result.stabilityRecordsDetected,
    input.analysis.result.stabilityConditionsDetected,
    input.replay.result.stabilityReconstructed,
    "STABILITY_CERTIFIED",
    "STABILITY_BROKEN",
    reasons,
  );
  const availabilityCertified = validateDomainCertification(
    input.foundation.result.availabilityRecordsDetected,
    input.analysis.result.availabilityConditionsDetected,
    input.replay.result.availabilityReconstructed,
    "AVAILABILITY_CERTIFIED",
    "AVAILABILITY_BROKEN",
    reasons,
  );
  const continuityCertified = validateDomainCertification(
    input.foundation.result.continuityRecordsDetected,
    input.analysis.result.continuityConditionsDetected,
    input.replay.result.continuityReconstructed,
    "CONTINUITY_CERTIFIED",
    "CONTINUITY_BROKEN",
    reasons,
  );
  const recoverabilityCertified = validateDomainCertification(
    input.foundation.result.recoverabilityRecordsDetected,
    input.analysis.result.recoverabilityConditionsDetected,
    input.replay.result.recoverabilityReconstructed,
    "RECOVERABILITY_CERTIFIED",
    "RECOVERABILITY_BROKEN",
    reasons,
  );
  const degradationCertified = validateDomainCertification(
    input.foundation.result.degradationRecordsDetected,
    input.analysis.result.degradationConditionsDetected,
    input.replay.result.degradationReconstructed,
    "DEGRADATION_CERTIFIED",
    "DEGRADATION_BROKEN",
    reasons,
  );
  const riskCertified = validateDomainCertification(
    input.foundation.result.riskRecordsDetected,
    input.analysis.result.riskConditionsDetected,
    input.replay.result.riskReconstructed,
    "RISK_CERTIFIED",
    "RISK_BROKEN",
    reasons,
  );
  const replayCertification = validateReplayCertification(input, reasons);
  const governanceCertified = validateGovernance(input, reasons);
  const observabilityCertification = validateObservabilityCertification(input, reasons);
  const evidenceCertification = validateEvidenceCertification(input, reasons);
  const lineageCertified = validateLineage(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyHealthCertificationEvidencePath(input);
  const counts = Object.freeze({
    dependencyCount: new Set(input.foundation.healthRecords.map((record) => `${record.recommendationId}:${record.dependencyId}`)).size,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    evidenceReferenceCount: evidencePath.evidenceReferences.length,
  });
  const limitsValid = validateLimits(
    input.foundation.healthRecords.length,
    counts.dependencyCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    counts.evidenceReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_HEALTH_CERTIFICATION_IS_NOT_CONTROL");

  const fail = !requestValid
    || !foundationValid
    || !analysisValid
    || !observabilityValid
    || !replayValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !integrityCertified
    || !stabilityCertified
    || !availabilityCertified
    || !continuityCertified
    || !recoverabilityCertified
    || !degradationCertified
    || !riskCertified
    || !governanceCertified
    || !lineageCertified
    || evidenceCertification.broken
    || replayCertification.corrupted
    || boundary.invalidBoundary
    || !limitsValid;
  const conditional = !fail && (
    replayCertification.degraded
    || observabilityCertification.incomplete
    || evidenceCertification.degraded
  );
  const certificationState = fail ? "FAIL" : conditional ? "CONDITIONAL_PASS" : "PASS";

  const certificationHash = hashCertificationValue("dependency-health-certification-gate", {
    request: requestCore(input.request),
    certificationState,
    healthReferences: evidencePath.healthReferences,
    stabilityReferences: evidencePath.stabilityReferences,
    availabilityReferences: evidencePath.availabilityReferences,
    continuityReferences: evidencePath.continuityReferences,
    recoverabilityReferences: evidencePath.recoverabilityReferences,
    degradationReferences: evidencePath.degradationReferences,
    riskReferences: evidencePath.riskReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    evidenceReferences: evidencePath.evidenceReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    certificationState,
    integrityCertified,
    stabilityCertified,
    availabilityCertified,
    continuityCertified,
    recoverabilityCertified,
    degradationCertified,
    riskCertified,
    replayCertification.certified,
    governanceCertified,
    observabilityCertification.certified,
    evidenceCertification.certified,
    tenantIsolationVerified,
    certificationHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    certificationState,
    reasons,
    Object.freeze({
      integrityCertified,
      stabilityCertified,
      availabilityCertified,
      continuityCertified,
      recoverabilityCertified,
      degradationCertified,
      riskCertified,
      replayCertified: replayCertification.certified,
      governanceCertified,
      observabilityCertified: observabilityCertification.certified,
      evidenceCertified: evidenceCertification.certified,
      lineageCertified,
      ownershipValid,
      tenantIsolationVerified,
    }),
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
    certificationOnly: true,
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
