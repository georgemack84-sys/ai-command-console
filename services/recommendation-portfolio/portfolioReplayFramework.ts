import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  PortfolioReplayEvidencePath,
  PortfolioReplayInput,
  PortfolioReplayObservability,
  PortfolioReplayReasonCode,
  PortfolioReplayRequest,
  PortfolioReplayResult,
  PortfolioReplayScope,
  PortfolioReplayValidation,
  RecommendationPortfolioBundle,
  SealedPortfolioReplayRecord,
} from "./types";

const MAX_PORTFOLIO_SIZE = 10_000;
const MAX_RELATIONSHIPS = 50_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;

const REPLAY_SCOPES: readonly PortfolioReplayScope[] = Object.freeze([
  "COMPOSITION",
  "RELATIONSHIPS",
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

function addReason(reasons: PortfolioReplayReasonCode[], reason: PortfolioReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: PortfolioReplayRequest): PortfolioReplayRequest {
  return Object.freeze({
    portfolioId: request.portfolioId,
    tenantId: request.tenantId,
    replayScope: request.replayScope,
    replayVersion: request.replayVersion,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: PortfolioReplayInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
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

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "recommendationGenerationAllowed",
    "recommendationRankingAllowed",
    "recommendationPrioritizationAllowed",
    "recommendationScoringAllowed",
    "recommendationApprovalAllowed",
    "prioritizationAllowed",
    "approvalBehaviorAllowed",
    "policyExecutionAllowed",
    "approvalCreationAllowed",
    "authorityMutationAllowed",
    "repairAuthorized",
    "ledgerMutationAllowed",
    "controlSurfacePresent",
  ] as const;
  return blockedFlags.every((key) => record[key] !== true);
}

function validatePortfolio(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const valid = input.portfolio.sealed === true
    && input.portfolio.result.portfolioId === input.request.portfolioId
    && input.portfolio.portfolio.tenantId === input.request.tenantId;
  addReason(reasons, input.portfolio.sealed === true ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  return valid;
}

function validateRelationshipAnalysis(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const valid = input.relationshipAnalysis.sealed === true
    && input.relationshipAnalysis.result.portfolioId === input.request.portfolioId;
  addReason(reasons, input.relationshipAnalysis.sealed === true ? "RELATIONSHIP_ANALYSIS_REQUIRED" : "RELATIONSHIP_ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const valid = input.observability.sealed === true
    && input.observability.result.portfolioId === input.request.portfolioId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateScope(scope: PortfolioReplayScope, reasons: PortfolioReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validatePortfolioId(request: PortfolioReplayRequest, reasons: PortfolioReplayReasonCode[]): boolean {
  const valid = request.portfolioId.length > 0;
  addReason(reasons, valid ? "PORTFOLIO_ID_PRESENT" : "PORTFOLIO_ID_MISSING");
  return valid;
}

function validateSealedArtifacts(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const sealed = input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
    && input.observability.sealed === true
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

function validateTenantScope(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
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
      && bundle.inspection.result.tenantIsolationVerified
      && bundle.visibility.result.tenantIsolationVerified
      && bundle.audit.result.tenantIsolationVerified
      && bundle.governanceCertification.result.tenantIsolationVerified
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_REPLAY_BLOCKED");
  return valid;
}

function validateOwnership(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
    && bundle.ownershipEvidence.ownershipReferences.length > 0
    && bundle.certification.result.ownershipCertified
    && bundle.authorityScope.result.ownershipValidated
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateComposition(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const requested = normalizeStrings(input.portfolio.portfolio.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  const reconstructed = requested.length > 0
    && requested.length === actual.length
    && requested.every((value, index) => value === actual[index]);
  addReason(reasons, reconstructed ? "COMPOSITION_RECONSTRUCTED" : "COMPOSITION_EVIDENCE_MISSING");
  return reconstructed;
}

function validateRelationships(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const reconstructed = input.relationshipAnalysis.relationships.length > 0
    && input.relationshipAnalysis.evidencePath.relationshipReferences.length === input.relationshipAnalysis.relationships.length;
  addReason(reasons, reconstructed ? "RELATIONSHIPS_RECONSTRUCTED" : "RELATIONSHIP_EVIDENCE_MISSING");
  return reconstructed;
}

function validateEvidence(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): { reconstructed: boolean; degraded: boolean } {
  const missing = orderedBundles(input).some((bundle) => bundle.replayEvidence.replayReferences.length === 0);
  const reconstructed = !missing && orderedBundles(input).every((bundle) => collectEvidenceHashes(bundle).every((hash) => hash.length === 64));
  addReason(reasons, reconstructed ? "EVIDENCE_RECONSTRUCTED" : "REPLAY_ARTIFACTS_MISSING");
  return { reconstructed, degraded: missing };
}

function validateGovernance(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): { reconstructed: boolean; escalated: boolean } {
  const corrupted = orderedBundles(input).some((bundle) => (
    bundle.binding.result.bindingState === "INVALID"
    || bundle.authorityScope.result.scopeState === "INVALID"
    || bundle.policyVisibility.result.visibilityState === "INVALID"
    || bundle.governanceCertification.result.certificationState === "FAIL"
  ));
  const reconstructed = !corrupted && orderedBundles(input).every((bundle) => (
    bundle.governanceReferences.governanceReferences.length > 0
    && bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeValidated
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
  ));
  addReason(reasons, reconstructed ? "GOVERNANCE_RECONSTRUCTED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return { reconstructed, escalated: corrupted };
}

function validateReplayHashes(
  input: PortfolioReplayInput,
  reasons: PortfolioReplayReasonCode[],
): { verified: boolean; mismatched: boolean } {
  const replayHashes = normalizeStrings(orderedBundles(input).map((bundle) => bundle.replay.result.replayHash));
  const governanceReplayHashes = normalizeStrings(orderedBundles(input).map((bundle) => bundle.governanceReplay.result.replayHash));
  const verified = replayHashes.every((hash) => hash.length === 64)
    && governanceReplayHashes.every((hash) => hash.length === 64)
    && input.relationshipAnalysis.result.analysisHash.length === 64
    && input.observability.result.observabilityHash.length === 64;
  const mismatched = orderedBundles(input).some((bundle) => (
    bundle.replay.result.replayState === "INVALID"
    || bundle.governanceReplay.result.replayState === "INVALID"
    || bundle.replayFramework.result.replayState === "INVALID"
  ));
  addReason(reasons, verified && !mismatched ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return { verified, mismatched };
}

function validateLineageContinuity(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const preserved = orderedBundles(input).every((bundle) => (
    bundle.lineage.result.reconstructionState !== "INVALID"
    && bundle.lineage.result.lineageIntegrity
    && bundle.integrity.result.lineageIntegrity
    && collectLineageReferences(bundle).length > 0
  ));
  addReason(reasons, preserved ? "LINEAGE_CONTINUITY_PRESERVED" : "LINEAGE_CONTINUITY_BROKEN");
  return preserved;
}

function validateObservabilityReconstruction(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): boolean {
  const reconstructed = input.observability.result.portfolioVisible
    && input.observability.result.relationshipsVisible
    && input.observability.result.lineageVisible
    && input.observability.result.auditVisible
    && input.observability.result.governanceVisible;
  addReason(reasons, reconstructed ? "OBSERVABILITY_RECONSTRUCTED" : "OBSERVABILITY_RECONSTRUCTION_BROKEN");
  return reconstructed;
}

function validateBoundary(input: PortfolioReplayInput, reasons: PortfolioReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = orderedBundles(input).every((bundle) => {
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
    ] satisfies readonly Record<string, unknown>[];
    return records.every(createBoundaryFlags);
  });
  addReason(reasons, executionImpossible ? "EXECUTION_IMPOSSIBLE" : "EXECUTION_REQUEST_BLOCKED");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RECOMMENDATION_RANKING_DETECTED" : "RECOMMENDATION_RANKING_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.recommendationScoringRequested === true ? "RECOMMENDATION_SCORING_DETECTED" : "RECOMMENDATION_SCORING_BLOCKED");
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  const invalidBoundary = !executionImpossible
    || input.workflowRoutingRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.recommendationScoringRequested === true
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

export function createPortfolioReplayEvidencePath(input: PortfolioReplayInput): PortfolioReplayEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.replayScope,
    portfolioReferences: normalizeStrings([
      input.portfolio.result.portfolioHash,
      ...input.portfolio.portfolio.recommendationIds,
      ...input.portfolio.portfolio.ownershipReferences,
    ]),
    relationshipReferences: normalizeStrings(input.relationshipAnalysis.relationships.map((relationship) => relationship.relationshipId)),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    evidenceHashes: normalizeStrings([
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.observability.result.observabilityHash,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  relationshipCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  reasons: PortfolioReplayReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_PORTFOLIO_SIZE
    && relationshipCount <= MAX_RELATIONSHIPS
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_PORTFOLIO_SIZE ? "PORTFOLIO_SIZE_VALID" : "PORTFOLIO_SIZE_EXCEEDED");
  addReason(reasons, relationshipCount <= MAX_RELATIONSHIPS ? "RELATIONSHIP_LIMIT_VALID" : "RELATIONSHIP_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: PortfolioReplayRequest,
  replayState: PortfolioReplayResult["replayState"],
  compositionReconstructed: boolean,
  relationshipsReconstructed: boolean,
  evidenceReconstructed: boolean,
  governanceReconstructed: boolean,
  tenantIsolationVerified: boolean,
  replayHash: string,
  reconstructionHash: string,
): PortfolioReplayResult {
  return Object.freeze({
    portfolioId: request.portfolioId,
    replayState,
    compositionReconstructed,
    relationshipsReconstructed,
    evidenceReconstructed,
    governanceReconstructed,
    tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

function buildObservability(result: PortfolioReplayResult): PortfolioReplayObservability {
  return Object.freeze({
    portfolioId: result.portfolioId,
    replayState: result.replayState,
    compositionReconstructed: result.compositionReconstructed,
    relationshipsReconstructed: result.relationshipsReconstructed,
    evidenceReconstructed: result.evidenceReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

function buildValidation(
  replayState: PortfolioReplayResult["replayState"],
  reasonCodes: readonly PortfolioReplayReasonCode[],
  compositionReconstructed: boolean,
  relationshipsReconstructed: boolean,
  evidenceReconstructed: boolean,
  governanceReconstructed: boolean,
  observabilityReconstructed: boolean,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    relationshipCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
  }>,
): PortfolioReplayValidation {
  return Object.freeze({
    valid: replayState !== "INVALID",
    replayState,
    reasonCodes: [...reasonCodes],
    compositionReconstructed,
    relationshipsReconstructed,
    evidenceReconstructed,
    governanceReconstructed,
    observabilityReconstructed,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true,
    relationshipCount: counts.relationshipCount,
    replayReferenceCount: counts.replayReferenceCount,
    lineageReferenceCount: counts.lineageReferenceCount,
  });
}

export function buildPortfolioReplayRequest(request: PortfolioReplayRequest): PortfolioReplayRequest {
  return requestCore(request);
}

export function sealPortfolioReplay(input: PortfolioReplayInput): SealedPortfolioReplayRecord {
  const reasons: PortfolioReplayReasonCode[] = [];
  const requestValid = validatePortfolioId(input.request, reasons)
    && validateScope(input.request.replayScope, reasons);
  const portfolioValid = validatePortfolio(input, reasons);
  const relationshipAnalysisValid = validateRelationshipAnalysis(input, reasons);
  const observabilityValid = validateObservability(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const compositionReconstructed = validateComposition(input, reasons);
  const relationshipsReconstructed = validateRelationships(input, reasons);
  const evidenceValidation = validateEvidence(input, reasons);
  const governanceValidation = validateGovernance(input, reasons);
  const replayHashValidation = validateReplayHashes(input, reasons);
  const lineageContinuityPreserved = validateLineageContinuity(input, reasons);
  const observabilityReconstructed = validateObservabilityReconstruction(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createPortfolioReplayEvidencePath(input);
  const counts = Object.freeze({
    relationshipCount: input.relationshipAnalysis.relationships.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
  });
  const limitsValid = validateLimits(
    input.portfolio.result.recommendationCount,
    counts.relationshipCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    reasons,
  );
  addReason(reasons, "PORTFOLIO_REPLAY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !portfolioValid
    || !relationshipAnalysisValid
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
    !compositionReconstructed
    || !relationshipsReconstructed
    || !evidenceValidation.reconstructed
    || evidenceValidation.degraded
  );

  const replayState = invalid ? "INVALID" : escalated ? "ESCALATED" : limited ? "LIMITED" : "REPLAYABLE";

  const replayHash = hashReplayValue("portfolio-replay-framework", {
    request: requestCore(input.request),
    portfolioHash: input.portfolio.result.portfolioHash,
    relationshipAnalysisHash: input.relationshipAnalysis.result.analysisHash,
    observabilityHash: input.observability.result.observabilityHash,
    replayState,
    portfolioReferences: evidencePath.portfolioReferences,
    relationshipReferences: evidencePath.relationshipReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const reconstructionHash = hashReplayValue("portfolio-replay-reconstruction", {
    compositionReconstructed,
    relationshipsReconstructed,
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
    compositionReconstructed,
    relationshipsReconstructed,
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
    compositionReconstructed,
    relationshipsReconstructed,
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
    recommendationScoringAllowed: false,
    recommendationApprovalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
