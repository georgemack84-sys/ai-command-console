import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyRiskCertificationEvidencePath,
  DependencyRiskCertificationInput,
  DependencyRiskCertificationObservability,
  DependencyRiskCertificationReasonCode,
  DependencyRiskCertificationRequest,
  DependencyRiskCertificationResult,
  DependencyRiskCertificationScope,
  DependencyRiskCertificationValidation,
  SealedDependencyRiskCertificationRecord,
} from "./types";

const MAX_DEPENDENCY_RISK_RECORDS = 50_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;

const CERTIFICATION_SCOPES: readonly DependencyRiskCertificationScope[] = Object.freeze([
  "INTEGRITY",
  "SEVERITY",
  "PROPAGATION",
  "REPLAY",
  "GOVERNANCE",
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

function addReason(reasons: DependencyRiskCertificationReasonCode[], reason: DependencyRiskCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyRiskCertificationRequest): DependencyRiskCertificationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DependencyRiskCertificationInput): RecommendationPortfolioBundle[] {
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
    ...bundle.replayFramework.evidencePath.lineageReferences,
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

function validateTenantId(request: DependencyRiskCertificationRequest, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DependencyRiskCertificationScope, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateReplay(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const valid = input.replay.sealed === true && input.replay.result.tenantId === input.request.tenantId;
  addReason(reasons, input.replay.sealed === true ? "REPLAY_REQUIRED" : "REPLAY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.replay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.trustCertification.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceCertification.sealed === true
    && input.impactCertification.sealed === true
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
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
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

function validateOwnership(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateIntegrity(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const certified = input.foundation.result.dependencyRiskState !== "UNKNOWN"
    && input.foundation.result.dependencyRiskRecordsCreated === input.foundation.risks.length
    && input.foundation.evidencePath.dependencyRiskReferences.length === input.foundation.risks.length
    && input.foundation.evidencePath.baselineReferences.length > 0
    && input.foundation.evidencePath.dependencyReferences.length > 0
    && input.foundation.evidencePath.evidenceHashes.every((hash) => hash.length === 64);
  addReason(reasons, certified ? "INTEGRITY_CERTIFIED" : "INTEGRITY_BROKEN");
  return certified;
}

function validateSeverity(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const certified = input.analysis.result.riskSeveritiesDetected === input.analysis.evidencePath.severityReferences.length
    && input.analysis.evidencePath.severityReferences.length > 0
    && input.analysis.evidencePath.severityReferences.every((ref) => (
      ref.endsWith(":LOW")
      || ref.endsWith(":MODERATE")
      || ref.endsWith(":HIGH")
      || ref.endsWith(":CRITICAL")
    ));
  addReason(reasons, certified ? "SEVERITY_CERTIFIED" : "SEVERITY_CLASSIFICATION_BROKEN");
  return certified;
}

function validatePropagation(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const certified = input.analysis.result.riskPropagationsDetected >= input.analysis.evidencePath.propagationReferences.length
    && input.analysis.evidencePath.propagationReferences.length > 0
    && input.replay.result.propagationReconstructed
    && input.replay.validation.propagationReconstructed;
  addReason(reasons, certified ? "PROPAGATION_CERTIFIED" : "PROPAGATION_BROKEN");
  return certified;
}

function validateReplayCertification(
  input: DependencyRiskCertificationInput,
  reasons: DependencyRiskCertificationReasonCode[],
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

function validateGovernance(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const certified = input.replay.result.governanceReconstructed
    && input.dependencyCertification.result.governanceCertified
    && input.trustCertification.result.governanceCertified
    && input.driftCertification.result.governanceCertified
    && input.resilienceCertification.result.governanceCertified
    && input.impactCertification.result.governanceCertified
    && input.portfolioCertification.result.governanceCertified
    && orderedBundles(input).every((bundle) => governanceIntegrity(bundle));
  addReason(reasons, certified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return certified;
}

function validateObservabilityCertification(
  input: DependencyRiskCertificationInput,
  reasons: DependencyRiskCertificationReasonCode[],
): { certified: boolean; incomplete: boolean } {
  const incomplete = input.observability.result.observabilityState === "OBSERVE"
    || input.observability.result.observabilityState === "LIMITED"
    || !input.observability.result.dependencyRiskGraphVisible
    || !input.observability.result.severityVisible
    || !input.observability.result.propagationVisible
    || !input.observability.result.lineageVisible
    || !input.observability.result.replayVisible
    || !input.observability.result.auditVisible;
  const certified = !incomplete && input.observability.result.observabilityState === "VISIBLE";
  addReason(reasons, certified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_INCOMPLETE");
  return { certified, incomplete };
}

function validateLineage(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): boolean {
  const certified = input.replay.result.replayState !== "ESCALATED"
    && input.replay.result.replayState !== "INVALID"
    && orderedBundles(input).every((bundle) => (
      lineageIntegrity(bundle)
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, certified ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return certified;
}

function validateBoundary(input: DependencyRiskCertificationInput, reasons: DependencyRiskCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.observability.controlSurfacePresent
    && !input.replay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
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
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
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
      || input.certificationMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyRiskCertificationEvidencePath(input: DependencyRiskCertificationInput): DependencyRiskCertificationEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.certificationScope,
    dependencyRiskReferences: normalizeStrings([
      ...input.foundation.evidencePath.dependencyRiskReferences,
      ...input.analysis.evidencePath.dependencyRiskReferences,
      ...input.observability.evidencePath.dependencyRiskReferences,
      ...input.replay.evidencePath.dependencyRiskReferences,
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
    conflictReferences: normalizeStrings([
      ...input.analysis.evidencePath.conflictReferences,
      ...input.observability.evidencePath.conflictReferences,
      ...input.replay.evidencePath.conflictReferences,
    ]),
    lineageReferences: normalizeStrings([
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
      ...input.replay.evidencePath.baselineReferences,
    ]),
    dependencyReferences: normalizeStrings([
      ...input.foundation.evidencePath.dependencyReferences,
      ...input.analysis.evidencePath.dependencyReferences,
      ...input.replay.evidencePath.dependencyReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.dependencyRiskGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.replay.result.reconstructionHash,
      input.dependencyCertification.result.certificationHash,
      input.trustCertification.result.certificationHash,
      input.driftCertification.result.certificationHash,
      input.resilienceCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
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
  dependencyRiskCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  reasons: DependencyRiskCertificationReasonCode[],
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
  request: DependencyRiskCertificationRequest,
  certificationState: DependencyRiskCertificationResult["certificationState"],
  integrityCertified: boolean,
  severityCertified: boolean,
  propagationCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  tenantIsolationVerified: boolean,
  certificationHash: string,
): DependencyRiskCertificationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationState,
    integrityCertified,
    severityCertified,
    propagationCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyRiskCertificationResult): DependencyRiskCertificationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    certificationState: result.certificationState,
    integrityCertified: result.integrityCertified,
    severityCertified: result.severityCertified,
    propagationCertified: result.propagationCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    observabilityCertified: result.observabilityCertified,
    certificationHash: result.certificationHash,
  });
}

function buildValidation(
  certificationState: DependencyRiskCertificationResult["certificationState"],
  reasonCodes: readonly DependencyRiskCertificationReasonCode[],
  flags: Readonly<{
    integrityCertified: boolean;
    severityCertified: boolean;
    propagationCertified: boolean;
    replayCertified: boolean;
    governanceCertified: boolean;
    observabilityCertified: boolean;
    lineageCertified: boolean;
    ownershipValid: boolean;
    tenantIsolationVerified: boolean;
  }>,
  boundary: BoundaryValidation,
  counts: Readonly<{
    propagationCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
  }>,
): DependencyRiskCertificationValidation {
  return Object.freeze({
    valid: certificationState !== "FAIL",
    certificationState,
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

export function buildDependencyRiskCertificationRequest(request: DependencyRiskCertificationRequest): DependencyRiskCertificationRequest {
  return requestCore(request);
}

export function sealDependencyRiskCertification(input: DependencyRiskCertificationInput): SealedDependencyRiskCertificationRecord {
  const reasons: DependencyRiskCertificationReasonCode[] = [];
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
  const lineageCertified = validateLineage(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyRiskCertificationEvidencePath(input);
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
  addReason(reasons, "DEPENDENCY_RISK_CERTIFICATION_IS_NOT_CONTROL");

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
    || boundary.invalidBoundary
    || !limitsValid
    || reasons.includes("REPLAY_CORRUPTION_DETECTED")
    || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED");
  const conditional = !fail && (
    replayCertification.degraded
    || observabilityCertification.incomplete
  );
  const certificationState = fail ? "FAIL" : conditional ? "CONDITIONAL_PASS" : "PASS";

  const certificationHash = hashCertificationValue("dependency-risk-certification-gate", {
    request: requestCore(input.request),
    certificationState,
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

  const result = buildResult(
    input.request,
    certificationState,
    integrityCertified,
    severityCertified,
    propagationCertified,
    replayCertification.certified,
    governanceCertified,
    observabilityCertification.certified,
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
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
