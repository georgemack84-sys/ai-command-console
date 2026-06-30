import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ResilienceCertificationEvidencePath,
  ResilienceCertificationInput,
  ResilienceCertificationObservability,
  ResilienceCertificationReasonCode,
  ResilienceCertificationRequest,
  ResilienceCertificationResult,
  ResilienceCertificationScope,
  ResilienceCertificationValidation,
  SealedResilienceCertificationRecord,
} from "./types";

const MAX_RESILIENCE_RECORDS = 50_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;
const MAX_DISRUPTION_REFERENCES = 10_000;

const CERTIFICATION_SCOPES: readonly ResilienceCertificationScope[] = Object.freeze([
  "INTEGRITY",
  "STRENGTH",
  "PROPAGATION",
  "REPLAY",
  "GOVERNANCE",
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

function addReason(reasons: ResilienceCertificationReasonCode[], reason: ResilienceCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ResilienceCertificationRequest): ResilienceCertificationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: ResilienceCertificationInput): RecommendationPortfolioBundle[] {
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

function disruptionIntegrity(input: ResilienceCertificationInput): boolean {
  return input.foundation.result.resilienceState !== "FRAGILE"
    && input.analysis.result.analysisState !== "INVALID"
    && input.replay.result.replayState !== "INVALID";
}

function validateTenantId(request: ResilienceCertificationRequest, reasons: ResilienceCertificationReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: ResilienceCertificationScope, reasons: ResilienceCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateReplay(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const valid = input.replay.sealed === true && input.replay.result.tenantId === input.request.tenantId;
  addReason(reasons, input.replay.sealed === true ? "REPLAY_REQUIRED" : "REPLAY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.replay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftCertification.sealed === true
    && input.impactCertification.sealed === true
    && input.dependencyCertification.sealed === true
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
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
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

function validateOwnership(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateIntegrity(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const certified = input.foundation.result.resilienceState !== "FRAGILE"
    && input.foundation.result.resilienceRecordsCreated === input.foundation.resiliences.length
    && input.foundation.evidencePath.resilienceReferences.length === input.foundation.resiliences.length
    && input.foundation.evidencePath.baselineReferences.length > 0
    && input.foundation.evidencePath.disruptionReferences.length > 0
    && input.foundation.evidencePath.evidenceHashes.every((hash) => hash.length === 64);
  addReason(reasons, certified ? "INTEGRITY_CERTIFIED" : "INTEGRITY_BROKEN");
  return certified;
}

function validateStrength(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const certified = input.analysis.result.resilienceStrengthsDetected === input.analysis.evidencePath.strengthReferences.length
    && input.analysis.evidencePath.strengthReferences.length > 0
    && input.analysis.evidencePath.strengthReferences.every((ref) => (
      ref.endsWith(":VERY_RESILIENT")
      || ref.endsWith(":RESILIENT")
      || ref.endsWith(":MODERATELY_RESILIENT")
      || ref.endsWith(":WEAK")
      || ref.endsWith(":FRAGILE")
    ));
  addReason(reasons, certified ? "STRENGTH_CERTIFIED" : "STRENGTH_CLASSIFICATION_BROKEN");
  return certified;
}

function validatePropagation(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const certified = input.analysis.result.resiliencePropagationsDetected >= input.analysis.evidencePath.propagationReferences.length
    && input.analysis.evidencePath.propagationReferences.length > 0
    && input.replay.result.propagationReconstructed
    && input.replay.validation.propagationReconstructed;
  addReason(reasons, certified ? "PROPAGATION_CERTIFIED" : "PROPAGATION_BROKEN");
  return certified;
}

function validateReplayCertification(
  input: ResilienceCertificationInput,
  reasons: ResilienceCertificationReasonCode[],
): { certified: boolean; degraded: boolean } {
  const fail = input.replay.result.replayState === "INVALID" || input.replay.result.replayState === "ESCALATED";
  const degraded = !fail && (
    input.replay.result.replayState === "LIMITED"
    || input.replay.result.replayHash.length !== 64
    || input.replay.result.reconstructionHash.length !== 64
  );
  const certified = !fail && !degraded && input.replay.result.replayState === "REPLAYABLE";
  if (fail) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  else addReason(reasons, degraded ? "REPLAY_DEGRADED" : "REPLAY_CERTIFIED");
  return { certified, degraded };
}

function validateGovernance(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const certified = input.replay.result.governanceReconstructed
    && input.trustCertification.result.governanceCertified
    && input.driftCertification.result.governanceCertified
    && input.impactCertification.result.governanceCertified
    && input.dependencyCertification.result.governanceCertified
    && input.portfolioCertification.result.governanceCertified
    && orderedBundles(input).every((bundle) => governanceIntegrity(bundle));
  addReason(reasons, certified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return certified;
}

function validateObservabilityCertification(
  input: ResilienceCertificationInput,
  reasons: ResilienceCertificationReasonCode[],
): { certified: boolean; incomplete: boolean } {
  const incomplete = input.observability.result.observabilityState === "OBSERVE"
    || input.observability.result.observabilityState === "LIMITED"
    || !input.observability.result.resilienceGraphVisible
    || !input.observability.result.resilienceStrengthVisible
    || !input.observability.result.resiliencePropagationVisible
    || !input.observability.result.resilienceLineageVisible
    || !input.observability.result.resilienceGovernanceVisible
    || !input.observability.result.resilienceReplayVisible
    || !input.observability.result.resilienceAuditVisible;
  const certified = !incomplete && input.observability.result.observabilityState === "VISIBLE";
  addReason(reasons, certified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_INCOMPLETE");
  return { certified, incomplete };
}

function validateRecoverability(
  input: ResilienceCertificationInput,
  reasons: ResilienceCertificationReasonCode[],
): boolean {
  const certified = (
    input.replay.result.replayState === "REPLAYABLE"
    || input.replay.result.replayState === "LIMITED"
  )
    && input.replay.result.propagationReconstructed
    && input.replay.result.failuresReconstructed
    && input.replay.evidencePath.replayReferences.length > 0
    && input.replay.evidencePath.disruptionReferences.length > 0;
  addReason(reasons, certified ? "RECOVERABILITY_CERTIFIED" : "RECOVERABILITY_BROKEN");
  return certified;
}

function validateDisruptionTolerance(
  input: ResilienceCertificationInput,
  reasons: ResilienceCertificationReasonCode[],
): { certified: boolean; boundedConcern: boolean } {
  const boundedConcern = input.foundation.result.resilienceState === "DEGRADED"
    || input.analysis.result.analysisState === "LIMITED"
    || input.analysis.result.resilienceGapsDetected > 0
    || input.analysis.result.resilienceFailuresDetected > 0;
  const certified = disruptionIntegrity(input)
    && !boundedConcern
    && input.foundation.evidencePath.disruptionReferences.length > 0
    && input.replay.evidencePath.disruptionReferences.length > 0;
  addReason(reasons, certified
    ? "DISRUPTION_TOLERANCE_CERTIFIED"
    : boundedConcern
      ? "BOUNDED_DISRUPTION_CONCERN"
      : "DISRUPTION_TOLERANCE_BROKEN");
  return { certified, boundedConcern };
}

function validateLineage(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): boolean {
  const certified = input.replay.result.replayState !== "ESCALATED"
    && input.replay.result.replayState !== "INVALID"
    && orderedBundles(input).every((bundle) => (
      lineageIntegrity(bundle)
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, certified ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return certified;
}

function validateBoundary(input: ResilienceCertificationInput, reasons: ResilienceCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const repairAbsent = input.repairRequested !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.observability.controlSurfacePresent
    && !input.replay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
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
  addReason(reasons, repairAbsent ? "REPAIR_ABSENT" : "REPAIR_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
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
      || input.certificationMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createResilienceCertificationEvidencePath(input: ResilienceCertificationInput): ResilienceCertificationEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.certificationScope,
    resilienceReferences: normalizeStrings([
      ...input.foundation.evidencePath.resilienceReferences,
      ...input.analysis.evidencePath.resilienceReferences,
      ...input.observability.evidencePath.resilienceReferences,
      ...input.replay.evidencePath.resilienceReferences,
    ]),
    strengthReferences: normalizeStrings([
      ...input.analysis.evidencePath.strengthReferences,
      ...input.replay.evidencePath.strengthReferences,
    ]),
    propagationReferences: normalizeStrings([
      ...input.analysis.evidencePath.propagationReferences,
      ...input.observability.evidencePath.propagationReferences,
      ...input.replay.evidencePath.propagationReferences,
    ]),
    failureReferences: normalizeStrings([
      ...input.analysis.evidencePath.failureReferences,
      ...input.observability.evidencePath.failureReferences,
      ...input.replay.evidencePath.failureReferences,
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
    baselineReferences: normalizeStrings([
      ...input.foundation.evidencePath.baselineReferences,
      ...input.analysis.evidencePath.baselineReferences,
      ...input.replay.evidencePath.baselineReferences,
    ]),
    disruptionReferences: normalizeStrings([
      ...input.foundation.evidencePath.disruptionReferences,
      ...input.analysis.evidencePath.disruptionReferences,
      ...input.replay.evidencePath.disruptionReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.resilienceGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.replay.result.reconstructionHash,
      input.trustCertification.result.certificationHash,
      input.driftCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.dependencyCertification.result.certificationHash,
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
  resilienceCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  disruptionReferenceCount: number,
  reasons: ResilienceCertificationReasonCode[],
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
  request: ResilienceCertificationRequest,
  certificationState: ResilienceCertificationResult["certificationState"],
  integrityCertified: boolean,
  strengthCertified: boolean,
  propagationCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  recoverabilityCertified: boolean,
  disruptionToleranceCertified: boolean,
  tenantIsolationVerified: boolean,
  certificationHash: string,
): ResilienceCertificationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationState,
    integrityCertified,
    strengthCertified,
    propagationCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    recoverabilityCertified,
    disruptionToleranceCertified,
    tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

function buildObservability(result: ResilienceCertificationResult): ResilienceCertificationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    certificationState: result.certificationState,
    integrityCertified: result.integrityCertified,
    strengthCertified: result.strengthCertified,
    propagationCertified: result.propagationCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    observabilityCertified: result.observabilityCertified,
    recoverabilityCertified: result.recoverabilityCertified,
    disruptionToleranceCertified: result.disruptionToleranceCertified,
    certificationHash: result.certificationHash,
  });
}

function buildValidation(
  certificationState: ResilienceCertificationResult["certificationState"],
  reasonCodes: readonly ResilienceCertificationReasonCode[],
  flags: Readonly<{
    integrityCertified: boolean;
    strengthCertified: boolean;
    propagationCertified: boolean;
    replayCertified: boolean;
    governanceCertified: boolean;
    observabilityCertified: boolean;
    recoverabilityCertified: boolean;
    disruptionToleranceCertified: boolean;
    lineageCertified: boolean;
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
): ResilienceCertificationValidation {
  return Object.freeze({
    valid: certificationState !== "FAIL",
    certificationState,
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

export function buildResilienceCertificationRequest(request: ResilienceCertificationRequest): ResilienceCertificationRequest {
  return requestCore(request);
}

export function sealResilienceCertification(input: ResilienceCertificationInput): SealedResilienceCertificationRecord {
  const reasons: ResilienceCertificationReasonCode[] = [];
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
  const recoverabilityCertified = validateRecoverability(input, reasons);
  const disruptionTolerance = validateDisruptionTolerance(input, reasons);
  const lineageCertified = validateLineage(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createResilienceCertificationEvidencePath(input);
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
  addReason(reasons, "RESILIENCE_CERTIFICATION_IS_NOT_CONTROL");

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
    || !recoverabilityCertified
    || !lineageCertified
    || boundary.invalidBoundary
    || !limitsValid
    || reasons.includes("REPLAY_CORRUPTION_DETECTED")
    || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || reasons.includes("DISRUPTION_TOLERANCE_BROKEN");
  const conditional = !fail && (
    replayCertification.degraded
    || observabilityCertification.incomplete
    || disruptionTolerance.boundedConcern
  );
  const certificationState = fail ? "FAIL" : conditional ? "CONDITIONAL_PASS" : "PASS";

  const certificationHash = hashCertificationValue("resilience-certification-gate", {
    request: requestCore(input.request),
    certificationState,
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

  const result = buildResult(
    input.request,
    certificationState,
    integrityCertified,
    strengthCertified,
    propagationCertified,
    replayCertification.certified,
    governanceCertified,
    observabilityCertification.certified,
    recoverabilityCertified,
    disruptionTolerance.certified,
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
      recoverabilityCertified,
      disruptionToleranceCertified: disruptionTolerance.certified,
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
    repairAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
