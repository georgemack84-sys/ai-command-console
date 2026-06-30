import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ConstraintReplayEvidencePath,
  ConstraintReplayInput,
  ConstraintReplayObservability,
  ConstraintReplayReasonCode,
  ConstraintReplayRequest,
  ConstraintReplayResult,
  ConstraintReplayScope,
  ConstraintReplayValidation,
  SealedConstraintReplayRecord,
} from "./types";

const MAX_CONSTRAINT_RECORDS = 50_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;

const REPLAY_SCOPES: readonly ConstraintReplayScope[] = Object.freeze([
  "CONSTRAINT",
  "SEVERITY",
  "PROPAGATION",
  "CONFLICTS",
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

function addReason(reasons: ConstraintReplayReasonCode[], reason: ConstraintReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ConstraintReplayRequest): ConstraintReplayRequest {
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

function orderedBundles(input: ConstraintReplayInput): RecommendationPortfolioBundle[] {
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

function validateTenantId(request: ConstraintReplayRequest, reasons: ConstraintReplayReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: ConstraintReplayScope, reasons: ConstraintReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  addReason(reasons, input.opportunityReplay.sealed === true ? "OPPORTUNITY_REPLAY_REQUIRED" : "OPPORTUNITY_REPLAY_UNSEALED");
  addReason(reasons, input.opportunityCertification.sealed === true ? "OPPORTUNITY_CERTIFICATION_REQUIRED" : "OPPORTUNITY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyRiskReplay.sealed === true ? "DEPENDENCY_RISK_REPLAY_REQUIRED" : "DEPENDENCY_RISK_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyRiskCertification.sealed === true ? "DEPENDENCY_RISK_CERTIFICATION_REQUIRED" : "DEPENDENCY_RISK_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyReplay.sealed === true ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactReplay.sealed === true ? "IMPACT_REPLAY_REQUIRED" : "IMPACT_REPLAY_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceReplay.sealed === true ? "RESILIENCE_REPLAY_REQUIRED" : "RESILIENCE_REPLAY_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioReplay.sealed === true ? "PORTFOLIO_REPLAY_REQUIRED" : "PORTFOLIO_REPLAY_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");

  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.opportunityReplay.sealed === true
    && input.opportunityCertification.sealed === true
    && input.dependencyRiskReplay.sealed === true
    && input.dependencyRiskCertification.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.impactReplay.sealed === true
    && input.impactCertification.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceReplay.sealed === true
    && input.resilienceCertification.sealed === true
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
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.opportunityReplay.result.tenantIsolationVerified
    && input.opportunityCertification.result.governanceCertified === true
    && input.dependencyRiskReplay.result.tenantIsolationVerified
    && input.dependencyRiskCertification.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.impactReplay.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceReplay.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.portfolioReplay.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
      && bundle.readiness.result.tenantIsolationVerified
      && bundle.alignment.result.tenantIsolationVerified
      && bundle.reviewPacket.result.tenantIsolationVerified
      && bundle.replayFramework.result.tenantIsolationVerified
      && bundle.readinessCertification.result.tenantIsolationVerified
      && bundle.observability.result.tenantIsolationVerified
      && bundle.audit.result.tenantIsolationVerified
      && bundle.governanceCertification.result.tenantIsolationVerified
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_REPLAY_BLOCKED");
  return valid;
}

function validateOwnership(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateConstraintReconstruction(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const reconstructed = input.foundation.constraints.length > 0
    && input.foundation.evidencePath.constraintReferences.length === input.foundation.constraints.length
    && input.analysis.evidencePath.constraintReferences.length === input.foundation.evidencePath.constraintReferences.length
    && input.observability.evidencePath.constraintReferences.length === input.foundation.evidencePath.constraintReferences.length;
  addReason(reasons, reconstructed ? "CONSTRAINT_RECONSTRUCTED" : "CONSTRAINT_EVIDENCE_MISSING");
  return reconstructed;
}

function validateSeverityReconstruction(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.result.constraintSeveritiesDetected >= 0
    && input.analysis.evidencePath.severityReferences.length === input.analysis.result.constraintSeveritiesDetected
    && input.observability.evidencePath.severityReferences.length === input.analysis.evidencePath.severityReferences.length;
  addReason(reasons, reconstructed ? "SEVERITY_RECONSTRUCTED" : "SEVERITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateEvidence(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): { reconstructed: boolean; degraded: boolean } {
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

function validatePropagation(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): { reconstructed: boolean; escalated: boolean } {
  const mismatch = input.analysis.evidencePath.propagationReferences.length !== input.analysis.result.constraintPropagationsDetected
    || input.observability.evidencePath.propagationReferences.length !== input.analysis.evidencePath.propagationReferences.length;
  const reconstructed = !mismatch && input.analysis.result.constraintPropagationsDetected >= 0;
  addReason(reasons, reconstructed ? "PROPAGATION_RECONSTRUCTED" : "PROPAGATION_MISMATCH_DETECTED");
  return { reconstructed, escalated: mismatch };
}

function validateConflicts(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.evidencePath.conflictReferences.length === input.analysis.result.constraintConflictsDetected
    && input.observability.evidencePath.conflictReferences.length === input.analysis.evidencePath.conflictReferences.length;
  addReason(reasons, reconstructed ? "CONFLICTS_RECONSTRUCTED" : "CONFLICT_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateGovernance(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): { reconstructed: boolean; degraded: boolean; corrupted: boolean } {
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

function validateReplayHashes(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): { verified: boolean; mismatched: boolean } {
  const replayHashes = normalizeStrings([
    input.opportunityReplay.result.replayHash,
    input.dependencyRiskReplay.result.replayHash,
    input.dependencyReplay.result.replayHash,
    input.impactReplay.result.replayHash,
    input.trustReplay.result.replayHash,
    input.driftReplay.result.replayHash,
    input.resilienceReplay.result.replayHash,
    input.portfolioReplay.result.replayHash,
    ...orderedBundles(input).map((bundle) => bundle.replay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.governanceReplay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.replayFramework.result.replayHash),
  ]);
  const verified = replayHashes.every((hash) => hash.length === 64)
    && input.analysis.result.analysisHash.length === 64
    && input.observability.result.observabilityHash.length === 64;
  const mismatched = input.opportunityReplay.result.replayState === "INVALID"
    || input.opportunityReplay.result.replayState === "ESCALATED"
    || input.dependencyRiskReplay.result.replayState === "INVALID"
    || input.dependencyRiskReplay.result.replayState === "ESCALATED"
    || input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || input.impactReplay.result.replayState === "INVALID"
    || input.impactReplay.result.replayState === "ESCALATED"
    || input.trustReplay.result.replayState === "INVALID"
    || input.trustReplay.result.replayState === "ESCALATED"
    || input.driftReplay.result.replayState === "INVALID"
    || input.driftReplay.result.replayState === "ESCALATED"
    || input.resilienceReplay.result.replayState === "INVALID"
    || input.resilienceReplay.result.replayState === "ESCALATED"
    || input.portfolioReplay.result.replayState === "INVALID"
    || input.portfolioReplay.result.replayState === "ESCALATED"
    || orderedBundles(input).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "ESCALATED"
    ));
  addReason(reasons, verified && !mismatched ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return { verified, mismatched };
}

function validateLineageContinuity(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): { preserved: boolean; broken: boolean } {
  const broken = input.observability.evidencePath.lineageReferences.length === 0
    || orderedBundles(input).some((bundle) => (
      !lineageIntegrity(bundle)
      || collectLineageReferences(bundle).length === 0
    ));
  addReason(reasons, broken ? "LINEAGE_CONTINUITY_BROKEN" : "LINEAGE_CONTINUITY_PRESERVED");
  return { preserved: !broken, broken };
}

function validateObservabilityReconstruction(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): boolean {
  const reconstructed = input.observability.result.constraintGraphVisible
    && input.observability.result.constraintSeverityVisible
    && input.observability.result.constraintPropagationVisible
    && input.observability.result.constraintLineageVisible
    && input.observability.result.constraintAuditVisible
    && input.observability.evidencePath.auditReferences.length > 0;
  addReason(reasons, reconstructed ? "OBSERVABILITY_RECONSTRUCTED" : "OBSERVABILITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateBoundary(input: ConstraintReplayInput, reasons: ConstraintReplayReasonCode[]): BoundaryValidation {
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
    && !input.opportunityReplay.controlSurfacePresent
    && !input.opportunityCertification.controlSurfacePresent
    && !input.dependencyRiskReplay.controlSurfacePresent
    && !input.dependencyRiskCertification.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.impactReplay.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceReplay.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
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

export function createConstraintReplayEvidencePath(input: ConstraintReplayInput): ConstraintReplayEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.replayScope,
    constraintReferences: normalizeStrings([
      ...input.foundation.evidencePath.constraintReferences,
      ...input.analysis.evidencePath.constraintReferences,
      ...input.observability.evidencePath.constraintReferences,
    ]),
    severityReferences: normalizeStrings(input.analysis.evidencePath.severityReferences),
    propagationReferences: normalizeStrings(input.analysis.evidencePath.propagationReferences),
    conflictReferences: normalizeStrings(input.analysis.evidencePath.conflictReferences),
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
      input.foundation.result.constraintGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.opportunityReplay.result.replayHash,
      input.opportunityCertification.result.certificationHash,
      input.dependencyRiskReplay.result.replayHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.impactReplay.result.replayHash,
      input.impactCertification.result.certificationHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.resilienceReplay.result.replayHash,
      input.resilienceCertification.result.certificationHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...input.observability.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  constraintCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  governanceReferenceCount: number,
  reasons: ConstraintReplayReasonCode[],
): boolean {
  const valid = constraintCount <= MAX_CONSTRAINT_RECORDS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES;
  addReason(reasons, constraintCount <= MAX_CONSTRAINT_RECORDS ? "CONSTRAINT_RECORD_LIMIT_VALID" : "CONSTRAINT_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ConstraintReplayRequest,
  replayState: ConstraintReplayResult["replayState"],
  constraintReconstructed: boolean,
  severityReconstructed: boolean,
  propagationReconstructed: boolean,
  conflictsReconstructed: boolean,
  governanceReconstructed: boolean,
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): ConstraintReplayResult {
  return Object.freeze({
    tenantId: request.tenantId,
    replayState,
    constraintReconstructed,
    severityReconstructed,
    propagationReconstructed,
    conflictsReconstructed,
    governanceReconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

function buildObservability(result: ConstraintReplayResult): ConstraintReplayObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    replayState: result.replayState,
    constraintReconstructed: result.constraintReconstructed,
    severityReconstructed: result.severityReconstructed,
    propagationReconstructed: result.propagationReconstructed,
    conflictsReconstructed: result.conflictsReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  replayState: ConstraintReplayResult["replayState"],
  reasonCodes: readonly ConstraintReplayReasonCode[],
  flags: Readonly<{
    constraintReconstructed: boolean;
    severityReconstructed: boolean;
    propagationReconstructed: boolean;
    conflictsReconstructed: boolean;
    governanceReconstructed: boolean;
    observabilityReconstructed: boolean;
    ownershipValid: boolean;
    tenantIsolationVerified: boolean;
  }>,
  boundary: BoundaryValidation,
  counts: Readonly<{
    propagationCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
    governanceReferenceCount: number;
  }>,
): ConstraintReplayValidation {
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

export function buildConstraintReplayRequest(request: ConstraintReplayRequest): ConstraintReplayRequest {
  return requestCore(request);
}

export function sealConstraintReplay(input: ConstraintReplayInput): SealedConstraintReplayRecord {
  const reasons: ConstraintReplayReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.replayScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const observabilityValid = validateObservability(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const constraintReconstructed = validateConstraintReconstruction(input, reasons);
  const severityReconstructed = validateSeverityReconstruction(input, reasons);
  const evidenceValidation = validateEvidence(input, reasons);
  const propagationValidation = validatePropagation(input, reasons);
  const conflictsReconstructed = validateConflicts(input, reasons);
  const governanceValidation = validateGovernance(input, reasons);
  const replayHashValidation = validateReplayHashes(input, reasons);
  const lineageValidation = validateLineageContinuity(input, reasons);
  const observabilityReconstructed = validateObservabilityReconstruction(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createConstraintReplayEvidencePath(input);
  const counts = Object.freeze({
    propagationCount: evidencePath.propagationReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    governanceReferenceCount: evidencePath.governanceReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.constraintReferences.length,
    counts.propagationCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    counts.governanceReferenceCount,
    reasons,
  );
  addReason(reasons, "CONSTRAINT_REPLAY_IS_NOT_CONTROL");

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
    || propagationValidation.escalated
    || !conflictsReconstructed
    || !observabilityReconstructed
  );
  const limited = !invalid && !escalated && (
    !constraintReconstructed
    || !severityReconstructed
    || !evidenceValidation.reconstructed
    || !propagationValidation.reconstructed
    || evidenceValidation.degraded
    || !limitsValid
  );
  const replayState = invalid ? "INVALID" : escalated ? "ESCALATED" : limited ? "LIMITED" : "REPLAYABLE";

  const replayHash = hashReplayValue("constraint-replay-framework", {
    request: requestCore(input.request),
    replayState,
    constraintReferences: evidencePath.constraintReferences,
    severityReferences: evidencePath.severityReferences,
    propagationReferences: evidencePath.propagationReferences,
    conflictReferences: evidencePath.conflictReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });
  const reconstructionHash = hashReplayValue("constraint-replay-reconstruction", {
    replayHash,
    constraintReconstructed,
    severityReconstructed,
    evidenceReconstructed: evidenceValidation.reconstructed,
    propagationReconstructed: propagationValidation.reconstructed,
    conflictsReconstructed,
    governanceReconstructed: governanceValidation.reconstructed,
    observabilityReconstructed,
  });

  const result = buildResult(
    input.request,
    replayState,
    constraintReconstructed,
    severityReconstructed,
    propagationValidation.reconstructed,
    conflictsReconstructed,
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
      constraintReconstructed,
      severityReconstructed,
      propagationReconstructed: propagationValidation.reconstructed,
      conflictsReconstructed,
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
