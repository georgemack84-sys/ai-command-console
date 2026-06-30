import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ResilienceObservabilityEvidencePath,
  ResilienceObservabilityInput,
  ResilienceObservabilityObservability,
  ResilienceObservabilityReasonCode,
  ResilienceObservabilityRequest,
  ResilienceObservabilityResult,
  ResilienceObservabilityScope,
  ResilienceObservabilityValidation,
  SealedResilienceObservabilityRecord,
} from "./types";

const MAX_RESILIENCE_RECORDS = 50_000;
const MAX_VISIBLE_PROPAGATION_PATHS = 25_000;
const MAX_VISIBLE_FAILURES = 10_000;
const MAX_VISIBLE_REPLAY_REFERENCES = 10_000;

const OBSERVABILITY_SCOPES: readonly ResilienceObservabilityScope[] = Object.freeze([
  "SUMMARY",
  "STRENGTH",
  "PROPAGATION",
  "FAILURES",
  "LINEAGE",
  "REPLAY",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  repairAbsent: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: ResilienceObservabilityReasonCode[], reason: ResilienceObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ResilienceObservabilityRequest): ResilienceObservabilityRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityScope: request.observabilityScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(bundles: readonly RecommendationPortfolioBundle[]): RecommendationPortfolioBundle[] {
  return [...bundles].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
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
    "repairAllowed",
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
    ...bundle.audit.evidencePath.lineageReferences,
    ...bundle.readinessCertification.evidencePath.lineageReferences,
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

function collectAuditReferences(bundle: RecommendationPortfolioBundle): string[] {
  return normalizeStrings([
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.lineageReferences,
    bundle.audit.result.exportHash,
    bundle.certification.result.certificationHash,
    bundle.observabilityCertification.result.certificationHash,
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

function validateTenantId(request: ResilienceObservabilityRequest, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: ResilienceObservabilityScope, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OBSERVABILITY_SCOPE_VALID" : "OBSERVABILITY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.impactCertification.sealed === true
    && input.dependencyCertification.sealed === true
    && input.portfolioCertification.sealed === true
    && orderedBundles(input.recommendations).every((bundle) => [
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
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.portfolioCertification.result.tenantIsolationVerified
    && orderedBundles(input.recommendations).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_VISIBILITY_BLOCKED");
  return valid;
}

function validateOwnership(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input.recommendations).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateResilienceGraphVisibility(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const visible = input.foundation.resiliences.length > 0
    && input.foundation.evidencePath.resilienceReferences.length === input.foundation.resiliences.length
    && input.foundation.result.resilienceRecordsCreated === input.foundation.resiliences.length;
  addReason(reasons, visible ? "RESILIENCE_GRAPH_VISIBLE" : "RESILIENCE_GRAPH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateResilienceStrengthVisibility(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const visible = input.analysis.strengths.length > 0
    && input.analysis.evidencePath.strengthReferences.length === input.analysis.result.resilienceStrengthsDetected;
  addReason(reasons, visible ? "RESILIENCE_STRENGTH_VISIBLE" : "RESILIENCE_STRENGTH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateResiliencePropagationVisibility(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.resiliencePropagationsDetected > 0
    && input.analysis.evidencePath.propagationReferences.length > 0
    && input.analysis.evidencePath.propagationReferences.length <= input.analysis.result.resiliencePropagationsDetected;
  addReason(reasons, visible ? "RESILIENCE_PROPAGATION_VISIBLE" : "RESILIENCE_PROPAGATION_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateResilienceFailureVisibility(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.resilienceFailuresDetected >= 0
    && input.analysis.evidencePath.failureReferences.length === input.analysis.result.resilienceFailuresDetected;
  addReason(reasons, visible ? "RESILIENCE_FAILURES_VISIBLE" : "RESILIENCE_FAILURE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateResilienceLineageVisibility(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const visible = input.foundation.evidencePath.lineageReferences.length > 0
    && orderedBundles(input.recommendations).every((bundle) => collectLineageReferences(bundle).length > 0 && lineageIntegrity(bundle));
  addReason(reasons, visible ? "RESILIENCE_LINEAGE_VISIBLE" : "RESILIENCE_LINEAGE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateResilienceReplayVisibility(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || orderedBundles(input.recommendations).some((bundle) => !replayIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.replayReferences.length === 0
    || input.trustReplay.result.replayState === "LIMITED"
    || input.driftReplay.result.replayState === "LIMITED"
    || orderedBundles(input.recommendations).some((bundle) => collectReplayReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "RESILIENCE_REPLAY_VISIBLE" : "RESILIENCE_REPLAY_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateGovernanceVisibility(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || orderedBundles(input.recommendations).some((bundle) => !governanceIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.governanceReferences.length === 0
    || orderedBundles(input.recommendations).some((bundle) => collectGovernanceReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "GOVERNANCE_VISIBLE" : "GOVERNANCE_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateResilienceAuditVisibility(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input.recommendations).every((bundle) => collectAuditReferences(bundle).length > 0)
    && input.foundation.evidencePath.evidenceHashes.length > 0
    && input.analysis.evidencePath.evidenceHashes.length > 0;
  addReason(reasons, visible ? "RESILIENCE_AUDIT_VISIBLE" : "RESILIENCE_AUDIT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateVisibilityEvidence(checks: readonly boolean[], reasons: ResilienceObservabilityReasonCode[]): boolean {
  const complete = checks.every(Boolean);
  addReason(reasons, complete ? "VISIBILITY_EVIDENCE_COMPLETE" : "VISIBILITY_EVIDENCE_MISSING");
  return complete;
}

function validateBoundary(input: ResilienceObservabilityInput, reasons: ResilienceObservabilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const repairAbsent = input.repairRequested !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.portfolioCertification.controlSurfacePresent
    && orderedBundles(input.recommendations).every((bundle) => [
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
  addReason(reasons, repairAbsent ? "REPAIR_ABSENT" : "REPAIR_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    repairAbsent,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !repairAbsent
      || !authorityBounded
      || input.observabilityMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createResilienceObservabilityEvidencePath(input: ResilienceObservabilityInput): ResilienceObservabilityEvidencePath {
  const bundles = orderedBundles(input.recommendations);
  return Object.freeze({
    scope: input.request.observabilityScope,
    resilienceReferences: normalizeStrings(input.foundation.evidencePath.resilienceReferences),
    strengthReferences: normalizeStrings(input.analysis.evidencePath.strengthReferences),
    propagationReferences: normalizeStrings(input.analysis.evidencePath.propagationReferences),
    concentrationReferences: normalizeStrings(input.analysis.evidencePath.concentrationReferences),
    gapReferences: normalizeStrings(input.analysis.evidencePath.gapReferences),
    failureReferences: normalizeStrings(input.analysis.evidencePath.failureReferences),
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
      input.foundation.result.resilienceGraphHash,
      input.analysis.result.analysisHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.dependencyCertification.result.certificationHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  resilienceRecordCount: number,
  visiblePropagationCount: number,
  visibleFailureCount: number,
  visibleReplayReferenceCount: number,
  reasons: ResilienceObservabilityReasonCode[],
): boolean {
  const valid = resilienceRecordCount <= MAX_RESILIENCE_RECORDS
    && visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS
    && visibleFailureCount <= MAX_VISIBLE_FAILURES
    && visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES;
  addReason(reasons, resilienceRecordCount <= MAX_RESILIENCE_RECORDS ? "RESILIENCE_RECORD_LIMIT_VALID" : "RESILIENCE_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS ? "VISIBLE_PROPAGATION_LIMIT_VALID" : "VISIBLE_PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, visibleFailureCount <= MAX_VISIBLE_FAILURES ? "VISIBLE_FAILURE_LIMIT_VALID" : "VISIBLE_FAILURE_LIMIT_EXCEEDED");
  addReason(reasons, visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES ? "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID" : "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ResilienceObservabilityRequest,
  observabilityState: ResilienceObservabilityResult["observabilityState"],
  visibility: Readonly<{
    resilienceGraphVisible: boolean;
    resilienceStrengthVisible: boolean;
    resiliencePropagationVisible: boolean;
    resilienceLineageVisible: boolean;
    resilienceGovernanceVisible: boolean;
    resilienceReplayVisible: boolean;
    resilienceAuditVisible: boolean;
  }>,
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): ResilienceObservabilityResult {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityState,
    ...visibility,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildObservability(result: ResilienceObservabilityResult): ResilienceObservabilityObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    observabilityState: result.observabilityState,
    resilienceGraphVisible: result.resilienceGraphVisible,
    resilienceStrengthVisible: result.resilienceStrengthVisible,
    resiliencePropagationVisible: result.resiliencePropagationVisible,
    resilienceLineageVisible: result.resilienceLineageVisible,
    resilienceGovernanceVisible: result.resilienceGovernanceVisible,
    resilienceReplayVisible: result.resilienceReplayVisible,
    resilienceAuditVisible: result.resilienceAuditVisible,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  observabilityState: ResilienceObservabilityResult["observabilityState"],
  reasonCodes: readonly ResilienceObservabilityReasonCode[],
  visibility: Readonly<{
    resilienceGraphVisible: boolean;
    resilienceStrengthVisible: boolean;
    resiliencePropagationVisible: boolean;
    resilienceFailuresVisible: boolean;
    resilienceLineageVisible: boolean;
    resilienceGovernanceVisible: boolean;
    resilienceReplayVisible: boolean;
    resilienceAuditVisible: boolean;
  }>,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    visiblePropagationCount: number;
    visibleFailureCount: number;
    visibleReplayReferenceCount: number;
  }>,
): ResilienceObservabilityValidation {
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
    repairAbsent: boundary.repairAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildResilienceObservabilityRequest(request: ResilienceObservabilityRequest): ResilienceObservabilityRequest {
  return requestCore(request);
}

export function sealResilienceObservability(input: ResilienceObservabilityInput): SealedResilienceObservabilityRecord {
  const reasons: ResilienceObservabilityReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.observabilityScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const resilienceGraphVisible = validateResilienceGraphVisibility(input, reasons);
  const resilienceStrengthVisible = validateResilienceStrengthVisibility(input, reasons);
  const resiliencePropagationVisible = validateResiliencePropagationVisibility(input, reasons);
  const resilienceFailuresVisible = validateResilienceFailureVisibility(input, reasons);
  const resilienceLineageVisible = validateResilienceLineageVisibility(input, reasons);
  const replayVisibility = validateResilienceReplayVisibility(input, reasons);
  const governanceVisibility = validateGovernanceVisibility(input, reasons);
  const resilienceAuditVisible = validateResilienceAuditVisibility(input, reasons);
  const visibilityEvidenceComplete = validateVisibilityEvidence([
    resilienceGraphVisible,
    resilienceStrengthVisible,
    resiliencePropagationVisible,
    resilienceFailuresVisible,
    resilienceLineageVisible,
    resilienceAuditVisible,
  ], reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createResilienceObservabilityEvidencePath(input);
  const counts = Object.freeze({
    visiblePropagationCount: evidencePath.propagationReferences.length,
    visibleFailureCount: evidencePath.failureReferences.length,
    visibleReplayReferenceCount: evidencePath.replayReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.resilienceReferences.length,
    counts.visiblePropagationCount,
    counts.visibleFailureCount,
    counts.visibleReplayReferenceCount,
    reasons,
  );
  addReason(reasons, "RESILIENCE_OBSERVABILITY_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !analysisValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || boundary.invalidBoundary
    || governanceVisibility.corrupted
    || replayVisibility.corrupted;
  const observe = !invalid && !visibilityEvidenceComplete;
  const limited = !invalid && !observe && (
    !replayVisibility.visible
    || !governanceVisibility.visible
    || replayVisibility.degraded
    || governanceVisibility.degraded
    || !limitsValid
  );
  const observabilityState = invalid ? "INVALID" : observe ? "OBSERVE" : limited ? "LIMITED" : "VISIBLE";

  const observabilityHash = hashObservabilityValue("resilience-observability-layer", {
    request: requestCore(input.request),
    observabilityState,
    resilienceReferences: evidencePath.resilienceReferences,
    strengthReferences: evidencePath.strengthReferences,
    propagationReferences: evidencePath.propagationReferences,
    concentrationReferences: evidencePath.concentrationReferences,
    gapReferences: evidencePath.gapReferences,
    failureReferences: evidencePath.failureReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const visibility = Object.freeze({
    resilienceGraphVisible,
    resilienceStrengthVisible,
    resiliencePropagationVisible,
    resilienceFailuresVisible,
    resilienceLineageVisible,
    resilienceGovernanceVisible: governanceVisibility.visible,
    resilienceReplayVisible: replayVisibility.visible,
    resilienceAuditVisible,
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
    recommendationRankingAllowed: false,
    approvalAllowed: false,
    repairAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
