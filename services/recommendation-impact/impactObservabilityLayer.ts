import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ImpactObservabilityEvidencePath,
  ImpactObservabilityInput,
  ImpactObservabilityObservability,
  ImpactObservabilityReasonCode,
  ImpactObservabilityRequest,
  ImpactObservabilityResult,
  ImpactObservabilityScope,
  ImpactObservabilityValidation,
  SealedImpactObservabilityRecord,
} from "./types";

const MAX_IMPACTS = 50_000;
const MAX_VISIBLE_CHAINS = 25_000;
const MAX_VISIBLE_PROPAGATION_PATHS = 25_000;
const MAX_VISIBLE_CONFLICTS = 10_000;
const MAX_VISIBLE_REPLAY_REFERENCES = 10_000;

const OBSERVABILITY_SCOPES: readonly ImpactObservabilityScope[] = Object.freeze([
  "SUMMARY",
  "CHAINS",
  "PROPAGATION",
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

function addReason(reasons: ImpactObservabilityReasonCode[], reason: ImpactObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ImpactObservabilityRequest): ImpactObservabilityRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityScope: request.observabilityScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: ImpactObservabilityInput): RecommendationPortfolioBundle[] {
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

function lineageIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.lineage.result.reconstructionState !== "INVALID"
    && bundle.lineage.result.lineageIntegrity
    && bundle.integrity.result.lineageIntegrity;
}

function replayIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.replay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED";
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

function collectAuditReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.lineageReferences,
    bundle.audit.result.exportHash,
    bundle.certification.result.certificationHash,
    bundle.governanceCertification.result.certificationHash,
    bundle.readinessCertification.result.certificationHash,
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

function validateTenantId(request: ImpactObservabilityRequest, reasons: ImpactObservabilityReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: ImpactObservabilityScope, reasons: ImpactObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OBSERVABILITY_SCOPE_VALID" : "OBSERVABILITY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
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

function validateTenantScope(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_VISIBILITY_BLOCKED");
  return valid;
}

function validateOwnership(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateImpactGraphVisibility(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const visible = input.foundation.impacts.length > 0
    && input.foundation.evidencePath.impactReferences.length > 0
    && input.foundation.result.impactsCreated >= input.foundation.impacts.length;
  addReason(reasons, visible ? "IMPACT_GRAPH_VISIBLE" : "IMPACT_GRAPH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateImpactChainVisibility(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.impactChainsDetected >= 0
    && input.analysis.evidencePath.chainReferences.length === input.analysis.result.impactChainsDetected;
  addReason(reasons, visible ? "IMPACT_CHAINS_VISIBLE" : "IMPACT_CHAIN_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateImpactPropagationVisibility(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.propagationPathsDetected >= 0
    && input.analysis.evidencePath.propagationReferences.length === input.analysis.result.propagationPathsDetected;
  addReason(reasons, visible ? "IMPACT_PROPAGATION_VISIBLE" : "IMPACT_PROPAGATION_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateImpactLineageVisibility(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const visible = input.foundation.evidencePath.lineageReferences.length > 0
    && orderedBundles(input).every((bundle) => collectLineageReferences(bundle).length > 0 && lineageIntegrity(bundle));
  addReason(reasons, visible ? "IMPACT_LINEAGE_VISIBLE" : "IMPACT_LINEAGE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateImpactReplayVisibility(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): { visible: boolean; degraded: boolean } {
  const corrupted = input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || input.portfolioReplay.result.replayState === "INVALID"
    || input.portfolioReplay.result.replayState === "ESCALATED"
    || orderedBundles(input).some((bundle) => !replayIntegrity(bundle));
  const degraded = !corrupted && (
    input.dependencyReplay.result.replayState === "LIMITED"
    || input.portfolioReplay.result.replayState === "LIMITED"
    || input.foundation.evidencePath.replayReferences.length === 0
    || orderedBundles(input).some((bundle) => (
      bundle.replayEvidence.replayReferences.length === 0
      || collectReplayReferences(bundle).length === 0
    ))
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "IMPACT_REPLAY_VISIBLE" : "IMPACT_REPLAY_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  return { visible, degraded };
}

function validateImpactConflictVisibility(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.impactConflictsDetected >= 0
    && input.analysis.evidencePath.conflictReferences.length === input.analysis.result.impactConflictsDetected;
  addReason(reasons, visible ? "IMPACT_CONFLICTS_VISIBLE" : "IMPACT_CONFLICT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateGovernanceVisibility(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): { visible: boolean; degraded: boolean } {
  const corrupted = orderedBundles(input).some((bundle) => !governanceIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.governanceReferences.length === 0
    || orderedBundles(input).some((bundle) => collectGovernanceReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "GOVERNANCE_VISIBLE" : "GOVERNANCE_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  return { visible, degraded };
}

function validateImpactAuditVisibility(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input).every((bundle) => collectAuditReferences(bundle).length > 0)
    && input.foundation.evidencePath.evidenceHashes.length > 0
    && input.analysis.evidencePath.evidenceHashes.length > 0;
  addReason(reasons, visible ? "IMPACT_AUDIT_VISIBLE" : "IMPACT_AUDIT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateVisibilityEvidence(visibleChecks: readonly boolean[], reasons: ImpactObservabilityReasonCode[]): boolean {
  const complete = visibleChecks.every(Boolean);
  addReason(reasons, complete ? "VISIBILITY_EVIDENCE_COMPLETE" : "VISIBILITY_EVIDENCE_MISSING");
  return complete;
}

function validateBoundary(input: ImpactObservabilityInput, reasons: ImpactObservabilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
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
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.approvalRequested === true
      || !authorityBounded
      || input.observabilityMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createImpactObservabilityEvidencePath(input: ImpactObservabilityInput): ImpactObservabilityEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.observabilityScope,
    impactReferences: normalizeStrings(input.foundation.evidencePath.impactReferences),
    chainReferences: normalizeStrings(input.analysis.evidencePath.chainReferences),
    propagationReferences: normalizeStrings(input.analysis.evidencePath.propagationReferences),
    conflictReferences: normalizeStrings(input.analysis.evidencePath.conflictReferences),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    governanceReferences: normalizeStrings(bundles.flatMap(collectGovernanceReferences)),
    auditReferences: normalizeStrings(bundles.flatMap(collectAuditReferences)),
    evidenceHashes: normalizeStrings([
      input.foundation.result.impactGraphHash,
      input.analysis.result.analysisHash,
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
    ]),
  });
}

function validateLimits(
  impactCount: number,
  visibleChainCount: number,
  visiblePropagationCount: number,
  visibleConflictCount: number,
  visibleReplayReferenceCount: number,
  reasons: ImpactObservabilityReasonCode[],
): boolean {
  const valid = impactCount <= MAX_IMPACTS
    && visibleChainCount <= MAX_VISIBLE_CHAINS
    && visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS
    && visibleConflictCount <= MAX_VISIBLE_CONFLICTS
    && visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES;
  addReason(reasons, impactCount <= MAX_IMPACTS ? "IMPACT_LIMIT_VALID" : "IMPACT_LIMIT_EXCEEDED");
  addReason(reasons, visibleChainCount <= MAX_VISIBLE_CHAINS ? "VISIBLE_CHAIN_LIMIT_VALID" : "VISIBLE_CHAIN_LIMIT_EXCEEDED");
  addReason(reasons, visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS ? "VISIBLE_PROPAGATION_LIMIT_VALID" : "VISIBLE_PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, visibleConflictCount <= MAX_VISIBLE_CONFLICTS ? "VISIBLE_CONFLICT_LIMIT_VALID" : "VISIBLE_CONFLICT_LIMIT_EXCEEDED");
  addReason(reasons, visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES ? "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID" : "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ImpactObservabilityRequest,
  observabilityState: ImpactObservabilityResult["observabilityState"],
  visibility: Readonly<{
    impactGraphVisible: boolean;
    impactChainsVisible: boolean;
    impactPropagationVisible: boolean;
    impactLineageVisible: boolean;
    impactGovernanceVisible: boolean;
    impactReplayVisible: boolean;
    impactAuditVisible: boolean;
  }>,
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): ImpactObservabilityResult {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityState,
    ...visibility,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildObservability(result: ImpactObservabilityResult): ImpactObservabilityObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    observabilityState: result.observabilityState,
    impactGraphVisible: result.impactGraphVisible,
    impactChainsVisible: result.impactChainsVisible,
    impactPropagationVisible: result.impactPropagationVisible,
    impactLineageVisible: result.impactLineageVisible,
    impactGovernanceVisible: result.impactGovernanceVisible,
    impactReplayVisible: result.impactReplayVisible,
    impactAuditVisible: result.impactAuditVisible,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  observabilityState: ImpactObservabilityResult["observabilityState"],
  reasonCodes: readonly ImpactObservabilityReasonCode[],
  visibility: Readonly<{
    impactGraphVisible: boolean;
    impactChainsVisible: boolean;
    impactPropagationVisible: boolean;
    impactLineageVisible: boolean;
    impactGovernanceVisible: boolean;
    impactReplayVisible: boolean;
    impactAuditVisible: boolean;
  }>,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    visibleChainCount: number;
    visiblePropagationCount: number;
    visibleConflictCount: number;
    visibleReplayReferenceCount: number;
  }>,
): ImpactObservabilityValidation {
  return Object.freeze({
    valid: observabilityState !== "INVALID",
    observabilityState,
    reasonCodes: [...reasonCodes],
    ...visibility,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildImpactObservabilityRequest(request: ImpactObservabilityRequest): ImpactObservabilityRequest {
  return requestCore(request);
}

export function sealImpactObservability(input: ImpactObservabilityInput): SealedImpactObservabilityRecord {
  const reasons: ImpactObservabilityReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.observabilityScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const impactGraphVisible = validateImpactGraphVisibility(input, reasons);
  const impactChainsVisible = validateImpactChainVisibility(input, reasons);
  const impactPropagationVisible = validateImpactPropagationVisibility(input, reasons);
  const impactLineageVisible = validateImpactLineageVisibility(input, reasons);
  const replayVisibility = validateImpactReplayVisibility(input, reasons);
  const impactConflictsVisible = validateImpactConflictVisibility(input, reasons);
  const governanceVisibility = validateGovernanceVisibility(input, reasons);
  const impactAuditVisible = validateImpactAuditVisibility(input, reasons);
  const visibilityEvidenceComplete = validateVisibilityEvidence([
    impactGraphVisible,
    impactChainsVisible,
    impactPropagationVisible,
    impactLineageVisible,
    impactAuditVisible,
  ], reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createImpactObservabilityEvidencePath(input);
  const counts = Object.freeze({
    visibleChainCount: evidencePath.chainReferences.length,
    visiblePropagationCount: evidencePath.propagationReferences.length,
    visibleConflictCount: evidencePath.conflictReferences.length,
    visibleReplayReferenceCount: evidencePath.replayReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.impactReferences.length,
    counts.visibleChainCount,
    counts.visiblePropagationCount,
    counts.visibleConflictCount,
    counts.visibleReplayReferenceCount,
    reasons,
  );
  addReason(reasons, "IMPACT_OBSERVABILITY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !analysisValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || reasons.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || reasons.includes("REPLAY_CORRUPTION_DETECTED");
  const observe = !invalid && !visibilityEvidenceComplete;
  const limited = !invalid && !observe && (
    !replayVisibility.visible
    || !governanceVisibility.visible
    || replayVisibility.degraded
    || governanceVisibility.degraded
    || !limitsValid
  );
  const observabilityState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "VISIBLE";

  const observabilityHash = hashObservabilityValue("impact-observability-layer", {
    request: requestCore(input.request),
    observabilityState,
    impactReferences: evidencePath.impactReferences,
    chainReferences: evidencePath.chainReferences,
    propagationReferences: evidencePath.propagationReferences,
    conflictReferences: evidencePath.conflictReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const visibility = Object.freeze({
    impactGraphVisible,
    impactChainsVisible,
    impactPropagationVisible,
    impactLineageVisible,
    impactGovernanceVisible: governanceVisibility.visible,
    impactReplayVisible: replayVisibility.visible,
    impactAuditVisible,
  });
  const result = buildResult(
    input.request,
    observabilityState,
    visibility,
    tenantIsolationVerified,
    observabilityHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    observabilityState,
    reasons,
    visibility,
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
    prioritizationAllowed: false,
    approvalAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
