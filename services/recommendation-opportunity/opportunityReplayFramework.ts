import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  OpportunityReplayEvidencePath,
  OpportunityReplayInput,
  OpportunityReplayObservability,
  OpportunityReplayReasonCode,
  OpportunityReplayRequest,
  OpportunityReplayResult,
  OpportunityReplayScope,
  OpportunityReplayValidation,
  SealedOpportunityReplayRecord,
} from "./types";

const MAX_OPPORTUNITY_RECORDS = 50_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_GOVERNANCE_REFERENCES = 10_000;

const REPLAY_SCOPES: readonly OpportunityReplayScope[] = Object.freeze([
  "OPPORTUNITY",
  "STRENGTH",
  "PROPAGATION",
  "CONFLICTS",
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

function addReason(reasons: OpportunityReplayReasonCode[], reason: OpportunityReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: OpportunityReplayRequest): OpportunityReplayRequest {
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

function orderedBundles(input: OpportunityReplayInput): RecommendationPortfolioBundle[] {
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

function replayIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.replay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED";
}

function validateTenantId(request: OpportunityReplayRequest, reasons: OpportunityReplayReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: OpportunityReplayScope, reasons: OpportunityReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservabilityInputRecord(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
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
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
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

function validateOwnership(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateOpportunityReconstruction(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const reconstructed = input.foundation.opportunities.length > 0
    && input.foundation.evidencePath.opportunityReferences.length === input.foundation.opportunities.length
    && input.analysis.evidencePath.opportunityReferences.length === input.foundation.evidencePath.opportunityReferences.length
    && input.observability.evidencePath.opportunityReferences.length === input.foundation.evidencePath.opportunityReferences.length;
  addReason(reasons, reconstructed ? "OPPORTUNITY_RECONSTRUCTED" : "OPPORTUNITY_EVIDENCE_MISSING");
  return reconstructed;
}

function validateStrengthReconstruction(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.result.opportunityStrengthsDetected >= 0
    && input.analysis.evidencePath.strengthReferences.length === input.analysis.result.opportunityStrengthsDetected
    && input.observability.evidencePath.strengthReferences.length === input.analysis.evidencePath.strengthReferences.length;
  addReason(reasons, reconstructed ? "STRENGTH_RECONSTRUCTED" : "STRENGTH_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateEvidence(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): { reconstructed: boolean; degraded: boolean } {
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

function validatePropagation(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): { reconstructed: boolean; escalated: boolean } {
  const mismatch = input.analysis.evidencePath.propagationReferences.length !== input.analysis.result.opportunityPropagationsDetected
    || input.observability.evidencePath.propagationReferences.length !== input.analysis.evidencePath.propagationReferences.length;
  const reconstructed = !mismatch && input.analysis.result.opportunityPropagationsDetected >= 0;
  addReason(reasons, reconstructed ? "PROPAGATION_RECONSTRUCTED" : "PROPAGATION_MISMATCH_DETECTED");
  return { reconstructed, escalated: mismatch };
}

function validateConflicts(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.evidencePath.conflictReferences.length === input.analysis.result.opportunityConflictsDetected
    && input.observability.evidencePath.conflictReferences.length === input.analysis.evidencePath.conflictReferences.length;
  addReason(reasons, reconstructed ? "CONFLICTS_RECONSTRUCTED" : "CONFLICT_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateGovernance(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): { reconstructed: boolean; degraded: boolean; corrupted: boolean } {
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

function validateReplayHashes(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): { verified: boolean; mismatched: boolean } {
  const replayHashes = normalizeStrings([
    ...orderedBundles(input).map((bundle) => bundle.replay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.governanceReplay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.replayFramework.result.replayHash),
  ]);
  const verified = replayHashes.every((hash) => hash.length === 64)
    && input.analysis.result.analysisHash.length === 64
    && input.observability.result.observabilityHash.length === 64;
  const mismatched = orderedBundles(input).some((bundle) => (
    bundle.replay.result.replayState === "INVALID"
    || bundle.replay.result.replayHash.length !== 64
    || bundle.governanceReplay.result.replayState === "INVALID"
    || bundle.governanceReplay.result.replayHash.length !== 64
    || bundle.replayFramework.result.replayState === "INVALID"
    || bundle.replayFramework.result.replayHash.length !== 64
  ));
  addReason(reasons, verified && !mismatched ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return { verified, mismatched };
}

function validateLineageContinuity(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): { preserved: boolean; broken: boolean } {
  const broken = input.observability.evidencePath.lineageReferences.length === 0
    || orderedBundles(input).some((bundle) => (
      !lineageIntegrity(bundle)
      || collectLineageReferences(bundle).length === 0
    ));
  addReason(reasons, broken ? "LINEAGE_CONTINUITY_BROKEN" : "LINEAGE_CONTINUITY_PRESERVED");
  return { preserved: !broken, broken };
}

function validateObservabilityReconstruction(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): boolean {
  const reconstructed = input.observability.result.opportunityGraphVisible
    && input.observability.result.opportunityStrengthVisible
    && input.observability.result.opportunityPropagationVisible
    && input.observability.result.opportunityLineageVisible
    && input.observability.result.opportunityAuditVisible
    && input.observability.evidencePath.auditReferences.length > 0;
  addReason(reasons, reconstructed ? "OBSERVABILITY_RECONSTRUCTED" : "OBSERVABILITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateBoundary(input: OpportunityReplayInput, reasons: OpportunityReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.observability.controlSurfacePresent
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
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_BLOCKED");
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
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
      || input.replayMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createOpportunityReplayEvidencePath(input: OpportunityReplayInput): OpportunityReplayEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.replayScope,
    opportunityReferences: normalizeStrings([
      ...input.foundation.evidencePath.opportunityReferences,
      ...input.analysis.evidencePath.opportunityReferences,
      ...input.observability.evidencePath.opportunityReferences,
    ]),
    strengthReferences: normalizeStrings(input.analysis.evidencePath.strengthReferences),
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
      input.foundation.result.opportunityGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
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
      ...input.observability.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  opportunityCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  governanceReferenceCount: number,
  reasons: OpportunityReplayReasonCode[],
): boolean {
  const valid = opportunityCount <= MAX_OPPORTUNITY_RECORDS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES;
  addReason(reasons, opportunityCount <= MAX_OPPORTUNITY_RECORDS ? "OPPORTUNITY_RECORD_LIMIT_VALID" : "OPPORTUNITY_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: OpportunityReplayRequest,
  replayState: OpportunityReplayResult["replayState"],
  opportunityReconstructed: boolean,
  strengthReconstructed: boolean,
  propagationReconstructed: boolean,
  conflictsReconstructed: boolean,
  governanceReconstructed: boolean,
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): OpportunityReplayResult {
  return Object.freeze({
    tenantId: request.tenantId,
    replayState,
    opportunityReconstructed,
    strengthReconstructed,
    propagationReconstructed,
    conflictsReconstructed,
    governanceReconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

function buildObservability(result: OpportunityReplayResult): OpportunityReplayObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    replayState: result.replayState,
    opportunityReconstructed: result.opportunityReconstructed,
    strengthReconstructed: result.strengthReconstructed,
    propagationReconstructed: result.propagationReconstructed,
    conflictsReconstructed: result.conflictsReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  replayState: OpportunityReplayResult["replayState"],
  reasonCodes: readonly OpportunityReplayReasonCode[],
  flags: Readonly<{
    opportunityReconstructed: boolean;
    strengthReconstructed: boolean;
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
): OpportunityReplayValidation {
  return Object.freeze({
    valid: replayState !== "INVALID",
    replayState,
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

export function buildOpportunityReplayRequest(request: OpportunityReplayRequest): OpportunityReplayRequest {
  return requestCore(request);
}

export function sealOpportunityReplay(input: OpportunityReplayInput): SealedOpportunityReplayRecord {
  const reasons: OpportunityReplayReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.replayScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const observabilityValid = validateObservabilityInputRecord(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const opportunityReconstructed = validateOpportunityReconstruction(input, reasons);
  const strengthReconstructed = validateStrengthReconstruction(input, reasons);
  const evidenceValidation = validateEvidence(input, reasons);
  const propagationValidation = validatePropagation(input, reasons);
  const conflictsReconstructed = validateConflicts(input, reasons);
  const governanceValidation = validateGovernance(input, reasons);
  const replayHashValidation = validateReplayHashes(input, reasons);
  const lineageValidation = validateLineageContinuity(input, reasons);
  const observabilityReconstructed = validateObservabilityReconstruction(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createOpportunityReplayEvidencePath(input);
  const counts = Object.freeze({
    propagationCount: evidencePath.propagationReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    governanceReferenceCount: evidencePath.governanceReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.opportunityReferences.length,
    counts.propagationCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    counts.governanceReferenceCount,
    reasons,
  );
  addReason(reasons, "OPPORTUNITY_REPLAY_IS_NOT_CONTROL");

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
    !opportunityReconstructed
    || !strengthReconstructed
    || !evidenceValidation.reconstructed
    || !propagationValidation.reconstructed
    || evidenceValidation.degraded
    || !limitsValid
  );
  const replayState = invalid ? "INVALID" : escalated ? "ESCALATED" : limited ? "LIMITED" : "REPLAYABLE";

  const replayHash = hashReplayValue("opportunity-replay-framework", {
    request: requestCore(input.request),
    replayState,
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
  const reconstructionHash = hashReplayValue("opportunity-replay-reconstruction", {
    replayHash,
    opportunityReconstructed,
    strengthReconstructed,
    evidenceReconstructed: evidenceValidation.reconstructed,
    propagationReconstructed: propagationValidation.reconstructed,
    conflictsReconstructed,
    governanceReconstructed: governanceValidation.reconstructed,
    observabilityReconstructed,
  });

  const result = buildResult(
    input.request,
    replayState,
    opportunityReconstructed,
    strengthReconstructed,
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
      opportunityReconstructed,
      strengthReconstructed,
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
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
