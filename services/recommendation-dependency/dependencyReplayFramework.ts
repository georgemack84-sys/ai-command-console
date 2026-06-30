import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyReplayEvidencePath,
  DependencyReplayInput,
  DependencyReplayObservability,
  DependencyReplayReasonCode,
  DependencyReplayRequest,
  DependencyReplayResult,
  DependencyReplayScope,
  DependencyReplayValidation,
  SealedDependencyReplayRecord,
} from "./types";

const MAX_DEPENDENCIES = 50_000;
const MAX_DEPENDENCY_CHAINS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;

const REPLAY_SCOPES: readonly DependencyReplayScope[] = Object.freeze([
  "GRAPH",
  "CHAINS",
  "EVIDENCE",
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

function addReason(reasons: DependencyReplayReasonCode[], reason: DependencyReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyReplayRequest): DependencyReplayRequest {
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

function orderedBundles(input: DependencyReplayInput): RecommendationPortfolioBundle[] {
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
    bundle.audit.result.exportHash,
    bundle.observabilityCertification.result.certificationHash,
    bundle.visibility.result.visibilityHash,
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

function validateTenantId(request: DependencyReplayRequest, reasons: DependencyReplayReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DependencyReplayScope, reasons: DependencyReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const valid = input.foundation.sealed === true
    && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const valid = input.analysis.sealed === true
    && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const valid = input.observability.sealed === true
    && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
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

function validateTenantScope(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_REPLAY_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGraph(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const reconstructed = input.foundation.dependencies.length > 0
    && input.foundation.evidencePath.dependencyReferences.length === input.foundation.dependencies.length
    && input.analysis.evidencePath.dependencyReferences.length === input.foundation.evidencePath.dependencyReferences.length;
  addReason(reasons, reconstructed ? "GRAPH_RECONSTRUCTED" : "GRAPH_EVIDENCE_MISSING");
  return reconstructed;
}

function validateChains(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.result.dependencyChainsDetected >= 0
    && input.analysis.evidencePath.chainReferences.length === input.analysis.result.dependencyChainsDetected;
  addReason(reasons, reconstructed ? "CHAINS_RECONSTRUCTED" : "CHAIN_EVIDENCE_MISSING");
  return reconstructed;
}

function validateEvidence(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): { reconstructed: boolean; degraded: boolean } {
  const missing = input.foundation.evidencePath.replayReferences.length === 0
    || orderedBundles(input).some((bundle) => (
      bundle.replayEvidence.replayReferences.length === 0
      || collectReplayReferences(bundle).length === 0
    ));
  const reconstructed = !missing
    && orderedBundles(input).every((bundle) => collectEvidenceHashes(bundle).every((hash) => hash.length === 64));
  addReason(reasons, reconstructed ? "EVIDENCE_RECONSTRUCTED" : "REPLAY_ARTIFACTS_MISSING");
  return { reconstructed, degraded: missing };
}

function validateGovernance(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): { reconstructed: boolean; escalated: boolean } {
  const corrupted = input.foundation.validation.governanceDependenciesValid === false
    || input.certification.result.governanceCertified === false
    || orderedBundles(input).some((bundle) => !governanceIntegrity(bundle));
  const reconstructed = !corrupted && orderedBundles(input).every((bundle) => (
    bundle.governanceReferences.governanceReferences.length > 0
    && bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeValidated
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
  ));
  addReason(reasons, reconstructed ? "GOVERNANCE_RECONSTRUCTED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return { reconstructed, escalated: corrupted };
}

function validateReplayHashes(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): { verified: boolean; mismatched: boolean } {
  const replayHashes = normalizeStrings([
    input.portfolioReplay.result.replayHash,
    ...orderedBundles(input).map((bundle) => bundle.replay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.governanceReplay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.replayFramework.result.replayHash),
  ]);
  const verified = replayHashes.every((hash) => hash.length === 64)
    && input.analysis.result.analysisHash.length === 64
    && input.observability.result.observabilityHash.length === 64;
  const mismatched = input.portfolioReplay.result.replayState === "INVALID"
    || orderedBundles(input).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
    ));
  addReason(reasons, verified && !mismatched ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return { verified, mismatched };
}

function validateLineageContinuity(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const preserved = input.foundation.evidencePath.lineageReferences.length > 0
    && orderedBundles(input).every((bundle) => (
      lineageIntegrity(bundle)
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, preserved ? "LINEAGE_CONTINUITY_PRESERVED" : "LINEAGE_CONTINUITY_BROKEN");
  return preserved;
}

function validateObservabilityReconstruction(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): boolean {
  const reconstructed = input.observability.result.dependencyGraphVisible
    && input.observability.result.dependencyChainsVisible
    && input.observability.result.dependencyLineageVisible
    && input.observability.result.dependencyConflictsVisible
    && input.observability.result.dependencyAuditVisible;
  addReason(reasons, reconstructed ? "OBSERVABILITY_RECONSTRUCTED" : "OBSERVABILITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateBoundary(input: DependencyReplayInput, reasons: DependencyReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = orderedBundles(input).every((bundle) => {
    const records = [
      input.foundation,
      input.analysis,
      input.observability,
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
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  const invalidBoundary = !executionImpossible
    || input.workflowRoutingRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.recommendationApprovalRequested === true
    || !authorityBounded
    || input.replayMutationAttempted === true
    || !controlSurfaceAbsent;
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary,
    controlSurfaceAbsent,
  });
}

export function createDependencyReplayEvidencePath(input: DependencyReplayInput): DependencyReplayEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.replayScope,
    dependencyReferences: normalizeStrings([
      ...input.foundation.evidencePath.dependencyReferences,
      ...input.analysis.evidencePath.dependencyReferences,
      ...input.observability.evidencePath.dependencyReferences,
    ]),
    chainReferences: normalizeStrings(input.analysis.evidencePath.chainReferences),
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
    conflictReferences: normalizeStrings(input.analysis.evidencePath.conflictReferences),
    observabilityReferences: normalizeStrings([
      input.observability.result.observabilityHash,
      ...input.observability.evidencePath.auditReferences,
      ...bundles.flatMap(collectObservabilityReferences),
    ]),
    evidenceHashes: normalizeStrings([
      input.foundation.result.dependencyGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioObservability.result.observabilityHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioReplay.result.reconstructionHash,
      input.certification.result.certificationHash,
      ...bundles.flatMap(collectEvidenceHashes),
      ...input.foundation.dependencies.map((dependency) => dependency.dependencyHash),
    ]),
  });
}

function validateLimits(
  dependencyCount: number,
  chainCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  reasons: DependencyReplayReasonCode[],
): boolean {
  const valid = dependencyCount <= MAX_DEPENDENCIES
    && chainCount <= MAX_DEPENDENCY_CHAINS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, dependencyCount <= MAX_DEPENDENCIES ? "DEPENDENCY_LIMIT_VALID" : "DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, chainCount <= MAX_DEPENDENCY_CHAINS ? "CHAIN_LIMIT_VALID" : "CHAIN_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyReplayRequest,
  replayState: DependencyReplayResult["replayState"],
  graphReconstructed: boolean,
  chainsReconstructed: boolean,
  evidenceReconstructed: boolean,
  governanceReconstructed: boolean,
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): DependencyReplayResult {
  return Object.freeze({
    tenantId: request.tenantId,
    replayState,
    graphReconstructed,
    chainsReconstructed,
    evidenceReconstructed,
    governanceReconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyReplayResult): DependencyReplayObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    replayState: result.replayState,
    graphReconstructed: result.graphReconstructed,
    chainsReconstructed: result.chainsReconstructed,
    evidenceReconstructed: result.evidenceReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  replayState: DependencyReplayResult["replayState"],
  reasonCodes: readonly DependencyReplayReasonCode[],
  graphReconstructed: boolean,
  chainsReconstructed: boolean,
  evidenceReconstructed: boolean,
  governanceReconstructed: boolean,
  observabilityReconstructed: boolean,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    chainCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
  }>,
): DependencyReplayValidation {
  return Object.freeze({
    valid: replayState !== "INVALID",
    replayState,
    reasonCodes: [...reasonCodes],
    graphReconstructed,
    chainsReconstructed,
    evidenceReconstructed,
    governanceReconstructed,
    observabilityReconstructed,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    chainCount: counts.chainCount,
    replayReferenceCount: counts.replayReferenceCount,
    lineageReferenceCount: counts.lineageReferenceCount,
  });
}

export function buildDependencyReplayRequest(request: DependencyReplayRequest): DependencyReplayRequest {
  return requestCore(request);
}

export function sealDependencyReplay(input: DependencyReplayInput): SealedDependencyReplayRecord {
  const reasons: DependencyReplayReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.replayScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const observabilityValid = validateObservability(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const graphReconstructed = validateGraph(input, reasons);
  const chainsReconstructed = validateChains(input, reasons);
  const evidenceValidation = validateEvidence(input, reasons);
  const governanceValidation = validateGovernance(input, reasons);
  const replayHashValidation = validateReplayHashes(input, reasons);
  const lineageContinuityPreserved = validateLineageContinuity(input, reasons);
  const observabilityReconstructed = validateObservabilityReconstruction(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyReplayEvidencePath(input);
  const counts = Object.freeze({
    chainCount: evidencePath.chainReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
  });
  const limitsValid = validateLimits(
    input.foundation.dependencies.length,
    counts.chainCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_REPLAY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !analysisValid
    || !observabilityValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || governanceValidation.escalated
    || boundary.invalidBoundary
    || !limitsValid;

  const escalated = !invalid && (
    !lineageContinuityPreserved
    || replayHashValidation.mismatched
    || !observabilityReconstructed
  );

  const limited = !invalid && !escalated && (
    !graphReconstructed
    || !chainsReconstructed
    || !evidenceValidation.reconstructed
    || evidenceValidation.degraded
  );

  const replayState = invalid ? "INVALID" : escalated ? "ESCALATED" : limited ? "LIMITED" : "REPLAYABLE";

  const replayHash = hashReplayValue("dependency-replay-framework", {
    request: requestCore(input.request),
    dependencyGraphHash: input.foundation.result.dependencyGraphHash,
    analysisHash: input.analysis.result.analysisHash,
    observabilityHash: input.observability.result.observabilityHash,
    replayState,
    dependencyReferences: evidencePath.dependencyReferences,
    chainReferences: evidencePath.chainReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    conflictReferences: evidencePath.conflictReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const reconstructionHash = hashReplayValue("dependency-replay-reconstruction", {
    graphReconstructed,
    chainsReconstructed,
    evidenceReconstructed: evidenceValidation.reconstructed,
    governanceReconstructed: governanceValidation.reconstructed,
    observabilityReconstructed,
    lineageContinuityPreserved,
    replayHashVerified: replayHashValidation.verified,
    counts,
  });

  const result = buildResult(
    input.request,
    replayState,
    graphReconstructed,
    chainsReconstructed,
    evidenceValidation.reconstructed,
    governanceValidation.reconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    replayState,
    reasons,
    graphReconstructed,
    chainsReconstructed,
    evidenceValidation.reconstructed,
    governanceValidation.reconstructed,
    observabilityReconstructed,
    ownershipValid,
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
    replayOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    recommendationRankingAllowed: false,
    recommendationPrioritizationAllowed: false,
    recommendationApprovalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
