import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ImpactReplayEvidencePath,
  ImpactReplayInput,
  ImpactReplayObservability,
  ImpactReplayReasonCode,
  ImpactReplayRequest,
  ImpactReplayResult,
  ImpactReplayScope,
  ImpactReplayValidation,
  SealedImpactReplayRecord,
} from "./types";

const MAX_IMPACTS = 50_000;
const MAX_IMPACT_CHAINS = 25_000;
const MAX_PROPAGATION_PATHS = 25_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;

const REPLAY_SCOPES: readonly ImpactReplayScope[] = Object.freeze([
  "GRAPH",
  "CHAINS",
  "EVIDENCE",
  "PROPAGATION",
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

function addReason(reasons: ImpactReplayReasonCode[], reason: ImpactReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ImpactReplayRequest): ImpactReplayRequest {
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

function orderedBundles(input: ImpactReplayInput): RecommendationPortfolioBundle[] {
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

function validateTenantId(request: ImpactReplayRequest, reasons: ImpactReplayReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: ImpactReplayScope, reasons: ImpactReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateObservabilityInputRecord(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const valid = input.observability.sealed === true && input.observability.result.tenantId === input.request.tenantId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.observability.sealed === true
    && input.dependencyFoundation.sealed === true
    && input.dependencyAnalysis.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
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

function validateTenantScope(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyAnalysis.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
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

function validateOwnership(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGraph(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const reconstructed = input.foundation.impacts.length > 0
    && input.foundation.evidencePath.impactReferences.length === input.foundation.impacts.length
    && input.analysis.evidencePath.impactReferences.length === input.foundation.evidencePath.impactReferences.length
    && input.observability.evidencePath.impactReferences.length === input.foundation.evidencePath.impactReferences.length;
  addReason(reasons, reconstructed ? "GRAPH_RECONSTRUCTED" : "GRAPH_EVIDENCE_MISSING");
  return reconstructed;
}

function validateChains(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.result.impactChainsDetected >= 0
    && input.analysis.evidencePath.chainReferences.length === input.analysis.result.impactChainsDetected
    && input.observability.evidencePath.chainReferences.length === input.analysis.evidencePath.chainReferences.length;
  addReason(reasons, reconstructed ? "CHAINS_RECONSTRUCTED" : "CHAIN_EVIDENCE_MISSING");
  return reconstructed;
}

function validateEvidence(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): { reconstructed: boolean; degraded: boolean } {
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

function validatePropagation(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): { reconstructed: boolean; escalated: boolean } {
  const mismatch = input.analysis.evidencePath.propagationReferences.length !== input.analysis.result.propagationPathsDetected
    || input.observability.evidencePath.propagationReferences.length !== input.analysis.evidencePath.propagationReferences.length;
  const reconstructed = !mismatch && input.analysis.result.propagationPathsDetected >= 0;
  addReason(reasons, reconstructed ? "PROPAGATION_RECONSTRUCTED" : "PROPAGATION_MISMATCH_DETECTED");
  return { reconstructed, escalated: mismatch };
}

function validateGovernance(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): { reconstructed: boolean; escalated: boolean } {
  const corrupted = orderedBundles(input).some((bundle) => !governanceIntegrity(bundle));
  const reconstructed = !corrupted && orderedBundles(input).every((bundle) => (
    bundle.governanceReferences.governanceReferences.length > 0
    && bundle.binding.result.bindingState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
  ));
  addReason(reasons, reconstructed ? "GOVERNANCE_RECONSTRUCTED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return { reconstructed, escalated: corrupted };
}

function validateReplayHashes(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): { verified: boolean; mismatched: boolean } {
  const replayHashes = normalizeStrings([
    input.dependencyReplay.result.replayHash,
    input.portfolioReplay.result.replayHash,
    ...orderedBundles(input).map((bundle) => bundle.replay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.governanceReplay.result.replayHash),
    ...orderedBundles(input).map((bundle) => bundle.replayFramework.result.replayHash),
  ]);
  const verified = replayHashes.every((hash) => hash.length === 64)
    && input.analysis.result.analysisHash.length === 64
    && input.observability.result.observabilityHash.length === 64;
  const mismatched = input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || input.portfolioReplay.result.replayState === "INVALID"
    || input.portfolioReplay.result.replayState === "ESCALATED"
    || orderedBundles(input).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
    ));
  addReason(reasons, verified && !mismatched ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return { verified, mismatched };
}

function validateLineageContinuity(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): { preserved: boolean; broken: boolean } {
  const broken = orderedBundles(input).some((bundle) => !lineageIntegrity(bundle))
    || input.observability.evidencePath.lineageReferences.length === 0;
  addReason(reasons, broken ? "LINEAGE_CONTINUITY_BROKEN" : "LINEAGE_CONTINUITY_PRESERVED");
  return { preserved: !broken, broken };
}

function validateObservabilityReconstruction(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const reconstructed = input.observability.result.impactGraphVisible
    && input.observability.result.impactChainsVisible
    && input.observability.result.impactPropagationVisible
    && input.observability.result.impactLineageVisible
    && input.observability.result.impactAuditVisible
    && input.observability.evidencePath.auditReferences.length > 0;
  addReason(reasons, reconstructed ? "OBSERVABILITY_RECONSTRUCTED" : "OBSERVABILITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateConflicts(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): boolean {
  const reconstructed = input.analysis.evidencePath.conflictReferences.length === input.analysis.result.impactConflictsDetected
    && input.observability.evidencePath.conflictReferences.length === input.analysis.evidencePath.conflictReferences.length;
  addReason(reasons, reconstructed ? "CONFLICTS_RECONSTRUCTED" : "CONFLICT_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateBoundary(input: ImpactReplayInput, reasons: ImpactReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.observability.controlSurfacePresent
    && !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyAnalysis.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.portfolio.controlSurfacePresent
    && !input.relationshipAnalysis.controlSurfacePresent
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
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_BLOCKED");
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
      || input.approvalRequested === true
      || !authorityBounded
      || input.replayMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createImpactReplayEvidencePath(input: ImpactReplayInput): ImpactReplayEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.replayScope,
    impactReferences: normalizeStrings(input.foundation.evidencePath.impactReferences),
    chainReferences: normalizeStrings(input.analysis.evidencePath.chainReferences),
    propagationReferences: normalizeStrings(input.analysis.evidencePath.propagationReferences),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    governanceReferences: normalizeStrings(bundles.flatMap(collectGovernanceReferences)),
    conflictReferences: normalizeStrings(input.analysis.evidencePath.conflictReferences),
    observabilityReferences: normalizeStrings(bundles.flatMap(collectObservabilityReferences)),
    evidenceHashes: normalizeStrings([
      input.foundation.result.impactGraphHash,
      input.analysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyAnalysis.result.analysisHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...bundles.flatMap(collectEvidenceHashes),
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...input.observability.evidencePath.evidenceHashes,
    ]),
  });
}

function validateLimits(
  impactCount: number,
  chainCount: number,
  propagationCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  reasons: ImpactReplayReasonCode[],
): boolean {
  const valid = impactCount <= MAX_IMPACTS
    && chainCount <= MAX_IMPACT_CHAINS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, impactCount <= MAX_IMPACTS ? "IMPACT_LIMIT_VALID" : "IMPACT_LIMIT_EXCEEDED");
  addReason(reasons, chainCount <= MAX_IMPACT_CHAINS ? "CHAIN_LIMIT_VALID" : "CHAIN_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ImpactReplayRequest,
  replayState: ImpactReplayResult["replayState"],
  graphReconstructed: boolean,
  chainsReconstructed: boolean,
  evidenceReconstructed: boolean,
  propagationReconstructed: boolean,
  governanceReconstructed: boolean,
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): ImpactReplayResult {
  return Object.freeze({
    tenantId: request.tenantId,
    replayState,
    graphReconstructed,
    chainsReconstructed,
    evidenceReconstructed,
    propagationReconstructed,
    governanceReconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

function buildObservability(result: ImpactReplayResult): ImpactReplayObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    replayState: result.replayState,
    graphReconstructed: result.graphReconstructed,
    chainsReconstructed: result.chainsReconstructed,
    evidenceReconstructed: result.evidenceReconstructed,
    propagationReconstructed: result.propagationReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  replayState: ImpactReplayResult["replayState"],
  reasonCodes: readonly ImpactReplayReasonCode[],
  flags: Readonly<{
    graphReconstructed: boolean;
    chainsReconstructed: boolean;
    evidenceReconstructed: boolean;
    propagationReconstructed: boolean;
    governanceReconstructed: boolean;
    observabilityReconstructed: boolean;
    conflictsReconstructed: boolean;
    ownershipValid: boolean;
    tenantIsolationVerified: boolean;
  }>,
  boundary: BoundaryValidation,
  counts: Readonly<{
    chainCount: number;
    propagationCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
  }>,
): ImpactReplayValidation {
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

export function buildImpactReplayRequest(request: ImpactReplayRequest): ImpactReplayRequest {
  return requestCore(request);
}

export function sealImpactReplay(input: ImpactReplayInput): SealedImpactReplayRecord {
  const reasons: ImpactReplayReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.replayScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const observabilityValid = validateObservabilityInputRecord(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const graphReconstructed = validateGraph(input, reasons);
  const chainsReconstructed = validateChains(input, reasons);
  const evidenceValidation = validateEvidence(input, reasons);
  const propagationValidation = validatePropagation(input, reasons);
  const governanceValidation = validateGovernance(input, reasons);
  const replayHashValidation = validateReplayHashes(input, reasons);
  const lineageValidation = validateLineageContinuity(input, reasons);
  const observabilityReconstructed = validateObservabilityReconstruction(input, reasons);
  const conflictsReconstructed = validateConflicts(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createImpactReplayEvidencePath(input);
  const counts = Object.freeze({
    chainCount: evidencePath.chainReferences.length,
    propagationCount: evidencePath.propagationReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.impactReferences.length,
    counts.chainCount,
    counts.propagationCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    reasons,
  );
  addReason(reasons, "IMPACT_REPLAY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !analysisValid
    || !observabilityValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || governanceValidation.escalated === true;
  const escalated = !invalid && (
    replayHashValidation.mismatched
    || lineageValidation.broken
    || propagationValidation.escalated
    || !conflictsReconstructed
    || !observabilityReconstructed
  );
  const limited = !invalid && !escalated && (
    !graphReconstructed
    || !chainsReconstructed
    || !evidenceValidation.reconstructed
    || !propagationValidation.reconstructed
    || evidenceValidation.degraded
    || !limitsValid
  );
  const replayState = invalid ? "INVALID" : escalated ? "ESCALATED" : limited ? "LIMITED" : "REPLAYABLE";

  const replayHash = hashReplayValue("impact-replay-framework", {
    request: requestCore(input.request),
    replayState,
    impactReferences: evidencePath.impactReferences,
    chainReferences: evidencePath.chainReferences,
    propagationReferences: evidencePath.propagationReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    conflictReferences: evidencePath.conflictReferences,
    observabilityReferences: evidencePath.observabilityReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });
  const reconstructionHash = hashReplayValue("impact-replay-reconstruction", {
    replayHash,
    graphReconstructed,
    chainsReconstructed,
    evidenceReconstructed: evidenceValidation.reconstructed,
    propagationReconstructed: propagationValidation.reconstructed,
    governanceReconstructed: governanceValidation.reconstructed,
  });

  const result = buildResult(
    input.request,
    replayState,
    graphReconstructed,
    chainsReconstructed,
    evidenceValidation.reconstructed,
    propagationValidation.reconstructed,
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
      graphReconstructed,
      chainsReconstructed,
      evidenceReconstructed: evidenceValidation.reconstructed,
      propagationReconstructed: propagationValidation.reconstructed,
      governanceReconstructed: governanceValidation.reconstructed,
      observabilityReconstructed,
      conflictsReconstructed,
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
    approvalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
