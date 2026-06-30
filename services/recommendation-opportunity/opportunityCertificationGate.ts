import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  OpportunityCertificationEvidencePath,
  OpportunityCertificationInput,
  OpportunityCertificationObservability,
  OpportunityCertificationReasonCode,
  OpportunityCertificationRequest,
  OpportunityCertificationResult,
  OpportunityCertificationScope,
  OpportunityCertificationValidation,
  SealedOpportunityCertificationRecord,
} from "./types";

const MAX_OPPORTUNITY_RECORDS = 50_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_EVIDENCE_REFERENCES = 10_000;

const CERTIFICATION_SCOPES: readonly OpportunityCertificationScope[] = Object.freeze([
  "INTEGRITY",
  "STRENGTH",
  "PROPAGATION",
  "REPLAY",
  "GOVERNANCE",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: OpportunityCertificationReasonCode[], reason: OpportunityCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: OpportunityCertificationRequest): OpportunityCertificationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: OpportunityCertificationInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "prioritizationAllowed",
    "approvalAllowed",
    "approvalOrderingAllowed",
    "recommendationApprovalAllowed",
    "recommendationRankingAllowed",
    "recommendationPrioritizationAllowed",
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
    ...bundle.observability.evidencePath.lineageReferences,
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

function validateTenantId(request: OpportunityCertificationRequest, reasons: OpportunityCertificationReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: OpportunityCertificationScope, reasons: OpportunityCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateReplay(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const valid = input.replay.sealed === true && input.replay.result.tenantId === input.request.tenantId;
  addReason(reasons, input.replay.sealed === true ? "REPLAY_REQUIRED" : "REPLAY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.replay.sealed === true
    && input.dependencyRiskCertification.sealed === true
    && input.dependencyCertification.sealed === true
    && input.impactCertification.sealed === true
    && input.trustCertification.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceCertification.sealed === true
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
  addReason(reasons, input.dependencyRiskCertification.sealed === true ? "DEPENDENCY_RISK_CERTIFICATION_REQUIRED" : "DEPENDENCY_RISK_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.dependencyRiskCertification.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
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

function validateOwnership(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateIntegrity(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const certified = input.foundation.result.opportunitiesCreated === input.foundation.opportunities.length
    && input.foundation.opportunities.length > 0
    && input.foundation.evidencePath.opportunityReferences.length === input.foundation.opportunities.length
    && input.foundation.evidencePath.lineageReferences.length > 0
    && input.foundation.evidencePath.governanceReferences.length > 0
    && input.foundation.evidencePath.replayReferences.length > 0
    && input.foundation.evidencePath.evidenceHashes.every((hash) => hash.length === 64);
  addReason(reasons, certified ? "INTEGRITY_CERTIFIED" : "INTEGRITY_BROKEN");
  return certified;
}

function validateStrength(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const certified = input.analysis.result.opportunityStrengthsDetected === input.analysis.evidencePath.strengthReferences.length
    && input.analysis.evidencePath.strengthReferences.length > 0
    && input.analysis.evidencePath.strengthReferences.every((ref) => (
      ref.endsWith(":STRONG")
      || ref.endsWith(":MODERATE")
      || ref.endsWith(":WEAK")
      || ref.endsWith(":CONSTRAINED")
      || ref.endsWith(":UNSUPPORTED")
    ));
  addReason(reasons, certified ? "STRENGTH_CERTIFIED" : "STRENGTH_CLASSIFICATION_BROKEN");
  return certified;
}

function validatePropagation(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const certified = input.analysis.evidencePath.propagationReferences.length === input.analysis.result.opportunityPropagationsDetected
    && input.analysis.evidencePath.propagationReferences.length > 0
    && input.replay.result.propagationReconstructed
    && input.replay.validation.propagationReconstructed;
  addReason(reasons, certified ? "PROPAGATION_CERTIFIED" : "PROPAGATION_BROKEN");
  return certified;
}

function validateReplayCertification(
  input: OpportunityCertificationInput,
  reasons: OpportunityCertificationReasonCode[],
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

function validateGovernance(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const certified = input.replay.result.governanceReconstructed
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
  input: OpportunityCertificationInput,
  reasons: OpportunityCertificationReasonCode[],
): { certified: boolean; incomplete: boolean } {
  const incomplete = input.observability.result.observabilityState === "OBSERVE"
    || input.observability.result.observabilityState === "LIMITED"
    || !input.observability.result.opportunityGraphVisible
    || !input.observability.result.opportunityStrengthVisible
    || !input.observability.result.opportunityPropagationVisible
    || !input.observability.result.opportunityLineageVisible
    || !input.observability.result.opportunityGovernanceVisible
    || !input.observability.result.opportunityReplayVisible
    || !input.observability.result.opportunityAuditVisible;
  const certified = !incomplete && input.observability.result.observabilityState === "VISIBLE";
  addReason(reasons, certified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_INCOMPLETE");
  return { certified, incomplete };
}

function validateEvidenceCertification(
  input: OpportunityCertificationInput,
  reasons: OpportunityCertificationReasonCode[],
): { certified: boolean; degraded: boolean; broken: boolean } {
  const criticalMissing = input.foundation.evidencePath.evidenceHashes.length === 0
    || input.analysis.evidencePath.evidenceHashes.length === 0
    || input.observability.evidencePath.evidenceHashes.length === 0
    || input.replay.evidencePath.evidenceHashes.length === 0
    || input.replay.evidencePath.replayReferences.length === 0
    || input.replay.evidencePath.lineageReferences.length === 0
    || input.foundation.evidencePath.opportunityReferences.length === 0;
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

function validateLineage(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): boolean {
  const certified = input.foundation.evidencePath.lineageReferences.length > 0
    && input.replay.evidencePath.lineageReferences.length > 0
    && orderedBundles(input).every((bundle) => (
      lineageIntegrity(bundle)
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, certified ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return certified;
}

function validateBoundary(input: OpportunityCertificationInput, reasons: OpportunityCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.observability.controlSurfacePresent
    && !input.replay.controlSurfacePresent
    && !input.dependencyRiskCertification.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
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
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    rankingAbsent,
    approvalAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || !rankingAbsent
      || !approvalAbsent
      || !resourceAllocationAbsent
      || !authorityBounded
      || input.certificationMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createOpportunityCertificationEvidencePath(input: OpportunityCertificationInput): OpportunityCertificationEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.certificationScope,
    opportunityReferences: normalizeStrings([
      ...input.foundation.evidencePath.opportunityReferences,
      ...input.analysis.evidencePath.opportunityReferences,
      ...input.observability.evidencePath.opportunityReferences,
      ...input.replay.evidencePath.opportunityReferences,
    ]),
    strengthReferences: normalizeStrings([
      ...input.analysis.evidencePath.strengthReferences,
      ...input.observability.evidencePath.strengthReferences,
      ...input.replay.evidencePath.strengthReferences,
    ]),
    propagationReferences: normalizeStrings([
      ...input.analysis.evidencePath.propagationReferences,
      ...input.observability.evidencePath.propagationReferences,
      ...input.replay.evidencePath.propagationReferences,
    ]),
    conflictReferences: normalizeStrings([
      ...input.analysis.evidencePath.conflictReferences,
      ...input.observability.evidencePath.conflictReferences,
      ...input.replay.evidencePath.conflictReferences,
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
      ...bundles.flatMap(collectObservabilityReferences),
    ]),
    auditReferences: normalizeStrings([
      ...input.observability.evidencePath.auditReferences,
      ...input.replay.evidencePath.auditReferences,
      ...bundles.flatMap(collectAuditReferences),
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.opportunityGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.replay.result.reconstructionHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.trustCertification.result.certificationHash,
      input.driftCertification.result.certificationHash,
      input.resilienceCertification.result.certificationHash,
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
  opportunityCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  evidenceReferenceCount: number,
  reasons: OpportunityCertificationReasonCode[],
): boolean {
  const valid = opportunityCount <= MAX_OPPORTUNITY_RECORDS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && evidenceReferenceCount <= MAX_EVIDENCE_REFERENCES;
  addReason(reasons, opportunityCount <= MAX_OPPORTUNITY_RECORDS ? "OPPORTUNITY_RECORD_LIMIT_VALID" : "OPPORTUNITY_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, evidenceReferenceCount <= MAX_EVIDENCE_REFERENCES ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: OpportunityCertificationRequest,
  certificationState: OpportunityCertificationResult["certificationState"],
  integrityCertified: boolean,
  strengthCertified: boolean,
  propagationCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  evidenceCertified: boolean,
  tenantIsolationVerified: boolean,
  certificationHash: string,
): OpportunityCertificationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationState,
    integrityCertified,
    strengthCertified,
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

function buildObservability(result: OpportunityCertificationResult): OpportunityCertificationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    certificationState: result.certificationState,
    integrityCertified: result.integrityCertified,
    strengthCertified: result.strengthCertified,
    propagationCertified: result.propagationCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    observabilityCertified: result.observabilityCertified,
    evidenceCertified: result.evidenceCertified,
    certificationHash: result.certificationHash,
  });
}

function buildValidation(
  certificationState: OpportunityCertificationResult["certificationState"],
  reasonCodes: readonly OpportunityCertificationReasonCode[],
  flags: Readonly<{
    integrityCertified: boolean;
    strengthCertified: boolean;
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
): OpportunityCertificationValidation {
  return Object.freeze({
    valid: certificationState !== "FAIL",
    certificationState,
    reasonCodes: [...reasonCodes],
    ...flags,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    rankingAbsent: boundary.rankingAbsent,
    approvalAbsent: boundary.approvalAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildOpportunityCertificationRequest(request: OpportunityCertificationRequest): OpportunityCertificationRequest {
  return requestCore(request);
}

export function sealOpportunityCertification(input: OpportunityCertificationInput): SealedOpportunityCertificationRecord {
  const reasons: OpportunityCertificationReasonCode[] = [];
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
  const strengthCertified = validateStrength(input, reasons);
  const propagationCertified = validatePropagation(input, reasons);
  const replayCertification = validateReplayCertification(input, reasons);
  const governanceCertified = validateGovernance(input, reasons);
  const observabilityCertification = validateObservabilityCertification(input, reasons);
  const evidenceCertification = validateEvidenceCertification(input, reasons);
  const lineageCertified = validateLineage(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createOpportunityCertificationEvidencePath(input);
  const counts = Object.freeze({
    propagationCount: evidencePath.propagationReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    evidenceReferenceCount: evidencePath.evidenceHashes.length,
  });
  const limitsValid = validateLimits(
    evidencePath.opportunityReferences.length,
    counts.propagationCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    counts.evidenceReferenceCount,
    reasons,
  );
  addReason(reasons, "OPPORTUNITY_CERTIFICATION_IS_NOT_CONTROL");

  const fail = !requestValid
    || !foundationValid
    || !analysisValid
    || !observabilityValid
    || !replayValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !integrityCertified
    || !strengthCertified
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

  const certificationHash = hashCertificationValue("opportunity-certification-gate", {
    request: requestCore(input.request),
    certificationState,
    opportunityReferences: evidencePath.opportunityReferences,
    strengthReferences: evidencePath.strengthReferences,
    propagationReferences: evidencePath.propagationReferences,
    conflictReferences: evidencePath.conflictReferences,
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
    strengthCertified,
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
      strengthCertified,
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
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
