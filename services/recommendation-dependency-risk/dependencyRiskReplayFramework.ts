import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyRiskReplayEvidencePath,
  DependencyRiskReplayInput,
  DependencyRiskReplayObservability,
  DependencyRiskReplayReasonCode,
  DependencyRiskReplayRequest,
  DependencyRiskReplayResult,
  DependencyRiskReplayScope,
  DependencyRiskReplayValidation,
  SealedDependencyRiskReplayRecord,
} from "./types";

const MAX_DEPENDENCY_RISK_RECORDS = 50_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;

const REPLAY_SCOPES: readonly DependencyRiskReplayScope[] = Object.freeze([
  "RISK",
  "SEVERITY",
  "PROPAGATION",
  "CONFLICTS",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DependencyRiskReplayReasonCode[], reason: DependencyRiskReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyRiskReplayRequest): DependencyRiskReplayRequest {
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

function orderedBundles(bundles: readonly RecommendationPortfolioBundle[]): RecommendationPortfolioBundle[] {
  return [...bundles].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
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
    ...bundle.readinessCertification.evidencePath.lineageReferences,
  ]);
}

function collectReplayReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.replayEvidence.replayReferences,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.governanceReplay.evidencePath.replayReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
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

function validateTenantId(request: DependencyRiskReplayRequest, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DependencyRiskReplayScope, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceReplay.sealed === true
    && input.resilienceCertification.sealed === true
    && input.impactCertification.sealed === true
    && input.portfolioCertification.sealed === true
    && orderedBundles(input.recommendations).every((bundle) => [
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
  addReason(reasons, input.dependencyReplay.sealed === true ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceReplay.sealed === true ? "RESILIENCE_REPLAY_REQUIRED" : "RESILIENCE_REPLAY_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceReplay.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input.recommendations).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_REPLAY_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input.recommendations).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateRiskReconstruction(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const reconstructed = input.foundation.risks.length > 0
    && input.foundation.evidencePath.dependencyRiskReferences.length === input.foundation.risks.length
    && input.analysis.evidencePath.dependencyRiskReferences.length === input.foundation.evidencePath.dependencyRiskReferences.length
    && input.observability.evidencePath.dependencyRiskReferences.length === input.foundation.evidencePath.dependencyRiskReferences.length;
  addReason(reasons, reconstructed ? "RISK_RECONSTRUCTED" : "RISK_EVIDENCE_MISSING");
  return reconstructed;
}

function validateSeverityReconstruction(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.result.riskSeveritiesDetected >= 0
    && input.analysis.evidencePath.severityReferences.length === input.analysis.result.riskSeveritiesDetected
    && input.observability.evidencePath.severityReferences.length === input.analysis.evidencePath.severityReferences.length;
  addReason(reasons, reconstructed ? "SEVERITY_RECONSTRUCTED" : "SEVERITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateEvidence(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): { reconstructed: boolean; degraded: boolean } {
  const missing = input.foundation.evidencePath.baselineReferences.length === 0
    || input.foundation.evidencePath.dependencyReferences.length === 0
    || input.foundation.evidencePath.replayReferences.length === 0
    || orderedBundles(input.recommendations).some((bundle) => (
      bundle.replayEvidence.replayReferences.length === 0
      || collectReplayReferences(bundle).length === 0
    ));
  const reconstructed = !missing
    && orderedBundles(input.recommendations).every((bundle) => collectEvidenceHashes(bundle).every((hash) => hash.length === 64));
  addReason(reasons, reconstructed ? "EVIDENCE_RECONSTRUCTED" : "REPLAY_ARTIFACTS_MISSING");
  return { reconstructed, degraded: missing };
}

function validatePropagation(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): { reconstructed: boolean; escalated: boolean } {
  const mismatch = input.analysis.result.riskPropagationsDetected < input.analysis.evidencePath.propagationReferences.length
    || input.observability.evidencePath.propagationReferences.length !== input.analysis.evidencePath.propagationReferences.length;
  const reconstructed = !mismatch && input.analysis.result.riskPropagationsDetected >= 0;
  addReason(reasons, reconstructed ? "PROPAGATION_RECONSTRUCTED" : "PROPAGATION_MISMATCH_DETECTED");
  return { reconstructed, escalated: mismatch };
}

function validateConflicts(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.evidencePath.conflictReferences.length === input.analysis.result.riskConflictsDetected
    && input.observability.evidencePath.conflictReferences.length === input.analysis.evidencePath.conflictReferences.length;
  addReason(reasons, reconstructed ? "CONFLICTS_RECONSTRUCTED" : "CONFLICT_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateGovernance(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): { reconstructed: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.observability.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || orderedBundles(input.recommendations).some((bundle) => !governanceIntegrity(bundle));
  const degraded = !corrupted && (
    input.observability.evidencePath.governanceReferences.length === 0
    || orderedBundles(input.recommendations).some((bundle) => collectGovernanceReferences(bundle).length === 0)
  );
  const reconstructed = !corrupted && !degraded;
  addReason(reasons, reconstructed ? "GOVERNANCE_RECONSTRUCTED" : degraded ? "GOVERNANCE_DEGRADATION_SURFACED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return { reconstructed, degraded, corrupted };
}

function validateReplayHashes(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): { verified: boolean; mismatched: boolean } {
  const replayHashes = normalizeStrings([
    input.dependencyReplay.result.replayHash,
    input.trustReplay.result.replayHash,
    input.driftReplay.result.replayHash,
    input.resilienceReplay.result.replayHash,
    ...orderedBundles(input.recommendations).map((bundle) => bundle.replay.result.replayHash),
    ...orderedBundles(input.recommendations).map((bundle) => bundle.governanceReplay.result.replayHash),
    ...orderedBundles(input.recommendations).map((bundle) => bundle.replayFramework.result.replayHash),
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
    || orderedBundles(input.recommendations).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "ESCALATED"
    ));
  addReason(reasons, verified && !mismatched ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return { verified, mismatched };
}

function validateLineageContinuity(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): { preserved: boolean; broken: boolean } {
  const broken = input.observability.evidencePath.lineageReferences.length === 0
    || orderedBundles(input.recommendations).some((bundle) => (
      !lineageIntegrity(bundle)
      || collectLineageReferences(bundle).length === 0
    ));
  addReason(reasons, broken ? "LINEAGE_CONTINUITY_BROKEN" : "LINEAGE_CONTINUITY_PRESERVED");
  return { preserved: !broken, broken };
}

function validateObservabilityReconstruction(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): boolean {
  const reconstructed = input.observability.result.dependencyRiskGraphVisible
    && input.observability.result.severityVisible
    && input.observability.result.propagationVisible
    && input.observability.result.lineageVisible
    && input.observability.result.auditVisible
    && input.observability.evidencePath.auditReferences.length > 0;
  addReason(reasons, reconstructed ? "OBSERVABILITY_RECONSTRUCTED" : "OBSERVABILITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateBoundary(input: DependencyRiskReplayInput, reasons: DependencyRiskReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.observability.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceReplay.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.portfolioCertification.controlSurfacePresent
    && orderedBundles(input.recommendations).every((bundle) => [
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
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !authorityBounded
      || input.replayMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyRiskReplayEvidencePath(input: DependencyRiskReplayInput): DependencyRiskReplayEvidencePath {
  const bundles = orderedBundles(input.recommendations);
  return Object.freeze({
    scope: input.request.replayScope,
    dependencyRiskReferences: normalizeStrings([
      ...input.foundation.evidencePath.dependencyRiskReferences,
      ...input.analysis.evidencePath.dependencyRiskReferences,
      ...input.observability.evidencePath.dependencyRiskReferences,
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
    baselineReferences: normalizeStrings(input.foundation.evidencePath.baselineReferences),
    dependencyReferences: normalizeStrings(input.foundation.evidencePath.dependencyReferences),
    evidenceHashes: normalizeStrings([
      input.foundation.result.dependencyRiskGraphHash,
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
      input.impactCertification.result.certificationHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...input.observability.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  dependencyRiskCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  reasons: DependencyRiskReplayReasonCode[],
): boolean {
  const valid = dependencyRiskCount <= MAX_DEPENDENCY_RISK_RECORDS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, dependencyRiskCount <= MAX_DEPENDENCY_RISK_RECORDS ? "DEPENDENCY_RISK_RECORD_LIMIT_VALID" : "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyRiskReplayRequest,
  replayState: DependencyRiskReplayResult["replayState"],
  riskReconstructed: boolean,
  severityReconstructed: boolean,
  propagationReconstructed: boolean,
  conflictsReconstructed: boolean,
  governanceReconstructed: boolean,
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): DependencyRiskReplayResult {
  return Object.freeze({
    tenantId: request.tenantId,
    replayState,
    riskReconstructed,
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

function buildObservability(result: DependencyRiskReplayResult): DependencyRiskReplayObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    replayState: result.replayState,
    riskReconstructed: result.riskReconstructed,
    severityReconstructed: result.severityReconstructed,
    propagationReconstructed: result.propagationReconstructed,
    conflictsReconstructed: result.conflictsReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  replayState: DependencyRiskReplayResult["replayState"],
  reasonCodes: readonly DependencyRiskReplayReasonCode[],
  flags: Readonly<{
    riskReconstructed: boolean;
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
  }>,
): DependencyRiskReplayValidation {
  return Object.freeze({
    valid: replayState !== "INVALID",
    replayState,
    reasonCodes: [...reasonCodes],
    ...flags,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildDependencyRiskReplayRequest(request: DependencyRiskReplayRequest): DependencyRiskReplayRequest {
  return requestCore(request);
}

export function sealDependencyRiskReplay(input: DependencyRiskReplayInput): SealedDependencyRiskReplayRecord {
  const reasons: DependencyRiskReplayReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.replayScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const observabilityValid = validateObservability(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const riskReconstructed = validateRiskReconstruction(input, reasons);
  const severityReconstructed = validateSeverityReconstruction(input, reasons);
  const evidenceValidation = validateEvidence(input, reasons);
  const propagationValidation = validatePropagation(input, reasons);
  const conflictsReconstructed = validateConflicts(input, reasons);
  const governanceValidation = validateGovernance(input, reasons);
  const replayHashValidation = validateReplayHashes(input, reasons);
  const lineageValidation = validateLineageContinuity(input, reasons);
  const observabilityReconstructed = validateObservabilityReconstruction(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyRiskReplayEvidencePath(input);
  const counts = Object.freeze({
    propagationCount: evidencePath.propagationReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.dependencyRiskReferences.length,
    counts.propagationCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_RISK_REPLAY_IS_NOT_CONTROL");

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
    !riskReconstructed
    || !severityReconstructed
    || !evidenceValidation.reconstructed
    || !propagationValidation.reconstructed
    || evidenceValidation.degraded
    || !limitsValid
  );
  const replayState = invalid ? "INVALID" : escalated ? "ESCALATED" : limited ? "LIMITED" : "REPLAYABLE";

  const replayHash = hashReplayValue("dependency-risk-replay-framework", {
    request: requestCore(input.request),
    replayState,
    dependencyRiskReferences: evidencePath.dependencyRiskReferences,
    severityReferences: evidencePath.severityReferences,
    propagationReferences: evidencePath.propagationReferences,
    conflictReferences: evidencePath.conflictReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    baselineReferences: evidencePath.baselineReferences,
    dependencyReferences: evidencePath.dependencyReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });
  const reconstructionHash = hashReplayValue("dependency-risk-replay-reconstruction", {
    replayHash,
    riskReconstructed,
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
    riskReconstructed,
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
      riskReconstructed,
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
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
