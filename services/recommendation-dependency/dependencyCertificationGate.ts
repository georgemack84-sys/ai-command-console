import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyCertificationEvidencePath,
  DependencyCertificationInput,
  DependencyCertificationObservability,
  DependencyCertificationReasonCode,
  DependencyCertificationRequest,
  DependencyCertificationResult,
  DependencyCertificationScope,
  DependencyCertificationValidation,
  SealedDependencyCertificationRecord,
} from "./types";

const MAX_DEPENDENCIES = 50_000;
const MAX_DEPENDENCY_CHAINS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_CONFLICT_REFERENCES = 10_000;

const CERTIFICATION_SCOPES: readonly DependencyCertificationScope[] = Object.freeze([
  "INTEGRITY",
  "CONTINUITY",
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

function addReason(reasons: DependencyCertificationReasonCode[], reason: DependencyCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyCertificationRequest): DependencyCertificationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DependencyCertificationInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "recommendationRankingAllowed",
    "recommendationPrioritizationAllowed",
    "recommendationApprovalAllowed",
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
    ...bundle.readiness.evidencePath.replayReferences,
    ...bundle.reviewPacket.evidencePath.replayReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readinessCertification.evidencePath.replayReferences,
  ]);
}

function collectEvidenceHashes(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    bundle.ledger.result.ledgerHash,
    bundle.lineage.result.reconstructionHash,
    bundle.lineage.result.lineageHash,
    bundle.verification.result.verificationHash,
    bundle.replay.result.replayHash,
    bundle.replay.result.reconstructionHash,
    bundle.integrity.result.integrityHash,
    bundle.certification.result.certificationHash,
    bundle.observability.result.observabilityHash,
    bundle.inspection.result.inspectionHash,
    bundle.visibility.result.visibilityHash,
    bundle.audit.result.exportHash,
    bundle.observabilityCertification.result.certificationHash,
    bundle.binding.result.governanceHash,
    bundle.authorityScope.result.authorityHash,
    bundle.policyVisibility.result.policyHash,
    bundle.governanceReplay.result.replayHash,
    bundle.governanceReplay.result.reconstructionHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.governanceReferences.governanceHash,
    bundle.ownershipEvidence.ownershipHash,
    bundle.replayEvidence.replayHash,
    bundle.readiness.result.readinessHash,
    bundle.alignment.result.alignmentHash,
    bundle.reviewPacket.result.packetHash,
    bundle.replayFramework.result.replayHash,
    bundle.replayFramework.result.reconstructionHash,
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

function validateTenantId(request: DependencyCertificationRequest, reasons: DependencyCertificationReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DependencyCertificationScope, reasons: DependencyCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const valid = input.foundation.sealed === true
    && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const valid = input.analysis.sealed === true
    && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const valid = input.observability.sealed === true
    && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateReplay(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const valid = input.replay.sealed === true
    && input.replay.result.tenantId === input.request.tenantId;
  addReason(reasons, input.replay.sealed === true ? "REPLAY_REQUIRED" : "REPLAY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.replay.sealed === true
    && input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
    && input.portfolioObservability.sealed === true
    && input.portfolioReplay.sealed === true
    && input.certification.sealed === true
    && orderedBundles(input).every((bundle) => {
      const records = [
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
      ] satisfies readonly Record<string, unknown>[];
      return records.every((record) => record.sealed === true);
    });
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.portfolioObservability.result.tenantIsolationVerified
    && input.portfolioReplay.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CERTIFICATION_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateIntegrity(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const certified = input.foundation.result.dependencyState !== "INVALID"
    && input.analysis.result.analysisState !== "INVALID"
    && input.foundation.dependencies.length > 0
    && input.foundation.evidencePath.dependencyReferences.length === input.foundation.dependencies.length
    && input.analysis.evidencePath.dependencyReferences.length === input.foundation.evidencePath.dependencyReferences.length;
  addReason(reasons, certified ? "INTEGRITY_CERTIFIED" : "INTEGRITY_BROKEN");
  return certified;
}

function validateContinuity(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const certified = input.analysis.result.dependencyContinuityVerified
    && input.replay.result.replayState !== "ESCALATED"
    && input.replay.result.replayState !== "INVALID"
    && orderedBundles(input).every((bundle) => lineageIntegrity(bundle));
  addReason(reasons, certified ? "CONTINUITY_CERTIFIED" : "CONTINUITY_BROKEN");
  return certified;
}

function validateReplayCertification(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): { certified: boolean; degraded: boolean } {
  const fail = input.replay.result.replayState === "INVALID"
    || input.replay.result.replayState === "ESCALATED";
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

function validateGovernance(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const certified = input.foundation.validation.governanceDependenciesValid
    && input.certification.result.governanceCertified
    && orderedBundles(input).every((bundle) => governanceIntegrity(bundle));
  addReason(reasons, certified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return certified;
}

function validateObservabilityCertification(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): { certified: boolean; incomplete: boolean } {
  const incomplete = input.observability.result.observabilityState === "OBSERVE"
    || input.observability.result.observabilityState === "LIMITED"
    || !input.observability.result.dependencyGraphVisible
    || !input.observability.result.dependencyChainsVisible
    || !input.observability.result.dependencyLineageVisible
    || !input.observability.result.dependencyReplayVisible
    || !input.observability.result.dependencyConflictsVisible
    || !input.observability.result.dependencyAuditVisible;
  const certified = !incomplete && input.observability.result.observabilityState === "VISIBLE";
  addReason(reasons, certified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_INCOMPLETE");
  return { certified, incomplete };
}

function validateLineage(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const certified = input.foundation.evidencePath.lineageReferences.length > 0
    && input.replay.result.replayState !== "ESCALATED"
    && orderedBundles(input).every((bundle) => (
      lineageIntegrity(bundle)
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, certified ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return certified;
}

function validateConflictVisibility(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): boolean {
  const certified = input.analysis.result.dependencyConflictsDetected === input.analysis.evidencePath.conflictReferences.length
    && input.observability.result.dependencyConflictsVisible;
  addReason(reasons, certified ? "CONFLICT_VISIBILITY_CERTIFIED" : "CONFLICT_VISIBILITY_MISSING");
  return certified;
}

function validateBoundary(input: DependencyCertificationInput, reasons: DependencyCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = orderedBundles(input).every((bundle) => {
    const records = [
      input.foundation,
      input.analysis,
      input.observability,
      input.replay,
      input.portfolio,
      input.relationshipAnalysis,
      input.portfolioObservability,
      input.portfolioReplay,
      input.certification,
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
    ] satisfies readonly Record<string, unknown>[];
    return records.every(createBoundaryFlags);
  });
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RECOMMENDATION_RANKING_DETECTED" : "RECOMMENDATION_RANKING_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  const invalidBoundary = !executionImpossible
    || input.workflowRoutingRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.recommendationApprovalRequested === true
    || !authorityBounded
    || input.certificationMutationAttempted === true
    || !controlSurfaceAbsent;
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary,
    controlSurfaceAbsent,
  });
}

export function createDependencyCertificationEvidencePath(input: DependencyCertificationInput): DependencyCertificationEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.certificationScope,
    dependencyReferences: normalizeStrings([
      ...input.foundation.evidencePath.dependencyReferences,
      ...input.analysis.evidencePath.dependencyReferences,
      ...input.observability.evidencePath.dependencyReferences,
      ...input.replay.evidencePath.dependencyReferences,
    ]),
    chainReferences: normalizeStrings([
      ...input.analysis.evidencePath.chainReferences,
      ...input.replay.evidencePath.chainReferences,
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
    conflictReferences: normalizeStrings([
      ...input.analysis.evidencePath.conflictReferences,
      ...input.replay.evidencePath.conflictReferences,
    ]),
    governanceReferences: normalizeStrings([
      ...input.foundation.evidencePath.governanceReferences,
      ...input.observability.evidencePath.governanceReferences,
      ...input.replay.evidencePath.governanceReferences,
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.dependencyGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.replay.result.reconstructionHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioObservability.result.observabilityHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioReplay.result.reconstructionHash,
      input.certification.result.certificationHash,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  dependencyCount: number,
  chainCount: number,
  replayReferenceCount: number,
  conflictReferenceCount: number,
  reasons: DependencyCertificationReasonCode[],
): boolean {
  const valid = dependencyCount <= MAX_DEPENDENCIES
    && chainCount <= MAX_DEPENDENCY_CHAINS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && conflictReferenceCount <= MAX_CONFLICT_REFERENCES;
  addReason(reasons, dependencyCount <= MAX_DEPENDENCIES ? "DEPENDENCY_LIMIT_VALID" : "DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, chainCount <= MAX_DEPENDENCY_CHAINS ? "CHAIN_LIMIT_VALID" : "CHAIN_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, conflictReferenceCount <= MAX_CONFLICT_REFERENCES ? "CONFLICT_REFERENCE_LIMIT_VALID" : "CONFLICT_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyCertificationRequest,
  certificationState: DependencyCertificationResult["certificationState"],
  integrityCertified: boolean,
  continuityCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  tenantIsolationVerified: boolean,
  certificationHash: string,
): DependencyCertificationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    certificationState,
    integrityCertified,
    continuityCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyCertificationResult): DependencyCertificationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    certificationState: result.certificationState,
    integrityCertified: result.integrityCertified,
    continuityCertified: result.continuityCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    observabilityCertified: result.observabilityCertified,
    certificationHash: result.certificationHash,
  });
}

function buildValidation(
  certificationState: DependencyCertificationResult["certificationState"],
  reasonCodes: readonly DependencyCertificationReasonCode[],
  integrityCertified: boolean,
  continuityCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  lineageCertified: boolean,
  conflictVisibilityCertified: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    chainCount: number;
    replayReferenceCount: number;
    conflictReferenceCount: number;
  }>,
): DependencyCertificationValidation {
  return Object.freeze({
    valid: certificationState !== "FAIL",
    certificationState,
    reasonCodes: [...reasonCodes],
    integrityCertified,
    continuityCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    lineageCertified,
    conflictVisibilityCertified,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    chainCount: counts.chainCount,
    replayReferenceCount: counts.replayReferenceCount,
    conflictReferenceCount: counts.conflictReferenceCount,
  });
}

export function buildDependencyCertificationRequest(request: DependencyCertificationRequest): DependencyCertificationRequest {
  return requestCore(request);
}

export function sealDependencyCertification(input: DependencyCertificationInput): SealedDependencyCertificationRecord {
  const reasons: DependencyCertificationReasonCode[] = [];
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
  const continuityCertified = validateContinuity(input, reasons);
  const replayCertification = validateReplayCertification(input, reasons);
  const governanceCertified = validateGovernance(input, reasons);
  const observabilityCertification = validateObservabilityCertification(input, reasons);
  const lineageCertified = validateLineage(input, reasons);
  const conflictVisibilityCertified = validateConflictVisibility(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyCertificationEvidencePath(input);
  const counts = Object.freeze({
    chainCount: evidencePath.chainReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    conflictReferenceCount: evidencePath.conflictReferences.length,
  });
  const limitsValid = validateLimits(
    input.foundation.dependencies.length,
    counts.chainCount,
    counts.replayReferenceCount,
    counts.conflictReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_CERTIFICATION_IS_NOT_CONTROL");

  const fail = !requestValid
    || !foundationValid
    || !analysisValid
    || !observabilityValid
    || !replayValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !integrityCertified
    || !continuityCertified
    || !governanceCertified
    || !lineageCertified
    || boundary.invalidBoundary
    || !limitsValid
    || reasons.includes("REPLAY_CORRUPTION_DETECTED");

  const conditional = !fail && (
    replayCertification.degraded
    || observabilityCertification.incomplete
    || !conflictVisibilityCertified
  );

  const certificationState = fail ? "FAIL" : conditional ? "CONDITIONAL_PASS" : "PASS";

  const certificationHash = hashCertificationValue("dependency-certification-gate", {
    request: requestCore(input.request),
    dependencyGraphHash: input.foundation.result.dependencyGraphHash,
    analysisHash: input.analysis.result.analysisHash,
    observabilityHash: input.observability.result.observabilityHash,
    replayHash: input.replay.result.replayHash,
    reconstructionHash: input.replay.result.reconstructionHash,
    certificationState,
    dependencyReferences: evidencePath.dependencyReferences,
    chainReferences: evidencePath.chainReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    conflictReferences: evidencePath.conflictReferences,
    governanceReferences: evidencePath.governanceReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    certificationState,
    integrityCertified,
    continuityCertified,
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
    integrityCertified,
    continuityCertified,
    replayCertification.certified,
    governanceCertified,
    observabilityCertification.certified,
    lineageCertified,
    conflictVisibilityCertified,
    tenantIsolationVerified,
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
    recommendationRankingAllowed: false,
    recommendationPrioritizationAllowed: false,
    recommendationApprovalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
