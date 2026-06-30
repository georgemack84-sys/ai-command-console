import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyObservabilityEvidencePath,
  DependencyObservabilityInput,
  DependencyObservabilityObservability,
  DependencyObservabilityReasonCode,
  DependencyObservabilityRequest,
  DependencyObservabilityResult,
  DependencyObservabilityScope,
  DependencyObservabilityValidation,
  SealedDependencyObservabilityRecord,
} from "./types";

const MAX_DEPENDENCIES = 50_000;
const MAX_VISIBLE_CHAINS = 25_000;
const MAX_VISIBLE_CONFLICTS = 10_000;
const MAX_VISIBLE_REPLAY_REFERENCES = 10_000;

const OBSERVABILITY_SCOPES: readonly DependencyObservabilityScope[] = Object.freeze([
  "SUMMARY",
  "CHAINS",
  "CONFLICTS",
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

function addReason(reasons: DependencyObservabilityReasonCode[], reason: DependencyObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyObservabilityRequest): DependencyObservabilityRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityScope: request.observabilityScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DependencyObservabilityInput): RecommendationPortfolioBundle[] {
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

function lineageIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.lineage.result.reconstructionState !== "INVALID"
    && bundle.lineage.result.lineageIntegrity
    && bundle.integrity.result.lineageIntegrity;
}

function replayIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.replay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED"
    && bundle.replayEvidence.replayReferences.length > 0;
}

function governanceIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL";
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
    bundle.verification.result.verificationHash,
    bundle.replay.result.replayHash,
    bundle.integrity.result.integrityHash,
    bundle.certification.result.certificationHash,
    bundle.observability.result.observabilityHash,
    bundle.audit.result.exportHash,
    bundle.observabilityCertification.result.certificationHash,
    bundle.binding.result.governanceHash,
    bundle.authorityScope.result.authorityHash,
    bundle.policyVisibility.result.policyHash,
    bundle.governanceReplay.result.replayHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.governanceReferences.governanceHash,
    bundle.ownershipEvidence.ownershipHash,
    bundle.replayEvidence.replayHash,
    bundle.readiness.result.readinessHash,
    bundle.alignment.result.alignmentHash,
    bundle.reviewPacket.result.packetHash,
    bundle.replayFramework.result.replayHash,
    bundle.readinessCertification.result.certificationHash,
  ]);
}

function validateTenantId(request: DependencyObservabilityRequest, reasons: DependencyObservabilityReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DependencyObservabilityScope, reasons: DependencyObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OBSERVABILITY_SCOPE_VALID" : "OBSERVABILITY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const valid = input.foundation.sealed === true
    && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const valid = input.analysis.sealed === true
    && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
    && input.observability.sealed === true
    && input.replay.sealed === true
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

function validateTenantScope(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_VISIBILITY_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateDependencyGraphVisibility(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const visible = input.foundation.dependencies.length > 0
    && input.foundation.evidencePath.dependencyReferences.length > 0
    && input.foundation.result.dependenciesCreated >= input.foundation.dependencies.length;
  addReason(reasons, visible ? "DEPENDENCY_GRAPH_VISIBLE" : "DEPENDENCY_GRAPH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDependencyChainVisibility(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.dependencyChainsDetected >= 0
    && input.analysis.evidencePath.chainReferences.length === input.analysis.result.dependencyChainsDetected;
  addReason(reasons, visible ? "DEPENDENCY_CHAINS_VISIBLE" : "DEPENDENCY_CHAIN_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDependencyLineageVisibility(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const visible = input.foundation.evidencePath.lineageReferences.length > 0
    && orderedBundles(input).every((bundle) => collectLineageReferences(bundle).length > 0 && lineageIntegrity(bundle));
  addReason(reasons, visible ? "DEPENDENCY_LINEAGE_VISIBLE" : "DEPENDENCY_LINEAGE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDependencyReplayVisibility(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): { visible: boolean; degraded: boolean } {
  const corrupted = input.foundation.validation.replayDependenciesValid === false
    || input.replay.result.replayState === "INVALID"
    || input.replay.result.replayState === "ESCALATED"
    || orderedBundles(input).some((bundle) => (
      bundle.replay.result.replayState === "INVALID"
      || bundle.governanceReplay.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "INVALID"
      || bundle.replayFramework.result.replayState === "ESCALATED"
    ));
  const degraded = !corrupted && (
    input.replay.result.replayState === "LIMITED"
    || input.foundation.evidencePath.replayReferences.length === 0
    || orderedBundles(input).some((bundle) => (
      bundle.replayEvidence.replayReferences.length === 0
      || bundle.replay.evidencePath.evidenceIds.length === 0
      || bundle.governanceReplay.evidencePath.replayReferences.length === 0
      || bundle.replayFramework.evidencePath.replayReferences.length === 0
    ))
  );
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  else addReason(reasons, degraded ? "DEPENDENCY_REPLAY_VISIBILITY_MISSING" : "DEPENDENCY_REPLAY_VISIBLE");
  return { visible: !corrupted && !degraded, degraded };
}

function validateDependencyConflictVisibility(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.dependencyConflictsDetected >= 0
    && input.analysis.evidencePath.conflictReferences.length === input.analysis.result.dependencyConflictsDetected;
  addReason(reasons, visible ? "DEPENDENCY_CONFLICTS_VISIBLE" : "DEPENDENCY_CONFLICT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDependencyAuditVisibility(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input).every((bundle) => (
    bundle.audit.result.exportState === "EXPORTED"
    && bundle.observabilityCertification.result.certificationState === "PASS"
    && bundle.readinessCertification.result.certificationState !== "FAIL"
    && bundle.governanceCertification.result.certificationState !== "FAIL"
  ));
  addReason(reasons, visible ? "DEPENDENCY_AUDIT_VISIBLE" : "DEPENDENCY_AUDIT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateGovernanceVisibility(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): { visible: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.governanceDependenciesValid === false
    || input.certification.result.governanceCertified === false
    || orderedBundles(input).some((bundle) => !governanceIntegrity(bundle));
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
  dependencyGraphVisible: boolean,
  dependencyChainsVisible: boolean,
  dependencyLineageVisible: boolean,
  dependencyConflictsVisible: boolean,
  dependencyAuditVisible: boolean,
  reasons: DependencyObservabilityReasonCode[],
): boolean {
  const complete = dependencyGraphVisible
    && dependencyChainsVisible
    && dependencyLineageVisible
    && dependencyConflictsVisible
    && dependencyAuditVisible;
  addReason(reasons, complete ? "VISIBILITY_EVIDENCE_COMPLETE" : "VISIBILITY_EVIDENCE_MISSING");
  return complete;
}

function validateBoundary(input: DependencyObservabilityInput, reasons: DependencyObservabilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = orderedBundles(input).every((bundle) => {
    const records = [
      input.foundation,
      input.analysis,
      input.portfolio,
      input.relationshipAnalysis,
      input.observability,
      input.replay,
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
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  const invalidBoundary = !executionImpossible
    || input.workflowRoutingRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
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

export function createDependencyObservabilityEvidencePath(input: DependencyObservabilityInput): DependencyObservabilityEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.observabilityScope,
    dependencyReferences: normalizeStrings([
      ...input.foundation.evidencePath.dependencyReferences,
      ...input.analysis.evidencePath.dependencyReferences,
    ]),
    chainReferences: normalizeStrings(input.analysis.evidencePath.chainReferences),
    conflictReferences: normalizeStrings(input.analysis.evidencePath.conflictReferences),
    lineageReferences: normalizeStrings([
      ...input.foundation.evidencePath.lineageReferences,
      ...bundles.flatMap(collectLineageReferences),
    ]),
    replayReferences: normalizeStrings([
      ...input.foundation.evidencePath.replayReferences,
      ...bundles.flatMap(collectReplayReferences),
    ]),
    governanceReferences: normalizeStrings([
      ...input.foundation.evidencePath.governanceReferences,
      ...bundles.flatMap(collectGovernanceReferences),
    ]),
    auditReferences: normalizeStrings(bundles.flatMap(collectAuditReferences)),
    evidenceHashes: normalizeStrings([
      input.foundation.result.dependencyGraphHash,
      input.analysis.result.analysisHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.certification.result.certificationHash,
      ...bundles.flatMap(collectEvidenceHashes),
      ...input.foundation.dependencies.map((dependency) => dependency.dependencyHash),
    ]),
  });
}

function validateLimits(
  dependencyCount: number,
  visibleChainCount: number,
  visibleConflictCount: number,
  visibleReplayReferenceCount: number,
  reasons: DependencyObservabilityReasonCode[],
): boolean {
  const valid = dependencyCount <= MAX_DEPENDENCIES
    && visibleChainCount <= MAX_VISIBLE_CHAINS
    && visibleConflictCount <= MAX_VISIBLE_CONFLICTS
    && visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES;
  addReason(reasons, dependencyCount <= MAX_DEPENDENCIES ? "DEPENDENCY_LIMIT_VALID" : "DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, visibleChainCount <= MAX_VISIBLE_CHAINS ? "VISIBLE_CHAIN_LIMIT_VALID" : "VISIBLE_CHAIN_LIMIT_EXCEEDED");
  addReason(reasons, visibleConflictCount <= MAX_VISIBLE_CONFLICTS ? "VISIBLE_CONFLICT_LIMIT_VALID" : "VISIBLE_CONFLICT_LIMIT_EXCEEDED");
  addReason(reasons, visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES ? "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID" : "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyObservabilityRequest,
  observabilityState: DependencyObservabilityResult["observabilityState"],
  dependencyGraphVisible: boolean,
  dependencyChainsVisible: boolean,
  dependencyLineageVisible: boolean,
  dependencyReplayVisible: boolean,
  dependencyConflictsVisible: boolean,
  dependencyAuditVisible: boolean,
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): DependencyObservabilityResult {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityState,
    dependencyGraphVisible,
    dependencyChainsVisible,
    dependencyLineageVisible,
    dependencyReplayVisible,
    dependencyConflictsVisible,
    dependencyAuditVisible,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyObservabilityResult): DependencyObservabilityObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    observabilityState: result.observabilityState,
    dependencyGraphVisible: result.dependencyGraphVisible,
    dependencyChainsVisible: result.dependencyChainsVisible,
    dependencyLineageVisible: result.dependencyLineageVisible,
    dependencyReplayVisible: result.dependencyReplayVisible,
    dependencyConflictsVisible: result.dependencyConflictsVisible,
    dependencyAuditVisible: result.dependencyAuditVisible,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  observabilityState: DependencyObservabilityResult["observabilityState"],
  reasonCodes: readonly DependencyObservabilityReasonCode[],
  dependencyGraphVisible: boolean,
  dependencyChainsVisible: boolean,
  dependencyLineageVisible: boolean,
  dependencyReplayVisible: boolean,
  dependencyConflictsVisible: boolean,
  dependencyAuditVisible: boolean,
  governanceVisible: boolean,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    visibleChainCount: number;
    visibleConflictCount: number;
    visibleReplayReferenceCount: number;
  }>,
): DependencyObservabilityValidation {
  return Object.freeze({
    valid: observabilityState !== "INVALID",
    observabilityState,
    reasonCodes: [...reasonCodes],
    dependencyGraphVisible,
    dependencyChainsVisible,
    dependencyLineageVisible,
    dependencyReplayVisible,
    dependencyConflictsVisible,
    dependencyAuditVisible,
    governanceVisible,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    visibleChainCount: counts.visibleChainCount,
    visibleConflictCount: counts.visibleConflictCount,
    visibleReplayReferenceCount: counts.visibleReplayReferenceCount,
  });
}

export function buildDependencyObservabilityRequest(request: DependencyObservabilityRequest): DependencyObservabilityRequest {
  return requestCore(request);
}

export function sealDependencyObservability(input: DependencyObservabilityInput): SealedDependencyObservabilityRecord {
  const reasons: DependencyObservabilityReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.observabilityScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const dependencyGraphVisible = validateDependencyGraphVisibility(input, reasons);
  const dependencyChainsVisible = validateDependencyChainVisibility(input, reasons);
  const dependencyLineageVisible = validateDependencyLineageVisibility(input, reasons);
  const replayValidation = validateDependencyReplayVisibility(input, reasons);
  const dependencyConflictsVisible = validateDependencyConflictVisibility(input, reasons);
  const dependencyAuditVisible = validateDependencyAuditVisibility(input, reasons);
  const governanceValidation = validateGovernanceVisibility(input, reasons);
  const visibilityEvidenceComplete = validateVisibilityEvidence(
    dependencyGraphVisible,
    dependencyChainsVisible,
    dependencyLineageVisible,
    dependencyConflictsVisible,
    dependencyAuditVisible,
    reasons,
  );
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyObservabilityEvidencePath(input);
  const counts = Object.freeze({
    visibleChainCount: evidencePath.chainReferences.length,
    visibleConflictCount: evidencePath.conflictReferences.length,
    visibleReplayReferenceCount: evidencePath.replayReferences.length,
  });
  const limitsValid = validateLimits(
    input.foundation.dependencies.length,
    counts.visibleChainCount,
    counts.visibleConflictCount,
    counts.visibleReplayReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_OBSERVABILITY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !analysisValid
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

  const observabilityHash = hashObservabilityValue("dependency-observability-layer", {
    request: requestCore(input.request),
    dependencyGraphHash: input.foundation.result.dependencyGraphHash,
    analysisHash: input.analysis.result.analysisHash,
    observabilityState,
    dependencyReferences: evidencePath.dependencyReferences,
    chainReferences: evidencePath.chainReferences,
    conflictReferences: evidencePath.conflictReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    observabilityState,
    dependencyGraphVisible,
    dependencyChainsVisible,
    dependencyLineageVisible,
    replayValidation.visible,
    dependencyConflictsVisible,
    dependencyAuditVisible,
    tenantIsolationVerified,
    observabilityHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    observabilityState,
    reasons,
    dependencyGraphVisible,
    dependencyChainsVisible,
    dependencyLineageVisible,
    replayValidation.visible,
    dependencyConflictsVisible,
    dependencyAuditVisible,
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
    recommendationApprovalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
