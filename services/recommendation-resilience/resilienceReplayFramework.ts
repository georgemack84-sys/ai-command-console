import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ResilienceReplayEvidencePath,
  ResilienceReplayInput,
  ResilienceReplayObservability,
  ResilienceReplayReasonCode,
  ResilienceReplayRequest,
  ResilienceReplayResult,
  ResilienceReplayScope,
  ResilienceReplayValidation,
  SealedResilienceReplayRecord,
} from "./types";

const MAX_RESILIENCE_RECORDS = 50_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_DISRUPTION_REFERENCES = 10_000;

const REPLAY_SCOPES: readonly ResilienceReplayScope[] = Object.freeze([
  "RESILIENCE",
  "STRENGTH",
  "PROPAGATION",
  "FAILURES",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: ResilienceReplayReasonCode[], reason: ResilienceReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ResilienceReplayRequest): ResilienceReplayRequest {
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
    "repairAllowed",
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

function validateTenantId(request: ResilienceReplayRequest, reasons: ResilienceReplayReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: ResilienceReplayScope, reasons: ResilienceReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.impactCertification.sealed === true
    && input.dependencyCertification.sealed === true
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
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
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

function validateOwnership(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input.recommendations).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateResilienceReconstruction(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const reconstructed = input.foundation.resiliences.length > 0
    && input.foundation.evidencePath.resilienceReferences.length === input.foundation.resiliences.length
    && input.analysis.evidencePath.resilienceReferences.length === input.foundation.evidencePath.resilienceReferences.length;
  addReason(reasons, reconstructed ? "RESILIENCE_RECONSTRUCTED" : "RESILIENCE_EVIDENCE_MISSING");
  return reconstructed;
}

function validateStrengthReconstruction(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.result.resilienceStrengthsDetected >= 0
    && input.analysis.evidencePath.strengthReferences.length === input.analysis.result.resilienceStrengthsDetected
    && input.observability.evidencePath.strengthReferences.length === input.analysis.evidencePath.strengthReferences.length;
  addReason(reasons, reconstructed ? "STRENGTH_RECONSTRUCTED" : "STRENGTH_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateEvidence(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): { reconstructed: boolean; degraded: boolean } {
  const missing = input.foundation.evidencePath.baselineReferences.length === 0
    || input.foundation.evidencePath.disruptionReferences.length === 0
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

function validatePropagation(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): { reconstructed: boolean; escalated: boolean } {
  const mismatch = input.analysis.result.resiliencePropagationsDetected < input.analysis.evidencePath.propagationReferences.length
    || input.observability.evidencePath.propagationReferences.length !== input.analysis.evidencePath.propagationReferences.length;
  const reconstructed = !mismatch && input.analysis.result.resiliencePropagationsDetected >= 0;
  addReason(reasons, reconstructed ? "PROPAGATION_RECONSTRUCTED" : "PROPAGATION_MISMATCH_DETECTED");
  return { reconstructed, escalated: mismatch };
}

function validateFailures(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.evidencePath.failureReferences.length === input.analysis.result.resilienceFailuresDetected
    && input.observability.evidencePath.failureReferences.length === input.analysis.evidencePath.failureReferences.length;
  addReason(reasons, reconstructed ? "FAILURES_RECONSTRUCTED" : "FAILURE_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateGovernance(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): { reconstructed: boolean; degraded: boolean; corrupted: boolean } {
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

function validateReplayHashes(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): { verified: boolean; mismatched: boolean } {
  const replayHashes = normalizeStrings([
    input.trustReplay.result.replayHash,
    input.driftReplay.result.replayHash,
    ...orderedBundles(input.recommendations).map((bundle) => bundle.replay.result.replayHash),
    ...orderedBundles(input.recommendations).map((bundle) => bundle.governanceReplay.result.replayHash),
    ...orderedBundles(input.recommendations).map((bundle) => bundle.replayFramework.result.replayHash),
  ]);
  const verified = replayHashes.every((hash) => hash.length === 64)
    && input.analysis.result.analysisHash.length === 64
    && input.observability.result.observabilityHash.length === 64;
  const mismatched = input.trustReplay.result.replayState === "INVALID"
    || input.trustReplay.result.replayState === "ESCALATED"
    || input.driftReplay.result.replayState === "INVALID"
    || input.driftReplay.result.replayState === "ESCALATED"
    || orderedBundles(input.recommendations).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "ESCALATED"
    ));
  addReason(reasons, verified && !mismatched ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return { verified, mismatched };
}

function validateLineageContinuity(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): { preserved: boolean; broken: boolean } {
  const broken = input.observability.evidencePath.lineageReferences.length === 0
    || orderedBundles(input.recommendations).some((bundle) => (
      !lineageIntegrity(bundle)
      || collectLineageReferences(bundle).length === 0
    ));
  addReason(reasons, broken ? "LINEAGE_CONTINUITY_BROKEN" : "LINEAGE_CONTINUITY_PRESERVED");
  return { preserved: !broken, broken };
}

function validateObservabilityReconstruction(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): boolean {
  const reconstructed = input.observability.result.resilienceGraphVisible
    && input.observability.result.resilienceStrengthVisible
    && input.observability.result.resiliencePropagationVisible
    && input.observability.result.resilienceLineageVisible
    && input.observability.result.resilienceAuditVisible
    && input.observability.evidencePath.auditReferences.length > 0;
  addReason(reasons, reconstructed ? "OBSERVABILITY_RECONSTRUCTED" : "OBSERVABILITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateBoundary(input: ResilienceReplayInput, reasons: ResilienceReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const repairAbsent = input.repairRequested !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.observability.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
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
  addReason(reasons, repairAbsent ? "REPAIR_ABSENT" : "REPAIR_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    repairAbsent,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !repairAbsent
      || !authorityBounded
      || input.replayMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createResilienceReplayEvidencePath(input: ResilienceReplayInput): ResilienceReplayEvidencePath {
  const bundles = orderedBundles(input.recommendations);
  return Object.freeze({
    scope: input.request.replayScope,
    resilienceReferences: normalizeStrings([
      ...input.foundation.evidencePath.resilienceReferences,
      ...input.analysis.evidencePath.resilienceReferences,
      ...input.observability.evidencePath.resilienceReferences,
    ]),
    strengthReferences: normalizeStrings(input.analysis.evidencePath.strengthReferences),
    propagationReferences: normalizeStrings(input.analysis.evidencePath.propagationReferences),
    failureReferences: normalizeStrings(input.analysis.evidencePath.failureReferences),
    lineageReferences: normalizeStrings([
      ...input.foundation.evidencePath.lineageReferences,
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
    baselineReferences: normalizeStrings([
      ...input.foundation.evidencePath.baselineReferences,
      ...input.analysis.evidencePath.baselineReferences,
    ]),
    disruptionReferences: normalizeStrings([
      ...input.foundation.evidencePath.disruptionReferences,
      ...input.analysis.evidencePath.disruptionReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.resilienceGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.dependencyCertification.result.certificationHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...input.observability.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  resilienceCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  disruptionReferenceCount: number,
  reasons: ResilienceReplayReasonCode[],
): boolean {
  const valid = resilienceCount <= MAX_RESILIENCE_RECORDS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES
    && disruptionReferenceCount <= MAX_DISRUPTION_REFERENCES;
  addReason(reasons, resilienceCount <= MAX_RESILIENCE_RECORDS ? "RESILIENCE_RECORD_LIMIT_VALID" : "RESILIENCE_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, disruptionReferenceCount <= MAX_DISRUPTION_REFERENCES ? "DISRUPTION_REFERENCE_LIMIT_VALID" : "DISRUPTION_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ResilienceReplayRequest,
  replayState: ResilienceReplayResult["replayState"],
  resilienceReconstructed: boolean,
  strengthReconstructed: boolean,
  propagationReconstructed: boolean,
  failuresReconstructed: boolean,
  governanceReconstructed: boolean,
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): ResilienceReplayResult {
  return Object.freeze({
    tenantId: request.tenantId,
    replayState,
    resilienceReconstructed,
    strengthReconstructed,
    propagationReconstructed,
    failuresReconstructed,
    governanceReconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

function buildObservability(result: ResilienceReplayResult): ResilienceReplayObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    replayState: result.replayState,
    resilienceReconstructed: result.resilienceReconstructed,
    strengthReconstructed: result.strengthReconstructed,
    propagationReconstructed: result.propagationReconstructed,
    failuresReconstructed: result.failuresReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  replayState: ResilienceReplayResult["replayState"],
  reasonCodes: readonly ResilienceReplayReasonCode[],
  flags: Readonly<{
    resilienceReconstructed: boolean;
    strengthReconstructed: boolean;
    propagationReconstructed: boolean;
    failuresReconstructed: boolean;
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
    disruptionReferenceCount: number;
  }>,
): ResilienceReplayValidation {
  return Object.freeze({
    valid: replayState !== "INVALID",
    replayState,
    reasonCodes: [...reasonCodes],
    ...flags,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    repairAbsent: boundary.repairAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildResilienceReplayRequest(request: ResilienceReplayRequest): ResilienceReplayRequest {
  return requestCore(request);
}

export function sealResilienceReplay(input: ResilienceReplayInput): SealedResilienceReplayRecord {
  const reasons: ResilienceReplayReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.replayScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const observabilityValid = validateObservability(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const resilienceReconstructed = validateResilienceReconstruction(input, reasons);
  const strengthReconstructed = validateStrengthReconstruction(input, reasons);
  const evidenceValidation = validateEvidence(input, reasons);
  const propagationValidation = validatePropagation(input, reasons);
  const failuresReconstructed = validateFailures(input, reasons);
  const governanceValidation = validateGovernance(input, reasons);
  const replayHashValidation = validateReplayHashes(input, reasons);
  const lineageValidation = validateLineageContinuity(input, reasons);
  const observabilityReconstructed = validateObservabilityReconstruction(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createResilienceReplayEvidencePath(input);
  const counts = Object.freeze({
    propagationCount: evidencePath.propagationReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
    disruptionReferenceCount: evidencePath.disruptionReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.resilienceReferences.length,
    counts.propagationCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    counts.disruptionReferenceCount,
    reasons,
  );
  addReason(reasons, "RESILIENCE_REPLAY_IS_NOT_CONTROL");

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
    || !failuresReconstructed
    || !observabilityReconstructed
  );
  const limited = !invalid && !escalated && (
    !resilienceReconstructed
    || !strengthReconstructed
    || !evidenceValidation.reconstructed
    || !propagationValidation.reconstructed
    || evidenceValidation.degraded
    || !limitsValid
  );
  const replayState = invalid ? "INVALID" : escalated ? "ESCALATED" : limited ? "LIMITED" : "REPLAYABLE";

  const replayHash = hashReplayValue("resilience-replay-framework", {
    request: requestCore(input.request),
    replayState,
    resilienceReferences: evidencePath.resilienceReferences,
    strengthReferences: evidencePath.strengthReferences,
    propagationReferences: evidencePath.propagationReferences,
    failureReferences: evidencePath.failureReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    baselineReferences: evidencePath.baselineReferences,
    disruptionReferences: evidencePath.disruptionReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });
  const reconstructionHash = hashReplayValue("resilience-replay-reconstruction", {
    replayHash,
    resilienceReconstructed,
    strengthReconstructed,
    evidenceReconstructed: evidenceValidation.reconstructed,
    propagationReconstructed: propagationValidation.reconstructed,
    failuresReconstructed,
    governanceReconstructed: governanceValidation.reconstructed,
    observabilityReconstructed,
  });

  const result = buildResult(
    input.request,
    replayState,
    resilienceReconstructed,
    strengthReconstructed,
    propagationValidation.reconstructed,
    failuresReconstructed,
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
      resilienceReconstructed,
      strengthReconstructed,
      propagationReconstructed: propagationValidation.reconstructed,
      failuresReconstructed,
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
    repairAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
