import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationPortfolio,
  RecommendationPortfolioBundle,
  RecommendationPortfolioEvidencePath,
  RecommendationPortfolioInput,
  RecommendationPortfolioObservability,
  RecommendationPortfolioReasonCode,
  RecommendationPortfolioRequest,
  RecommendationPortfolioResult,
  RecommendationPortfolioScope,
  RecommendationPortfolioValidation,
  SealedRecommendationPortfolioRecord,
} from "./types";

const MAX_PORTFOLIO_SIZE = 10_000;
const MAX_GOVERNANCE_REFERENCES = 5_000;
const MAX_REPLAY_REFERENCES = 5_000;
const MAX_LINEAGE_REFERENCES = 5_000;
const CREATED_AT_SENTINEL = "1970-01-01T00:00:00.000Z";

const PORTFOLIO_SCOPES: readonly RecommendationPortfolioScope[] = Object.freeze([
  "STANDARD",
  "GOVERNANCE",
  "OBSERVABILITY",
  "READINESS",
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

function addReason(reasons: RecommendationPortfolioReasonCode[], reason: RecommendationPortfolioReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashPortfolioValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationPortfolioRequest): RecommendationPortfolioRequest {
  return Object.freeze({
    portfolioId: request.portfolioId,
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    portfolioScope: request.portfolioScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: RecommendationPortfolioInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function collectGovernanceReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.governanceReferences.governanceReferences,
    ...bundle.binding.evidencePath.governanceReferences,
    ...bundle.authorityScope.evidencePath.governanceReferences,
    ...bundle.policyVisibility.evidencePath.governanceReferences,
    ...bundle.governanceReplay.evidencePath.governanceReferences,
    ...bundle.governanceCertification.evidencePath.governanceReferences,
    ...bundle.alignment.evidencePath.governanceReferences,
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

function collectOwnershipReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings(bundle.ownershipEvidence.ownershipReferences);
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

function validateSealedArtifacts(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const allSealed = orderedBundles(input).every((bundle) => {
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
  addReason(reasons, allSealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return allSealed;
}

function validateScope(scope: RecommendationPortfolioScope, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const valid = PORTFOLIO_SCOPES.includes(scope);
  addReason(reasons, valid ? "PORTFOLIO_SCOPE_VALID" : "PORTFOLIO_SCOPE_INVALID");
  return valid;
}

function validatePortfolioId(request: RecommendationPortfolioRequest, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const valid = request.portfolioId.length > 0;
  addReason(reasons, valid ? "PORTFOLIO_ID_PRESENT" : "PORTFOLIO_ID_MISSING");
  return valid;
}

function validateRecommendationIds(request: RecommendationPortfolioRequest, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateMembership(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  const complete = requested.length === actual.length && requested.every((value, index) => value === actual[index]);
  addReason(reasons, complete ? "MEMBERSHIP_COMPLETE" : "PORTFOLIO_INCOMPLETE");
  return complete;
}

function validateTenantScope(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ledger.entry.tenantId === tenantId
    && bundle.governanceReferences.tenantId === tenantId
    && bundle.ownershipEvidence.tenantId === tenantId
    && bundle.replayEvidence.tenantId === tenantId
    && bundle.readiness.result.tenantIsolationVerified
    && bundle.alignment.result.tenantIsolationVerified
    && bundle.reviewPacket.result.tenantIsolationVerified
    && bundle.replayFramework.result.tenantIsolationVerified
    && bundle.readinessCertification.result.tenantIsolationVerified
    && bundle.ledger.result.tenantIsolationVerified
    && bundle.lineage.result.tenantIsolationVerified
    && bundle.verification.result.tenantIsolationVerified
    && bundle.replay.result.tenantIsolationVerified
    && bundle.integrity.result.tenantIsolationVerified
    && bundle.certification.result.tenantIsolationVerified
    && bundle.observability.result.tenantIsolationVerified
    && bundle.inspection.result.tenantIsolationVerified
    && bundle.visibility.result.tenantIsolationVerified
    && bundle.audit.result.tenantIsolationVerified
    && bundle.observabilityCertification.result.tenantIsolationVerified
    && bundle.binding.result.tenantIsolationVerified
    && bundle.authorityScope.result.tenantIsolationVerified
    && bundle.policyVisibility.result.tenantIsolationVerified
    && bundle.governanceReplay.result.tenantIsolationVerified
    && bundle.governanceCertification.result.tenantIsolationVerified
  ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_RECOMMENDATIONS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
    && bundle.ownershipEvidence.ownershipReferences.length > 0
    && bundle.certification.result.ownershipCertified
    && bundle.authorityScope.result.ownershipValidated
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGovernance(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL"
  ));
  addReason(reasons, valid ? "GOVERNANCE_BOUND" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): { bound: boolean; degraded: boolean } {
  const bundles = orderedBundles(input);
  const corrupted = bundles.some((bundle) => (
    bundle.replay.result.replayState === "INVALID"
    || bundle.governanceReplay.result.replayState === "INVALID"
    || bundle.replayFramework.result.replayState === "INVALID"
    || bundle.replayFramework.result.replayState === "ESCALATED"
  ));
  const degraded = !corrupted && (
    bundles.some((bundle) => (
      bundle.replay.result.replayState === "LIMITED"
      || bundle.governanceReplay.result.replayState === "LIMITED"
      || bundle.replayFramework.result.replayState === "LIMITED"
      || bundle.replayEvidence.replayReferences.length === 0
    ))
  );
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  else addReason(reasons, degraded ? "REPLAY_DEGRADED" : "REPLAY_BOUND");
  return { bound: !corrupted && !degraded, degraded };
}

function validateLineage(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.lineage.result.reconstructionState !== "INVALID"
    && bundle.lineage.result.lineageIntegrity
    && bundle.integrity.result.lineageIntegrity
    && collectLineageReferences(bundle).length > 0
  ));
  addReason(reasons, valid ? "LINEAGE_BOUND" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateObservability(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const preserved = orderedBundles(input).every((bundle) => (
    bundle.observability.result.observabilityState === "VISIBLE"
    && bundle.inspection.result.inspectionState === "AVAILABLE"
    && bundle.visibility.result.visibilityState === "VISIBLE"
    && bundle.audit.result.exportState === "EXPORTED"
    && bundle.observabilityCertification.result.certificationState === "PASS"
  ));
  addReason(reasons, preserved ? "OBSERVABILITY_PRESERVED" : "OBSERVABILITY_DEGRADED");
  return preserved;
}

function validateReadiness(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): boolean {
  const complete = orderedBundles(input).every((bundle) => (
    bundle.readiness.result.readinessState !== "NOT_READY"
    && bundle.alignment.result.alignmentState !== "MISALIGNED"
    && bundle.reviewPacket.result.packetState !== "INVALID"
    && bundle.readinessCertification.result.certificationState !== "FAIL"
  ));
  addReason(reasons, complete ? "READINESS_COMPLETE" : "READINESS_INCOMPLETE");
  return complete;
}

function validateBoundary(input: RecommendationPortfolioInput, reasons: RecommendationPortfolioReasonCode[]): BoundaryValidation {
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
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.portfolioMutationAttempted === true ? "PORTFOLIO_MUTATION_DETECTED" : "PORTFOLIO_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  const invalidBoundary = !executionImpossible
    || input.workflowRoutingRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.recommendationApprovalRequested === true
    || !authorityBounded
    || input.portfolioMutationAttempted === true
    || !controlSurfaceAbsent;
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary,
    controlSurfaceAbsent,
  });
}

function validateLimits(
  recommendationCount: number,
  governanceReferenceCount: number,
  replayReferenceCount: number,
  lineageReferenceCount: number,
  reasons: RecommendationPortfolioReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_PORTFOLIO_SIZE
    && governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES
    && replayReferenceCount <= MAX_REPLAY_REFERENCES
    && lineageReferenceCount <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, recommendationCount <= MAX_PORTFOLIO_SIZE ? "PORTFOLIO_SIZE_VALID" : "PORTFOLIO_SIZE_EXCEEDED");
  addReason(reasons, governanceReferenceCount <= MAX_GOVERNANCE_REFERENCES ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayReferenceCount <= MAX_REPLAY_REFERENCES ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageReferenceCount <= MAX_LINEAGE_REFERENCES ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function createRecommendationPortfolioEvidencePath(input: RecommendationPortfolioInput): RecommendationPortfolioEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.portfolioScope,
    governanceReferences: normalizeStrings(bundles.flatMap(collectGovernanceReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    ownershipReferences: normalizeStrings(bundles.flatMap(collectOwnershipReferences)),
    evidenceHashes: normalizeStrings(bundles.flatMap(collectEvidenceHashes)),
  });
}

function buildPortfolio(
  input: RecommendationPortfolioInput,
  evidencePath: RecommendationPortfolioEvidencePath,
  portfolioHash: string,
): RecommendationPortfolio {
  return Object.freeze({
    portfolioId: input.request.portfolioId,
    tenantId: input.request.tenantId,
    recommendationIds: normalizeStrings(input.request.recommendationIds),
    governanceReferences: [...evidencePath.governanceReferences],
    replayReferences: [...evidencePath.replayReferences],
    lineageReferences: [...evidencePath.lineageReferences],
    ownershipReferences: [...evidencePath.ownershipReferences],
    portfolioHash,
    createdAt: CREATED_AT_SENTINEL,
  });
}

function buildResult(
  request: RecommendationPortfolioRequest,
  portfolioState: RecommendationPortfolioResult["portfolioState"],
  governanceBound: boolean,
  replayBound: boolean,
  lineageBound: boolean,
  tenantIsolationVerified: boolean,
  portfolioHash: string,
): RecommendationPortfolioResult {
  return Object.freeze({
    portfolioId: request.portfolioId,
    portfolioState,
    recommendationCount: normalizeStrings(request.recommendationIds).length,
    governanceBound,
    replayBound,
    lineageBound,
    tenantIsolationVerified,
    portfolioHash,
    deterministic: true,
  });
}

function buildObservability(
  result: RecommendationPortfolioResult,
  portfolioHash: string,
): RecommendationPortfolioObservability {
  return Object.freeze({
    portfolioId: result.portfolioId,
    portfolioState: result.portfolioState,
    recommendationCount: result.recommendationCount,
    governanceBound: result.governanceBound,
    replayBound: result.replayBound,
    lineageBound: result.lineageBound,
    portfolioHash,
  });
}

function buildValidation(
  portfolioState: RecommendationPortfolioResult["portfolioState"],
  reasonCodes: readonly RecommendationPortfolioReasonCode[],
  governanceBound: boolean,
  replayBound: boolean,
  lineageBound: boolean,
  ownershipValid: boolean,
  readinessComplete: boolean,
  observabilityPreserved: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    recommendationCount: number;
    governanceReferenceCount: number;
    replayReferenceCount: number;
    lineageReferenceCount: number;
  }>,
): RecommendationPortfolioValidation {
  return Object.freeze({
    valid: portfolioState !== "INVALID",
    portfolioState,
    reasonCodes: [...reasonCodes],
    governanceBound,
    replayBound,
    lineageBound,
    ownershipValid,
    readinessComplete,
    observabilityPreserved,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true,
    recommendationCount: counts.recommendationCount,
    governanceReferenceCount: counts.governanceReferenceCount,
    replayReferenceCount: counts.replayReferenceCount,
    lineageReferenceCount: counts.lineageReferenceCount,
  });
}

export function buildRecommendationPortfolioRequest(
  request: RecommendationPortfolioRequest,
): RecommendationPortfolioRequest {
  return requestCore(request);
}

export { createRecommendationPortfolioEvidencePath };

export function sealRecommendationPortfolio(input: RecommendationPortfolioInput): SealedRecommendationPortfolioRecord {
  const reasons: RecommendationPortfolioReasonCode[] = [];
  const evidencePath = createRecommendationPortfolioEvidencePath(input);
  const counts = Object.freeze({
    recommendationCount: normalizeStrings(input.request.recommendationIds).length,
    governanceReferenceCount: evidencePath.governanceReferences.length,
    replayReferenceCount: evidencePath.replayReferences.length,
    lineageReferenceCount: evidencePath.lineageReferences.length,
  });

  const requestValid = validatePortfolioId(input.request, reasons)
    && validateScope(input.request.portfolioScope, reasons)
    && validateRecommendationIds(input.request, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const membershipValid = validateMembership(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const governanceBound = validateGovernance(input, reasons);
  const replayValidation = validateReplay(input, reasons);
  const lineageBound = validateLineage(input, reasons);
  const observabilityPreserved = validateObservability(input, reasons);
  const readinessComplete = validateReadiness(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const limitsValid = validateLimits(
    counts.recommendationCount,
    counts.governanceReferenceCount,
    counts.replayReferenceCount,
    counts.lineageReferenceCount,
    reasons,
  );
  addReason(reasons, "PORTFOLIO_FOUNDATION_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceBound
    || !lineageBound
    || boundary.invalidBoundary
    || !limitsValid
    || reasons.includes("REPLAY_CORRUPTION_DETECTED");

  const observe = !invalid && (!membershipValid || !readinessComplete);
  const limited = !invalid && !observe && (replayValidation.degraded || !observabilityPreserved);
  const portfolioState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "ESTABLISHED";

  const portfolioHash = hashPortfolioValue("recommendation-portfolio-foundation", {
    request: requestCore(input.request),
    recommendationIds: normalizeStrings(input.request.recommendationIds),
    governanceReferences: evidencePath.governanceReferences,
    replayReferences: evidencePath.replayReferences,
    lineageReferences: evidencePath.lineageReferences,
    ownershipReferences: evidencePath.ownershipReferences,
    evidenceHashes: evidencePath.evidenceHashes,
    state: portfolioState,
  });

  const portfolio = buildPortfolio(input, evidencePath, portfolioHash);
  const result = buildResult(
    input.request,
    portfolioState,
    governanceBound,
    !replayValidation.degraded && !reasons.includes("REPLAY_CORRUPTION_DETECTED"),
    lineageBound,
    tenantIsolationVerified,
    portfolioHash,
  );
  const observability = buildObservability(result, portfolioHash);
  const validation = buildValidation(
    portfolioState,
    reasons,
    governanceBound,
    result.replayBound,
    lineageBound,
    ownershipValid,
    readinessComplete,
    observabilityPreserved,
    tenantIsolationVerified,
    boundary,
    counts,
  );

  return Object.freeze({
    result,
    portfolio,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    portfolioOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    recommendationRankingAllowed: false,
    recommendationPrioritizationAllowed: false,
    recommendationApprovalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
