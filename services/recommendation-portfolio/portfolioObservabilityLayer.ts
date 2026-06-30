import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  PortfolioObservabilityEvidencePath,
  PortfolioObservabilityInput,
  PortfolioObservabilityObservability,
  PortfolioObservabilityReasonCode,
  PortfolioObservabilityRequest,
  PortfolioObservabilityResult,
  PortfolioObservabilityScope,
  PortfolioObservabilityValidation,
  RecommendationPortfolioBundle,
  SealedPortfolioObservabilityRecord,
} from "./types";

const MAX_PORTFOLIO_SIZE = 10_000;
const MAX_VISIBLE_RELATIONSHIPS = 50_000;
const MAX_VISIBLE_REPLAY_REFERENCES = 10_000;
const MAX_VISIBLE_LINEAGE_REFERENCES = 10_000;

const OBSERVABILITY_SCOPES: readonly PortfolioObservabilityScope[] = Object.freeze([
  "SUMMARY",
  "RELATIONSHIPS",
  "LINEAGE",
  "REPLAY",
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

function addReason(reasons: PortfolioObservabilityReasonCode[], reason: PortfolioObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: PortfolioObservabilityRequest): PortfolioObservabilityRequest {
  return Object.freeze({
    portfolioId: request.portfolioId,
    tenantId: request.tenantId,
    observabilityScope: request.observabilityScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: PortfolioObservabilityInput): RecommendationPortfolioBundle[] {
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

function collectAuditReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.lineageReferences,
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

function validatePortfolio(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const valid = input.portfolio.sealed === true
    && input.portfolio.result.portfolioId === input.request.portfolioId
    && input.portfolio.portfolio.tenantId === input.request.tenantId;
  addReason(reasons, input.portfolio.sealed === true ? "PORTFOLIO_REQUIRED" : "PORTFOLIO_UNSEALED");
  return valid;
}

function validateRelationshipAnalysis(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const valid = input.relationshipAnalysis.sealed === true
    && input.relationshipAnalysis.result.portfolioId === input.request.portfolioId;
  addReason(reasons, input.relationshipAnalysis.sealed === true ? "RELATIONSHIP_ANALYSIS_REQUIRED" : "RELATIONSHIP_ANALYSIS_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const sealed = input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
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

function validateScope(scope: PortfolioObservabilityScope, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OBSERVABILITY_SCOPE_VALID" : "OBSERVABILITY_SCOPE_INVALID");
  return valid;
}

function validatePortfolioId(request: PortfolioObservabilityRequest, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const valid = request.portfolioId.length > 0;
  addReason(reasons, valid ? "PORTFOLIO_ID_PRESENT" : "PORTFOLIO_ID_MISSING");
  return valid;
}

function validateTenantScope(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_VISIBILITY_BLOCKED");
  return valid;
}

function validateOwnership(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
    && bundle.ownershipEvidence.ownershipReferences.length > 0
    && bundle.certification.result.ownershipCertified
    && bundle.authorityScope.result.ownershipValidated
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validatePortfolioVisibility(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const visible = input.portfolio.portfolio.recommendationIds.length > 0
    && input.portfolio.portfolio.governanceReferences.length > 0
    && input.portfolio.portfolio.replayReferences.length > 0;
  addReason(reasons, visible ? "PORTFOLIO_VISIBLE" : "PORTFOLIO_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateRelationshipVisibility(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const visible = input.relationshipAnalysis.relationships.length > 0
    && input.relationshipAnalysis.evidencePath.relationshipReferences.length > 0;
  addReason(reasons, visible ? "RELATIONSHIPS_VISIBLE" : "RELATIONSHIP_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateLineageVisibility(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const visible = input.portfolio.result.lineageBound
    && input.relationshipAnalysis.result.lineageRelationshipsDetected >= 0
    && orderedBundles(input).every((bundle) => collectLineageReferences(bundle).length > 0);
  addReason(reasons, visible ? "LINEAGE_VISIBLE" : "LINEAGE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateReplayVisibility(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): { visible: boolean; degraded: boolean } {
  const corrupted = input.portfolio.result.portfolioState === "INVALID"
    || input.relationshipAnalysis.result.relationshipState === "INVALID"
    || orderedBundles(input).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "ESCALATED"
    ));
  const degraded = !corrupted && orderedBundles(input).some((bundle) => (
    bundle.replayEvidence.replayReferences.length === 0
    || bundle.replay.result.replayState === "LIMITED"
    || bundle.governanceReplay.result.replayState === "LIMITED"
    || bundle.replayFramework.result.replayState === "LIMITED"
  ));
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  else addReason(reasons, degraded ? "REPLAY_VISIBILITY_MISSING" : "REPLAY_VISIBLE");
  return { visible: !corrupted && !degraded, degraded };
}

function validateAuditVisibility(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input).every((bundle) => (
    bundle.audit.result.exportState === "EXPORTED"
    && bundle.observabilityCertification.result.certificationState === "PASS"
    && bundle.readinessCertification.result.certificationState !== "FAIL"
    && bundle.governanceCertification.result.certificationState !== "FAIL"
  ));
  addReason(reasons, visible ? "AUDIT_VISIBLE" : "AUDIT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateGovernanceVisibility(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): { visible: boolean; corrupted: boolean } {
  const corrupted = orderedBundles(input).some((bundle) => (
    bundle.binding.result.bindingState === "INVALID"
    || bundle.authorityScope.result.scopeState === "INVALID"
    || bundle.policyVisibility.result.visibilityState === "INVALID"
    || bundle.governanceCertification.result.certificationState === "FAIL"
  ));
  const visible = !corrupted && orderedBundles(input).every((bundle) => (
    bundle.governanceReferences.governanceReferences.length > 0
    && bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeValidated
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
  ));
  if (corrupted) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  else addReason(reasons, visible ? "GOVERNANCE_VISIBLE" : "GOVERNANCE_VISIBILITY_MISSING");
  return { visible, corrupted };
}

function validateVisibilityEvidence(
  portfolioVisible: boolean,
  relationshipsVisible: boolean,
  lineageVisible: boolean,
  auditVisible: boolean,
  reasons: PortfolioObservabilityReasonCode[],
): boolean {
  const complete = portfolioVisible && relationshipsVisible && lineageVisible && auditVisible;
  addReason(reasons, complete ? "VISIBILITY_EVIDENCE_COMPLETE" : "VISIBILITY_EVIDENCE_MISSING");
  return complete;
}

function validateBoundary(input: PortfolioObservabilityInput, reasons: PortfolioObservabilityReasonCode[]): BoundaryValidation {
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
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  const invalidBoundary = !executionImpossible
    || input.workflowRoutingRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.recommendationScoringRequested === true
    || input.recommendationApprovalRequested === true
    || !authorityBounded
    || input.observabilityMutationAttempted === true
    || !controlSurfaceAbsent;
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary,
    controlSurfaceAbsent,
  });
}

function createPortfolioObservabilityEvidencePath(input: PortfolioObservabilityInput): PortfolioObservabilityEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.observabilityScope,
    portfolioReferences: normalizeStrings([
      input.portfolio.result.portfolioHash,
      ...input.portfolio.portfolio.recommendationIds,
      ...input.portfolio.portfolio.ownershipReferences,
    ]),
    relationshipReferences: normalizeStrings(input.relationshipAnalysis.relationships.map((relationship) => relationship.relationshipId)),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    governanceReferences: normalizeStrings(bundles.flatMap(collectGovernanceReferences)),
    auditReferences: normalizeStrings(bundles.flatMap(collectAuditReferences)),
    evidenceHashes: normalizeStrings([
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  visibleRelationshipCount: number,
  visibleReplayReferenceCount: number,
  visibleLineageReferenceCount: number,
  reasons: PortfolioObservabilityReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_PORTFOLIO_SIZE
    && visibleRelationshipCount <= MAX_VISIBLE_RELATIONSHIPS
    && visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES
    && visibleLineageReferenceCount <= MAX_VISIBLE_LINEAGE_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_PORTFOLIO_SIZE ? "PORTFOLIO_SIZE_VALID" : "PORTFOLIO_SIZE_EXCEEDED");
  addReason(reasons, visibleRelationshipCount <= MAX_VISIBLE_RELATIONSHIPS ? "VISIBLE_RELATIONSHIP_LIMIT_VALID" : "VISIBLE_RELATIONSHIP_LIMIT_EXCEEDED");
  addReason(reasons, visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES ? "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID" : "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, visibleLineageReferenceCount <= MAX_VISIBLE_LINEAGE_REFERENCES ? "VISIBLE_LINEAGE_REFERENCE_LIMIT_VALID" : "VISIBLE_LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: PortfolioObservabilityRequest,
  observabilityState: PortfolioObservabilityResult["observabilityState"],
  portfolioVisible: boolean,
  relationshipsVisible: boolean,
  lineageVisible: boolean,
  replayVisible: boolean,
  auditVisible: boolean,
  governanceVisible: boolean,
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): PortfolioObservabilityResult {
  return Object.freeze({
    portfolioId: request.portfolioId,
    observabilityState,
    portfolioVisible,
    relationshipsVisible,
    lineageVisible,
    replayVisible,
    auditVisible,
    governanceVisible,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildObservability(result: PortfolioObservabilityResult): PortfolioObservabilityObservability {
  return Object.freeze({
    portfolioId: result.portfolioId,
    observabilityState: result.observabilityState,
    portfolioVisible: result.portfolioVisible,
    relationshipsVisible: result.relationshipsVisible,
    lineageVisible: result.lineageVisible,
    replayVisible: result.replayVisible,
    auditVisible: result.auditVisible,
    governanceVisible: result.governanceVisible,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  observabilityState: PortfolioObservabilityResult["observabilityState"],
  reasonCodes: readonly PortfolioObservabilityReasonCode[],
  portfolioVisible: boolean,
  relationshipsVisible: boolean,
  lineageVisible: boolean,
  replayVisible: boolean,
  auditVisible: boolean,
  governanceVisible: boolean,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    visibleRelationshipCount: number;
    visibleReplayReferenceCount: number;
    visibleLineageReferenceCount: number;
  }>,
): PortfolioObservabilityValidation {
  return Object.freeze({
    valid: observabilityState !== "INVALID",
    observabilityState,
    reasonCodes: [...reasonCodes],
    portfolioVisible,
    relationshipsVisible,
    lineageVisible,
    replayVisible,
    auditVisible,
    governanceVisible,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true,
    visibleRelationshipCount: counts.visibleRelationshipCount,
    visibleReplayReferenceCount: counts.visibleReplayReferenceCount,
    visibleLineageReferenceCount: counts.visibleLineageReferenceCount,
  });
}

export function buildPortfolioObservabilityRequest(
  request: PortfolioObservabilityRequest,
): PortfolioObservabilityRequest {
  return requestCore(request);
}

export { createPortfolioObservabilityEvidencePath };

export function sealPortfolioObservability(input: PortfolioObservabilityInput): SealedPortfolioObservabilityRecord {
  const reasons: PortfolioObservabilityReasonCode[] = [];
  const requestValid = validatePortfolioId(input.request, reasons)
    && validateScope(input.request.observabilityScope, reasons);
  const portfolioValid = validatePortfolio(input, reasons);
  const relationshipAnalysisValid = validateRelationshipAnalysis(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const portfolioVisible = validatePortfolioVisibility(input, reasons);
  const relationshipsVisible = validateRelationshipVisibility(input, reasons);
  const lineageVisible = validateLineageVisibility(input, reasons);
  const replayValidation = validateReplayVisibility(input, reasons);
  const auditVisible = validateAuditVisibility(input, reasons);
  const governanceValidation = validateGovernanceVisibility(input, reasons);
  const visibilityEvidenceComplete = validateVisibilityEvidence(
    portfolioVisible,
    relationshipsVisible,
    lineageVisible,
    auditVisible,
    reasons,
  );
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createPortfolioObservabilityEvidencePath(input);
  const counts = Object.freeze({
    visibleRelationshipCount: input.relationshipAnalysis.relationships.length,
    visibleReplayReferenceCount: evidencePath.replayReferences.length,
    visibleLineageReferenceCount: evidencePath.lineageReferences.length,
  });
  const limitsValid = validateLimits(
    input.portfolio.result.recommendationCount,
    counts.visibleRelationshipCount,
    counts.visibleReplayReferenceCount,
    counts.visibleLineageReferenceCount,
    reasons,
  );
  addReason(reasons, "PORTFOLIO_OBSERVABILITY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !portfolioValid
    || !relationshipAnalysisValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || governanceValidation.corrupted
    || reasons.includes("REPLAY_CORRUPTION_DETECTED")
    || boundary.invalidBoundary
    || !limitsValid;

  const observe = !invalid && !visibilityEvidenceComplete;
  const limited = !invalid && !observe && (!replayValidation.visible || !governanceValidation.visible);
  const observabilityState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "VISIBLE";

  const observabilityHash = hashObservabilityValue("portfolio-observability-layer", {
    request: requestCore(input.request),
    portfolioHash: input.portfolio.result.portfolioHash,
    relationshipAnalysisHash: input.relationshipAnalysis.result.analysisHash,
    observabilityState,
    portfolioReferences: evidencePath.portfolioReferences,
    relationshipReferences: evidencePath.relationshipReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    observabilityState,
    portfolioVisible,
    relationshipsVisible,
    lineageVisible,
    replayValidation.visible,
    auditVisible,
    governanceValidation.visible,
    tenantIsolationVerified,
    observabilityHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    observabilityState,
    reasons,
    portfolioVisible,
    relationshipsVisible,
    lineageVisible,
    replayValidation.visible,
    auditVisible,
    governanceValidation.visible,
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
    visibilityOnly: true,
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
