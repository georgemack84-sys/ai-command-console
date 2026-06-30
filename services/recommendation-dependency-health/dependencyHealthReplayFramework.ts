import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyHealthReplayEvidencePath,
  DependencyHealthReplayInput,
  DependencyHealthReplayObservability,
  DependencyHealthReplayReasonCode,
  DependencyHealthReplayRequest,
  DependencyHealthReplayResult,
  DependencyHealthReplayScope,
  DependencyHealthReplayValidation,
  SealedDependencyHealthReplayRecord,
} from "./types";

const MAX_DEPENDENCY_HEALTH_RECORDS = 50_000;
const MAX_DEPENDENCIES = 50_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;

const REPLAY_SCOPES: readonly DependencyHealthReplayScope[] = Object.freeze([
  "HEALTH",
  "STABILITY",
  "AVAILABILITY",
  "CONTINUITY",
  "RECOVERABILITY",
  "DEGRADATION",
  "RISK",
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

function addReason(reasons: DependencyHealthReplayReasonCode[], reason: DependencyHealthReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyHealthReplayRequest): DependencyHealthReplayRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    replayScope: request.replayScope,
    replayVersion: request.replayVersion,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DependencyHealthReplayInput): RecommendationPortfolioBundle[] {
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

function collectAuditReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.lineageReferences,
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
    && bundle.governanceCertification.result.certificationState !== "FAIL";
}

function replayIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.replay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED";
}

function validateTenantId(request: DependencyHealthReplayRequest, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DependencyHealthReplayScope, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.constraintFoundation.sealed === true
    && input.constraintCertification.sealed === true
    && input.opportunityFoundation.sealed === true
    && input.opportunityCertification.sealed === true
    && input.dependencyRiskFoundation.sealed === true
    && input.dependencyRiskCertification.sealed === true
    && input.dependencyFoundation.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.impactFoundation.sealed === true
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
  addReason(reasons, input.dependencyReplay.sealed === true ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactFoundation.sealed === true ? "IMPACT_FOUNDATION_REQUIRED" : "IMPACT_FOUNDATION_UNSEALED");
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
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
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
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_REPLAY_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateHealthReconstruction(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const reconstructed = input.foundation.healthRecords.length > 0
    && input.foundation.evidencePath.healthReferences.length === input.foundation.healthRecords.length
    && input.analysis.evidencePath.healthReferences.length === input.foundation.evidencePath.healthReferences.length
    && input.observability.evidencePath.healthReferences.length === input.foundation.evidencePath.healthReferences.length;
  addReason(reasons, reconstructed ? "HEALTH_RECONSTRUCTED" : "HEALTH_EVIDENCE_MISSING");
  return reconstructed;
}

function validateDomainReconstruction(
  sourceCount: number,
  analysisCount: number,
  observabilityCount: number,
  successReason: DependencyHealthReplayReasonCode,
  failureReason: DependencyHealthReplayReasonCode,
  reasons: DependencyHealthReplayReasonCode[],
): boolean {
  const reconstructed = sourceCount > 0
    && analysisCount === sourceCount
    && observabilityCount === analysisCount;
  addReason(reasons, reconstructed ? successReason : failureReason);
  return reconstructed;
}

function validateEvidence(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): { reconstructed: boolean; degraded: boolean } {
  const missing = input.foundation.evidencePath.replayReferences.length === 0
    || input.foundation.evidencePath.lineageReferences.length === 0
    || input.foundation.evidencePath.governanceReferences.length === 0
    || orderedBundles(input).some((bundle) => (
      collectReplayReferences(bundle).length === 0
      || collectLineageReferences(bundle).length === 0
      || collectGovernanceReferences(bundle).length === 0
    ));
  const reconstructed = !missing
    && orderedBundles(input).every((bundle) => collectEvidenceHashes(bundle).every((hash) => hash.length === 64));
  addReason(reasons, reconstructed ? "EVIDENCE_RECONSTRUCTED" : "REPLAY_ARTIFACTS_MISSING");
  return { reconstructed, degraded: missing };
}

function validateGovernance(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): { reconstructed: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.observability.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || orderedBundles(input).some((bundle) => !governanceIntegrity(bundle));
  const degraded = !corrupted && (
    input.observability.evidencePath.governanceReferences.length === 0
    || orderedBundles(input).some((bundle) => collectGovernanceReferences(bundle).length === 0)
  );
  const reconstructed = !corrupted && !degraded;
  addReason(reasons, reconstructed ? "GOVERNANCE_RECONSTRUCTED" : degraded ? "GOVERNANCE_DEGRADATION_SURFACED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return { reconstructed, degraded, corrupted };
}

function validateReplayHashes(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): { verified: boolean; mismatched: boolean } {
  const replayHashes = normalizeStrings([
    input.dependencyReplay.result.replayHash,
    input.trustReplay.result.replayHash,
    input.driftReplay.result.replayHash,
    input.resilienceReplay.result.replayHash,
    ...orderedBundles(input).map((bundle) => bundle.replay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.governanceReplay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.replayFramework.result.replayHash),
  ]);
  const verified = replayHashes.every((hash) => hash.length === 64)
    && input.analysis.result.analysisHash.length === 64
    && input.observability.result.observabilityHash.length === 64;
  const mismatched = input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || input.trustReplay.result.replayState === "INVALID"
    || input.trustReplay.result.replayState === "ESCALATED"
    || input.driftReplay.result.replayState === "INVALID"
    || input.driftReplay.result.replayState === "ESCALATED"
    || input.resilienceReplay.result.replayState === "INVALID"
    || input.resilienceReplay.result.replayState === "ESCALATED"
    || orderedBundles(input).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "ESCALATED"
    ));
  addReason(reasons, verified && !mismatched ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return { verified, mismatched };
}

function validateLineageContinuity(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): { preserved: boolean; broken: boolean } {
  const broken = input.observability.evidencePath.lineageReferences.length === 0
    || orderedBundles(input).some((bundle) => (
      !lineageIntegrity(bundle)
      || collectLineageReferences(bundle).length === 0
    ));
  addReason(reasons, broken ? "LINEAGE_CONTINUITY_BROKEN" : "LINEAGE_CONTINUITY_PRESERVED");
  return { preserved: !broken, broken };
}

function validateObservabilityReconstruction(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): boolean {
  const reconstructed = input.observability.result.healthGraphVisible
    && input.observability.result.stabilityVisible
    && input.observability.result.availabilityVisible
    && input.observability.result.continuityVisible
    && input.observability.result.recoverabilityVisible
    && input.observability.result.degradationVisible
    && input.observability.result.riskVisible
    && input.observability.result.auditVisible
    && input.observability.evidencePath.auditReferences.length > 0;
  addReason(reasons, reconstructed ? "OBSERVABILITY_RECONSTRUCTED" : "OBSERVABILITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateBoundary(input: DependencyHealthReplayInput, reasons: DependencyHealthReplayReasonCode[]): BoundaryValidation {
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
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
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
      || input.replayMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyHealthReplayEvidencePath(input: DependencyHealthReplayInput): DependencyHealthReplayEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.replayScope,
    healthReferences: normalizeStrings([
      ...input.foundation.evidencePath.healthReferences,
      ...input.analysis.evidencePath.healthReferences,
      ...input.observability.evidencePath.healthReferences,
    ]),
    stabilityReferences: normalizeStrings(input.analysis.evidencePath.stabilityReferences),
    availabilityReferences: normalizeStrings(input.analysis.evidencePath.availabilityReferences),
    continuityReferences: normalizeStrings(input.analysis.evidencePath.continuityReferences),
    recoverabilityReferences: normalizeStrings(input.analysis.evidencePath.recoverabilityReferences),
    degradationReferences: normalizeStrings(input.analysis.evidencePath.degradationReferences),
    riskReferences: normalizeStrings(input.analysis.evidencePath.riskReferences),
    lineageReferences: normalizeStrings([
      ...input.observability.evidencePath.lineageReferences,
      ...bundles.flatMap(collectLineageReferences),
    ]),
    replayReferences: normalizeStrings([
      ...input.foundation.evidencePath.replayReferences,
      ...input.observability.evidencePath.replayReferences,
      ...bundles.flatMap(collectReplayReferences),
    ]),
    governanceReferences: normalizeStrings([
      ...input.foundation.evidencePath.governanceReferences,
      ...input.observability.evidencePath.governanceReferences,
      ...bundles.flatMap(collectGovernanceReferences),
    ]),
    observabilityReferences: normalizeStrings([
      input.observability.result.observabilityHash,
      ...input.observability.evidencePath.auditReferences,
      ...bundles.flatMap(collectObservabilityReferences),
    ]),
    auditReferences: normalizeStrings([
      ...input.observability.evidencePath.auditReferences,
      ...bundles.flatMap(collectAuditReferences),
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.healthGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.resilienceReplay.result.replayHash,
      input.resilienceCertification.result.certificationHash,
      input.constraintFoundation.result.constraintGraphHash,
      input.constraintCertification.result.certificationHash,
      input.opportunityFoundation.result.opportunityGraphHash,
      input.opportunityCertification.result.certificationHash,
      input.dependencyRiskFoundation.result.dependencyRiskGraphHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.impactFoundation.result.impactGraphHash,
      input.impactCertification.result.certificationHash,
      input.trustFoundation.result.trustGraphHash,
      input.driftFoundation.result.driftGraphHash,
      input.resilienceFoundation.result.resilienceGraphHash,
      input.portfolio.result.portfolioHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...input.observability.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  healthRecordCount: number,
  dependencyCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  governanceReferenceCount: number,
  reasons: DependencyHealthReplayReasonCode[],
): boolean {
  const valid = healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS
    && dependencyCount <= MAX_DEPENDENCIES
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES;
  addReason(reasons, healthRecordCount <= MAX_DEPENDENCY_HEALTH_RECORDS ? "DEPENDENCY_HEALTH_RECORD_LIMIT_VALID" : "DEPENDENCY_HEALTH_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, dependencyCount <= MAX_DEPENDENCIES ? "DEPENDENCY_LIMIT_VALID" : "DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyHealthReplayRequest,
  replayState: DependencyHealthReplayResult["replayState"],
  healthReconstructed: boolean,
  stabilityReconstructed: boolean,
  availabilityReconstructed: boolean,
  continuityReconstructed: boolean,
  recoverabilityReconstructed: boolean,
  degradationReconstructed: boolean,
  riskReconstructed: boolean,
  governanceReconstructed: boolean,
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): DependencyHealthReplayResult {
  return Object.freeze({
    tenantId: request.tenantId,
    replayState,
    healthReconstructed,
    stabilityReconstructed,
    availabilityReconstructed,
    continuityReconstructed,
    recoverabilityReconstructed,
    degradationReconstructed,
    riskReconstructed,
    governanceReconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyHealthReplayResult): DependencyHealthReplayObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    replayState: result.replayState,
    healthReconstructed: result.healthReconstructed,
    stabilityReconstructed: result.stabilityReconstructed,
    availabilityReconstructed: result.availabilityReconstructed,
    continuityReconstructed: result.continuityReconstructed,
    recoverabilityReconstructed: result.recoverabilityReconstructed,
    degradationReconstructed: result.degradationReconstructed,
    riskReconstructed: result.riskReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  replayState: DependencyHealthReplayResult["replayState"],
  reasonCodes: readonly DependencyHealthReplayReasonCode[],
  flags: Readonly<{
    healthReconstructed: boolean;
    stabilityReconstructed: boolean;
    availabilityReconstructed: boolean;
    continuityReconstructed: boolean;
    recoverabilityReconstructed: boolean;
    degradationReconstructed: boolean;
    riskReconstructed: boolean;
    governanceReconstructed: boolean;
    observabilityReconstructed: boolean;
    ownershipValid: boolean;
    tenantIsolationVerified: boolean;
  }>,
  boundary: BoundaryValidation,
  counts: Readonly<{
    dependencyCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
    governanceReferenceCount: number;
  }>,
): DependencyHealthReplayValidation {
  return Object.freeze({
    valid: replayState !== "INVALID",
    replayState,
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

export function buildDependencyHealthReplayRequest(request: DependencyHealthReplayRequest): DependencyHealthReplayRequest {
  return requestCore(request);
}

export function sealDependencyHealthReplay(input: DependencyHealthReplayInput): SealedDependencyHealthReplayRecord {
  const reasons: DependencyHealthReplayReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.replayScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const observabilityValid = validateObservability(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const healthReconstructed = validateHealthReconstruction(input, reasons);
  const stabilityReconstructed = validateDomainReconstruction(
    input.foundation.result.stabilityRecordsDetected,
    input.analysis.result.stabilityConditionsDetected,
    input.observability.result.stabilityVisible ? input.analysis.result.stabilityConditionsDetected : 0,
    "STABILITY_RECONSTRUCTED",
    "STABILITY_RECONSTRUCTION_BROKEN",
    reasons,
  );
  const availabilityReconstructed = validateDomainReconstruction(
    input.foundation.result.availabilityRecordsDetected,
    input.analysis.result.availabilityConditionsDetected,
    input.observability.result.availabilityVisible ? input.analysis.result.availabilityConditionsDetected : 0,
    "AVAILABILITY_RECONSTRUCTED",
    "AVAILABILITY_RECONSTRUCTION_BROKEN",
    reasons,
  );
  const continuityReconstructed = validateDomainReconstruction(
    input.foundation.result.continuityRecordsDetected,
    input.analysis.result.continuityConditionsDetected,
    input.observability.result.continuityVisible ? input.analysis.result.continuityConditionsDetected : 0,
    "CONTINUITY_RECONSTRUCTED",
    "CONTINUITY_RECONSTRUCTION_BROKEN",
    reasons,
  );
  const recoverabilityReconstructed = validateDomainReconstruction(
    input.foundation.result.recoverabilityRecordsDetected,
    input.analysis.result.recoverabilityConditionsDetected,
    input.observability.result.recoverabilityVisible ? input.analysis.result.recoverabilityConditionsDetected : 0,
    "RECOVERABILITY_RECONSTRUCTED",
    "RECOVERABILITY_RECONSTRUCTION_BROKEN",
    reasons,
  );
  const degradationReconstructed = validateDomainReconstruction(
    input.foundation.result.degradationRecordsDetected,
    input.analysis.result.degradationConditionsDetected,
    input.observability.result.degradationVisible ? input.analysis.result.degradationConditionsDetected : 0,
    "DEGRADATION_RECONSTRUCTED",
    "DEGRADATION_RECONSTRUCTION_BROKEN",
    reasons,
  );
  const riskReconstructed = validateDomainReconstruction(
    input.foundation.result.riskRecordsDetected,
    input.analysis.result.riskConditionsDetected,
    input.observability.result.riskVisible ? input.analysis.result.riskConditionsDetected : 0,
    "RISK_RECONSTRUCTED",
    "RISK_RECONSTRUCTION_BROKEN",
    reasons,
  );
  const evidenceValidation = validateEvidence(input, reasons);
  const governanceValidation = validateGovernance(input, reasons);
  const replayHashValidation = validateReplayHashes(input, reasons);
  const lineageValidation = validateLineageContinuity(input, reasons);
  const observabilityReconstructed = validateObservabilityReconstruction(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyHealthReplayEvidencePath(input);
  const counts = Object.freeze({
    dependencyCount: new Set(input.foundation.healthRecords.map((record) => `${record.recommendationId}:${record.dependencyId}`)).size,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    governanceReferenceCount: evidencePath.governanceReferences.length,
  });
  const limitsValid = validateLimits(
    input.foundation.healthRecords.length,
    counts.dependencyCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    counts.governanceReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_HEALTH_REPLAY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !analysisValid
    || !observabilityValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || governanceValidation.corrupted;
  const escalated = !invalid && (
    governanceValidation.degraded
    || replayHashValidation.mismatched
    || lineageValidation.broken
    || !observabilityReconstructed
  );
  const limited = !invalid && !escalated && (
    !healthReconstructed
    || !stabilityReconstructed
    || !availabilityReconstructed
    || !continuityReconstructed
    || !recoverabilityReconstructed
    || !degradationReconstructed
    || !riskReconstructed
    || !evidenceValidation.reconstructed
    || evidenceValidation.degraded
    || !limitsValid
  );
  const replayState = invalid ? "INVALID" : escalated ? "ESCALATED" : limited ? "LIMITED" : "REPLAYABLE";

  const replayHash = hashReplayValue("dependency-health-replay-framework", {
    request: requestCore(input.request),
    replayState,
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
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });
  const reconstructionHash = hashReplayValue("dependency-health-replay-reconstruction", {
    replayHash,
    healthReconstructed,
    stabilityReconstructed,
    availabilityReconstructed,
    continuityReconstructed,
    recoverabilityReconstructed,
    degradationReconstructed,
    riskReconstructed,
    governanceReconstructed: governanceValidation.reconstructed,
    observabilityReconstructed,
  });

  const result = buildResult(
    input.request,
    replayState,
    healthReconstructed,
    stabilityReconstructed,
    availabilityReconstructed,
    continuityReconstructed,
    recoverabilityReconstructed,
    degradationReconstructed,
    riskReconstructed,
    governanceValidation.reconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    replayState,
    reasons,
    Object.freeze({
      healthReconstructed,
      stabilityReconstructed,
      availabilityReconstructed,
      continuityReconstructed,
      recoverabilityReconstructed,
      degradationReconstructed,
      riskReconstructed,
      governanceReconstructed: governanceValidation.reconstructed,
      observabilityReconstructed,
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
    replayOnly: true,
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
