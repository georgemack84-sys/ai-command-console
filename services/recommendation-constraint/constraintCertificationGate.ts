import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ConstraintCertificationEvidencePath,
  ConstraintCertificationInput,
  ConstraintCertificationObservability,
  ConstraintCertificationReasonCode,
  ConstraintCertificationRequest,
  ConstraintCertificationResult,
  ConstraintCertificationScope,
  ConstraintCertificationValidation,
  SealedConstraintCertificationRecord,
} from "./types";

const MAX_CONSTRAINT_RECORDS = 50_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_EVIDENCE_REFERENCES = 10_000;

const CERTIFICATION_SCOPES: readonly ConstraintCertificationScope[] = Object.freeze([
  "INTEGRITY",
  "SEVERITY",
  "PROPAGATION",
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

function addReason(reasons: ConstraintCertificationReasonCode[], reason: ConstraintCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ConstraintCertificationRequest): ConstraintCertificationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: ConstraintCertificationInput): RecommendationPortfolioBundle[] {
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

function validateTenantId(request: ConstraintCertificationRequest, reasons: ConstraintCertificationReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: ConstraintCertificationScope, reasons: ConstraintCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateReplay(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const valid = input.replay.sealed === true && input.replay.result.tenantId === input.request.tenantId;
  addReason(reasons, input.replay.sealed === true ? "REPLAY_REQUIRED" : "REPLAY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  addReason(reasons, input.opportunityCertification.sealed === true ? "OPPORTUNITY_CERTIFICATION_REQUIRED" : "OPPORTUNITY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyRiskCertification.sealed === true ? "DEPENDENCY_RISK_CERTIFICATION_REQUIRED" : "DEPENDENCY_RISK_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, input.readinessCertification.sealed === true ? "READINESS_CERTIFICATION_REQUIRED" : "READINESS_CERTIFICATION_UNSEALED");
  addReason(reasons, input.governanceCertification.sealed === true ? "GOVERNANCE_CERTIFICATION_REQUIRED" : "GOVERNANCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.recommendationCertification.sealed === true ? "RECOMMENDATION_CERTIFICATION_REQUIRED" : "RECOMMENDATION_CERTIFICATION_UNSEALED");
  addReason(reasons, input.recommendationObservabilityCertification.sealed === true ? "RECOMMENDATION_OBSERVABILITY_CERTIFICATION_REQUIRED" : "RECOMMENDATION_OBSERVABILITY_CERTIFICATION_UNSEALED");

  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.replay.sealed === true
    && input.opportunityCertification.sealed === true
    && input.dependencyRiskCertification.sealed === true
    && input.dependencyCertification.sealed === true
    && input.impactCertification.sealed === true
    && input.trustCertification.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceCertification.sealed === true
    && input.portfolioCertification.sealed === true
    && input.readinessCertification.sealed === true
    && input.governanceCertification.sealed === true
    && input.recommendationCertification.sealed === true
    && input.recommendationObservabilityCertification.sealed === true
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

function validateTenantScope(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.opportunityCertification.result.tenantIsolationVerified
    && input.dependencyRiskCertification.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && input.readinessCertification.result.tenantIsolationVerified
    && input.governanceCertification.result.tenantIsolationVerified
    && input.recommendationCertification.result.tenantIsolationVerified
    && input.recommendationObservabilityCertification.result.tenantIsolationVerified
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

function validateOwnership(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && input.recommendationCertification.result.ownershipCertified
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateIntegrity(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const certified = input.foundation.result.constraintsCreated === input.foundation.constraints.length
    && input.foundation.constraints.length > 0
    && input.foundation.evidencePath.constraintReferences.length === input.foundation.constraints.length
    && input.foundation.evidencePath.lineageReferences.length > 0
    && input.foundation.evidencePath.governanceReferences.length > 0
    && input.foundation.evidencePath.replayReferences.length > 0
    && input.foundation.evidencePath.evidenceHashes.every((hash) => hash.length === 64);
  addReason(reasons, certified ? "INTEGRITY_CERTIFIED" : "INTEGRITY_BROKEN");
  return certified;
}

function validateSeverity(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const certified = input.analysis.result.constraintSeveritiesDetected === input.analysis.evidencePath.severityReferences.length
    && input.analysis.evidencePath.severityReferences.length > 0
    && input.analysis.evidencePath.severityReferences.every((ref) => (
      ref.endsWith(":LOW")
      || ref.endsWith(":MODERATE")
      || ref.endsWith(":HIGH")
      || ref.endsWith(":CRITICAL")
      || ref.endsWith(":BLOCKING")
    ));
  addReason(reasons, certified ? "SEVERITY_CERTIFIED" : "SEVERITY_CLASSIFICATION_BROKEN");
  return certified;
}

function validatePropagation(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const certified = input.analysis.evidencePath.propagationReferences.length === input.analysis.result.constraintPropagationsDetected
    && input.analysis.evidencePath.propagationReferences.length > 0
    && input.replay.result.propagationReconstructed
    && input.replay.validation.propagationReconstructed;
  addReason(reasons, certified ? "PROPAGATION_CERTIFIED" : "PROPAGATION_BROKEN");
  return certified;
}

function validateReplayCertification(
  input: ConstraintCertificationInput,
  reasons: ConstraintCertificationReasonCode[],
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

function validateGovernance(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const certified = input.replay.result.governanceReconstructed
    && input.opportunityCertification.result.governanceCertified
    && input.dependencyRiskCertification.result.governanceCertified
    && input.dependencyCertification.result.governanceCertified
    && input.impactCertification.result.governanceCertified
    && input.trustCertification.result.governanceCertified
    && input.driftCertification.result.governanceCertified
    && input.resilienceCertification.result.governanceCertified
    && input.portfolioCertification.result.governanceCertified
    && input.readinessCertification.result.governanceCertified
    && input.governanceCertification.result.certificationState !== "FAIL"
    && orderedBundles(input).every((bundle) => governanceIntegrity(bundle));
  addReason(reasons, certified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return certified;
}

function validateObservabilityCertification(
  input: ConstraintCertificationInput,
  reasons: ConstraintCertificationReasonCode[],
): { certified: boolean; incomplete: boolean } {
  const incomplete = input.observability.result.observabilityState === "OBSERVE"
    || input.observability.result.observabilityState === "LIMITED"
    || !input.observability.result.constraintGraphVisible
    || !input.observability.result.constraintSeverityVisible
    || !input.observability.result.constraintPropagationVisible
    || !input.observability.result.constraintLineageVisible
    || !input.observability.result.constraintGovernanceVisible
    || !input.observability.result.constraintReplayVisible
    || !input.observability.result.constraintAuditVisible;
  const certified = !incomplete && input.observability.result.observabilityState === "VISIBLE";
  addReason(reasons, certified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_INCOMPLETE");
  return { certified, incomplete };
}

function validateEvidenceCertification(
  input: ConstraintCertificationInput,
  reasons: ConstraintCertificationReasonCode[],
): { certified: boolean; degraded: boolean; broken: boolean } {
  const criticalMissing = input.foundation.evidencePath.evidenceHashes.length === 0
    || input.analysis.evidencePath.evidenceHashes.length === 0
    || input.observability.evidencePath.evidenceHashes.length === 0
    || input.replay.evidencePath.evidenceHashes.length === 0
    || input.replay.evidencePath.replayReferences.length === 0
    || input.replay.evidencePath.lineageReferences.length === 0
    || input.foundation.evidencePath.constraintReferences.length === 0;
  const malformedHashes = [
    ...input.foundation.evidencePath.evidenceHashes,
    ...input.analysis.evidencePath.evidenceHashes,
    ...input.observability.evidencePath.evidenceHashes,
    ...input.replay.evidencePath.evidenceHashes,
  ].some((hash) => hash.length !== 64);
  const broken = criticalMissing || malformedHashes;
  const degraded = !broken && (
    input.observability.evidencePath.auditReferences.length === 0
    || input.observability.evidencePath.governanceReferences.length === 0
    || input.replay.evidencePath.auditReferences.length === 0
  );
  const certified = !broken && !degraded;
  addReason(reasons, certified ? "EVIDENCE_CERTIFIED" : broken ? "EVIDENCE_CONTINUITY_BROKEN" : "EVIDENCE_DEGRADED");
  return { certified, degraded, broken };
}

function validateLineage(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): boolean {
  const certified = input.foundation.evidencePath.lineageReferences.length > 0
    && input.replay.evidencePath.lineageReferences.length > 0
    && input.recommendationCertification.result.lineageCertified
    && orderedBundles(input).every((bundle) => (
      lineageIntegrity(bundle)
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, certified ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return certified;
}

function validateBoundary(input: ConstraintCertificationInput, reasons: ConstraintCertificationReasonCode[]): BoundaryValidation {
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
    && !input.opportunityCertification.controlSurfacePresent
    && !input.dependencyRiskCertification.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.portfolioCertification.controlSurfacePresent
    && !input.readinessCertification.controlSurfacePresent
    && !input.governanceCertification.controlSurfacePresent
    && !input.recommendationCertification.controlSurfacePresent
    && !input.recommendationObservabilityCertification.controlSurfacePresent
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
      || input.workflowRoutingRequested === true
      || !prioritizationAbsent
      || !rankingAbsent
      || !approvalAbsent
      || !scoringAbsent
      || !resourceAllocationAbsent
      || !authorityBounded
      || input.certificationMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createConstraintCertificationEvidencePath(input: ConstraintCertificationInput): ConstraintCertificationEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.certificationScope,
    constraintReferences: normalizeStrings([
      ...input.foundation.evidencePath.constraintReferences,
      ...input.analysis.evidencePath.constraintReferences,
      ...input.observability.evidencePath.constraintReferences,
      ...input.replay.evidencePath.constraintReferences,
    ]),
    severityReferences: normalizeStrings([
      ...input.analysis.evidencePath.severityReferences,
      ...input.observability.evidencePath.severityReferences,
      ...input.replay.evidencePath.severityReferences,
    ]),
    propagationReferences: normalizeStrings([
      ...input.analysis.evidencePath.propagationReferences,
      ...input.observability.evidencePath.propagationReferences,
      ...input.replay.evidencePath.propagationReferences,
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
      ...input.replay.evidencePath.observabilityReferences,
      input.recommendationObservabilityCertification.result.certificationHash,
      ...bundles.flatMap(collectObservabilityReferences),
    ]),
    auditReferences: normalizeStrings([
      ...input.observability.evidencePath.auditReferences,
      ...input.replay.evidencePath.auditReferences,
      ...bundles.flatMap(collectAuditReferences),
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.constraintGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.replay.result.reconstructionHash,
      input.opportunityCertification.result.certificationHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.trustCertification.result.certificationHash,
      input.driftCertification.result.certificationHash,
      input.resilienceCertification.result.certificationHash,
      input.portfolioCertification.result.certificationHash,
      input.readinessCertification.result.certificationHash,
      input.governanceCertification.result.certificationHash,
      input.recommendationCertification.result.certificationHash,
      input.recommendationObservabilityCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...input.observability.evidencePath.evidenceHashes,
      ...input.replay.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  constraintCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  evidenceReferenceCount: number,
  reasons: ConstraintCertificationReasonCode[],
): boolean {
  const valid = constraintCount <= MAX_CONSTRAINT_RECORDS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && evidenceReferenceCount <= MAX_EVIDENCE_REFERENCES;
  addReason(reasons, constraintCount <= MAX_CONSTRAINT_RECORDS ? "CONSTRAINT_RECORD_LIMIT_VALID" : "CONSTRAINT_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidenceReferenceCount <= MAX_EVIDENCE_REFERENCES ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ConstraintCertificationRequest,
  certificationState: ConstraintCertificationResult["certificationState"],
  integrityCertified: boolean,
  severityCertified: boolean,
  propagationCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  evidenceCertified: boolean,
  tenantIsolationVerified: boolean,
  certificationHash: string,
): ConstraintCertificationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationState,
    integrityCertified,
    severityCertified,
    propagationCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    evidenceCertified,
    tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

function buildObservability(result: ConstraintCertificationResult): ConstraintCertificationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    certificationState: result.certificationState,
    integrityCertified: result.integrityCertified,
    severityCertified: result.severityCertified,
    propagationCertified: result.propagationCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    observabilityCertified: result.observabilityCertified,
    evidenceCertified: result.evidenceCertified,
    certificationHash: result.certificationHash,
  });
}

function buildValidation(
  certificationState: ConstraintCertificationResult["certificationState"],
  reasonCodes: readonly ConstraintCertificationReasonCode[],
  flags: Readonly<{
    integrityCertified: boolean;
    severityCertified: boolean;
    propagationCertified: boolean;
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
    propagationCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
    evidenceReferenceCount: number;
  }>,
): ConstraintCertificationValidation {
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

export function buildConstraintCertificationRequest(request: ConstraintCertificationRequest): ConstraintCertificationRequest {
  return requestCore(request);
}

export function sealConstraintCertification(input: ConstraintCertificationInput): SealedConstraintCertificationRecord {
  const reasons: ConstraintCertificationReasonCode[] = [];
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
  const severityCertified = validateSeverity(input, reasons);
  const propagationCertified = validatePropagation(input, reasons);
  const replayCertification = validateReplayCertification(input, reasons);
  const governanceCertified = validateGovernance(input, reasons);
  const observabilityCertification = validateObservabilityCertification(input, reasons);
  const evidenceCertification = validateEvidenceCertification(input, reasons);
  const lineageCertified = validateLineage(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createConstraintCertificationEvidencePath(input);
  const counts = Object.freeze({
    propagationCount: evidencePath.propagationReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    evidenceReferenceCount: evidencePath.evidenceHashes.length,
  });
  const limitsValid = validateLimits(
    evidencePath.constraintReferences.length,
    counts.propagationCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    counts.evidenceReferenceCount,
    reasons,
  );
  addReason(reasons, "CONSTRAINT_CERTIFICATION_IS_NOT_CONTROL");

  const fail = !requestValid
    || !foundationValid
    || !analysisValid
    || !observabilityValid
    || !replayValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !integrityCertified
    || !severityCertified
    || !propagationCertified
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

  const certificationHash = hashCertificationValue("constraint-certification-gate", {
    request: requestCore(input.request),
    certificationState,
    constraintReferences: evidencePath.constraintReferences,
    severityReferences: evidencePath.severityReferences,
    propagationReferences: evidencePath.propagationReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    certificationState,
    integrityCertified,
    severityCertified,
    propagationCertified,
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
      severityCertified,
      propagationCertified,
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
