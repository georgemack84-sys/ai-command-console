import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  PortfolioCertificationEvidencePath,
  PortfolioCertificationInput,
  PortfolioCertificationObservability,
  PortfolioCertificationReasonCode,
  PortfolioCertificationRequest,
  PortfolioCertificationResult,
  PortfolioCertificationScope,
  PortfolioCertificationValidation,
  RecommendationPortfolioBundle,
  SealedPortfolioCertificationRecord,
} from "./types";

const MAX_PORTFOLIO_SIZE = 10_000;
const MAX_RELATIONSHIPS = 50_000;
const MAX_REPLAY_REFERENCES = 10_000;
const MAX_LINEAGE_REFERENCES = 10_000;

const CERTIFICATION_SCOPES: readonly PortfolioCertificationScope[] = Object.freeze([
  "INTEGRITY",
  "OWNERSHIP",
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

function addReason(reasons: PortfolioCertificationReasonCode[], reason: PortfolioCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: PortfolioCertificationRequest): PortfolioCertificationRequest {
  return Object.freeze({
    portfolioId: request.portfolioId,
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: PortfolioCertificationInput): RecommendationPortfolioBundle[] {
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

function validatePortfolio(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const valid = input.portfolio.sealed === true
    && input.portfolio.result.portfolioId === input.request.portfolioId
    && input.portfolio.portfolio.tenantId === input.request.tenantId;
  addReason(reasons, input.portfolio.sealed === true ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  return valid;
}

function validateRelationshipAnalysis(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const valid = input.relationshipAnalysis.sealed === true
    && input.relationshipAnalysis.result.portfolioId === input.request.portfolioId;
  addReason(reasons, input.relationshipAnalysis.sealed === true ? "RELATIONSHIP_ANALYSIS_REQUIRED" : "RELATIONSHIP_ANALYSIS_UNSEALED");
  return valid;
}

function validateObservability(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const valid = input.observability.sealed === true
    && input.observability.result.portfolioId === input.request.portfolioId;
  addReason(reasons, input.observability.sealed === true ? "OBSERVABILITY_REQUIRED" : "OBSERVABILITY_UNSEALED");
  return valid;
}

function validateReplay(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const valid = input.replay.sealed === true
    && input.replay.result.portfolioId === input.request.portfolioId;
  addReason(reasons, input.replay.sealed === true ? "REPLAY_REQUIRED" : "REPLAY_UNSEALED");
  return valid;
}

function validateScope(scope: PortfolioCertificationScope, reasons: PortfolioCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validatePortfolioId(request: PortfolioCertificationRequest, reasons: PortfolioCertificationReasonCode[]): boolean {
  const valid = request.portfolioId.length > 0;
  addReason(reasons, valid ? "PORTFOLIO_ID_PRESENT" : "PORTFOLIO_ID_MISSING");
  return valid;
}

function validateSealedArtifacts(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const sealed = input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
    && input.observability.sealed === true
    && input.replay.sealed === true
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

function validateTenantScope(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CERTIFICATION_BLOCKED");
  return valid;
}

function validateOwnership(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
    && bundle.ownershipEvidence.ownershipReferences.length > 0
    && bundle.certification.result.ownershipCertified
    && bundle.authorityScope.result.ownershipValidated
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateIntegrity(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const certified = input.portfolio.result.portfolioState !== "INVALID"
    && input.relationshipAnalysis.result.relationshipState !== "INVALID"
    && input.portfolio.result.governanceBound
    && input.portfolio.result.lineageBound
    && input.relationshipAnalysis.relationships.length > 0
    && input.portfolio.portfolio.recommendationIds.length === normalizeStrings(orderedBundles(input).map(recommendationId)).length;
  addReason(reasons, certified ? "INTEGRITY_CERTIFIED" : "INTEGRITY_BROKEN");
  return certified;
}

function validateReplayCertification(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): { certified: boolean; degraded: boolean } {
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

function validateGovernance(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const certified = input.portfolio.result.governanceBound
    && orderedBundles(input).every((bundle) => (
      bundle.binding.result.bindingState !== "INVALID"
      && bundle.authorityScope.result.scopeState !== "INVALID"
      && bundle.policyVisibility.result.visibilityState !== "INVALID"
      && bundle.governanceCertification.result.certificationState !== "FAIL"
    ));
  addReason(reasons, certified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return certified;
}

function validateObservabilityCertification(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): { certified: boolean; incomplete: boolean } {
  const incomplete = input.observability.result.observabilityState === "OBSERVE"
    || input.observability.result.observabilityState === "LIMITED"
    || !input.observability.result.portfolioVisible
    || !input.observability.result.relationshipsVisible
    || !input.observability.result.lineageVisible
    || !input.observability.result.replayVisible
    || !input.observability.result.auditVisible
    || !input.observability.result.governanceVisible;
  const certified = !incomplete && input.observability.result.observabilityState === "VISIBLE";
  addReason(reasons, certified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_INCOMPLETE");
  return { certified, incomplete };
}

function validateLineage(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): boolean {
  const certified = input.portfolio.result.lineageBound
    && input.relationshipAnalysis.result.lineageRelationshipsDetected >= 0
    && input.replay.result.replayState !== "ESCALATED"
    && orderedBundles(input).every((bundle) => (
      bundle.lineage.result.reconstructionState !== "INVALID"
      && bundle.lineage.result.lineageIntegrity
      && bundle.integrity.result.lineageIntegrity
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, certified ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return certified;
}

function validateBoundary(input: PortfolioCertificationInput, reasons: PortfolioCertificationReasonCode[]): BoundaryValidation {
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
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  const invalidBoundary = !executionImpossible
    || input.workflowRoutingRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.recommendationScoringRequested === true
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

export function createPortfolioCertificationEvidencePath(input: PortfolioCertificationInput): PortfolioCertificationEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.certificationScope,
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
      input.replay.result.replayHash,
      input.replay.result.reconstructionHash,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  relationshipCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  reasons: PortfolioCertificationReasonCode[],
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
  request: PortfolioCertificationRequest,
  certificationState: PortfolioCertificationResult["certificationState"],
  integrityCertified: boolean,
  ownershipCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  tenantIsolationVerified: boolean,
  certificationHash: string,
): PortfolioCertificationResult {
  return Object.freeze({
    portfolioId: request.portfolioId,
    certificationState,
    integrityCertified,
    ownershipCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

function buildObservability(result: PortfolioCertificationResult): PortfolioCertificationObservability {
  return Object.freeze({
    portfolioId: result.portfolioId,
    certificationState: result.certificationState,
    integrityCertified: result.integrityCertified,
    ownershipCertified: result.ownershipCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    observabilityCertified: result.observabilityCertified,
    certificationHash: result.certificationHash,
  });
}

function buildValidation(
  certificationState: PortfolioCertificationResult["certificationState"],
  reasonCodes: readonly PortfolioCertificationReasonCode[],
  integrityCertified: boolean,
  ownershipCertified: boolean,
  replayCertified: boolean,
  governanceCertified: boolean,
  observabilityCertified: boolean,
  lineageCertified: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    relationshipCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
  }>,
): PortfolioCertificationValidation {
  return Object.freeze({
    valid: certificationState !== "FAIL",
    certificationState,
    reasonCodes: [...reasonCodes],
    integrityCertified,
    ownershipCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    lineageCertified,
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

export function buildPortfolioCertificationRequest(request: PortfolioCertificationRequest): PortfolioCertificationRequest {
  return requestCore(request);
}

export function sealPortfolioCertification(input: PortfolioCertificationInput): SealedPortfolioCertificationRecord {
  const reasons: PortfolioCertificationReasonCode[] = [];
  const requestValid = validatePortfolioId(input.request, reasons)
    && validateScope(input.request.certificationScope, reasons);
  const portfolioValid = validatePortfolio(input, reasons);
  const relationshipAnalysisValid = validateRelationshipAnalysis(input, reasons);
  const observabilityValid = validateObservability(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipCertified = validateOwnership(input, reasons);
  const integrityCertified = validateIntegrity(input, reasons);
  const replayCertification = validateReplayCertification(input, reasons);
  const governanceCertified = validateGovernance(input, reasons);
  const observabilityCertification = validateObservabilityCertification(input, reasons);
  const lineageCertified = validateLineage(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createPortfolioCertificationEvidencePath(input);
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
  addReason(reasons, "PORTFOLIO_CERTIFICATION_IS_NOT_CONTROL");

  const fail = !requestValid
    || !portfolioValid
    || !relationshipAnalysisValid
    || !observabilityValid
    || !replayValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipCertified
    || !integrityCertified
    || !governanceCertified
    || !lineageCertified
    || boundary.invalidBoundary
    || !limitsValid
    || reasons.includes("REPLAY_CORRUPTION_DETECTED");

  const conditional = !fail && (
    replayCertification.degraded
    || observabilityCertification.incomplete
  );

  const certificationState = fail ? "FAIL" : conditional ? "CONDITIONAL_PASS" : "PASS";

  const certificationHash = hashCertificationValue("portfolio-certification-gate", {
    request: requestCore(input.request),
    portfolioHash: input.portfolio.result.portfolioHash,
    relationshipAnalysisHash: input.relationshipAnalysis.result.analysisHash,
    observabilityHash: input.observability.result.observabilityHash,
    replayHash: input.replay.result.replayHash,
    reconstructionHash: input.replay.result.reconstructionHash,
    certificationState,
    portfolioReferences: evidencePath.portfolioReferences,
    relationshipReferences: evidencePath.relationshipReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    certificationState,
    integrityCertified,
    ownershipCertified,
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
    ownershipCertified,
    replayCertification.certified,
    governanceCertified,
    observabilityCertification.certified,
    lineageCertified,
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
    recommendationScoringAllowed: false,
    recommendationApprovalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
