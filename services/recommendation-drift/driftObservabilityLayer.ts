import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DriftObservabilityEvidencePath,
  DriftObservabilityInput,
  DriftObservabilityObservability,
  DriftObservabilityReasonCode,
  DriftObservabilityRequest,
  DriftObservabilityResult,
  DriftObservabilityScope,
  DriftObservabilityValidation,
  SealedDriftObservabilityRecord,
} from "./types";

const MAX_DRIFTS = 50_000;
const MAX_VISIBLE_PROPAGATION_PATHS = 25_000;
const MAX_VISIBLE_CONFLICTS = 10_000;
const MAX_VISIBLE_REPLAY_REFERENCES = 10_000;

const OBSERVABILITY_SCOPES: readonly DriftObservabilityScope[] = Object.freeze([
  "SUMMARY",
  "SEVERITY",
  "PROPAGATION",
  "CONFLICTS",
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

function addReason(reasons: DriftObservabilityReasonCode[], reason: DriftObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DriftObservabilityRequest): DriftObservabilityRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityScope: request.observabilityScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DriftObservabilityInput): RecommendationPortfolioBundle[] {
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

function validateTenantId(request: DriftObservabilityRequest, reasons: DriftObservabilityReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DriftObservabilityScope, reasons: DriftObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OBSERVABILITY_SCOPE_VALID" : "OBSERVABILITY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.impactFoundation.sealed === true
    && input.impactAnalysis.sealed === true
    && input.impactObservability.sealed === true
    && input.impactReplay.sealed === true
    && input.impactCertification.sealed === true
    && input.dependencyFoundation.sealed === true
    && input.dependencyAnalysis.sealed === true
    && input.dependencyObservability.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
    && input.portfolioObservability.sealed === true
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

function validateTenantScope(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
    && input.impactAnalysis.result.tenantIsolationVerified
    && input.impactObservability.result.tenantIsolationVerified
    && input.impactReplay.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyAnalysis.result.tenantIsolationVerified
    && input.dependencyObservability.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.portfolioObservability.result.tenantIsolationVerified
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

function validateOwnership(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateDriftGraphVisibility(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const visible = input.foundation.drifts.length > 0
    && input.foundation.evidencePath.driftReferences.length > 0
    && input.foundation.result.driftsCreated >= input.foundation.drifts.length;
  addReason(reasons, visible ? "DRIFT_GRAPH_VISIBLE" : "DRIFT_GRAPH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDriftSeverityVisibility(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.driftSeveritiesDetected >= 0
    && input.analysis.evidencePath.severityReferences.length === input.analysis.result.driftSeveritiesDetected;
  addReason(reasons, visible ? "DRIFT_SEVERITY_VISIBLE" : "DRIFT_SEVERITY_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDriftPropagationVisibility(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.propagationPathsDetected >= 0
    && input.analysis.evidencePath.propagationReferences.length === input.analysis.result.propagationPathsDetected;
  addReason(reasons, visible ? "DRIFT_PROPAGATION_VISIBLE" : "DRIFT_PROPAGATION_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDriftConflictVisibility(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.driftConflictsDetected >= 0
    && input.analysis.evidencePath.conflictReferences.length === input.analysis.result.driftConflictsDetected;
  addReason(reasons, visible ? "DRIFT_CONFLICTS_VISIBLE" : "DRIFT_CONFLICT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDriftLineageVisibility(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const visible = input.foundation.evidencePath.lineageReferences.length > 0
    && orderedBundles(input).every((bundle) => collectLineageReferences(bundle).length > 0 && lineageIntegrity(bundle));
  addReason(reasons, visible ? "DRIFT_LINEAGE_VISIBLE" : "DRIFT_LINEAGE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateDriftReplayVisibility(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || input.impactReplay.result.replayState === "INVALID"
    || input.impactReplay.result.replayState === "ESCALATED"
    || input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || input.portfolioReplay.result.replayState === "INVALID"
    || input.portfolioReplay.result.replayState === "ESCALATED"
    || orderedBundles(input).some((bundle) => !replayIntegrity(bundle));
  const degraded = !corrupted && (
    input.impactReplay.result.replayState === "LIMITED"
    || input.dependencyReplay.result.replayState === "LIMITED"
    || input.portfolioReplay.result.replayState === "LIMITED"
    || input.foundation.evidencePath.replayReferences.length === 0
    || orderedBundles(input).some((bundle) => (
      bundle.replayEvidence.replayReferences.length === 0
      || collectReplayReferences(bundle).length === 0
    ))
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "DRIFT_REPLAY_VISIBLE" : "DRIFT_REPLAY_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateGovernanceVisibility(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.impactCertification.result.governanceCertified === false
    || input.dependencyCertification.result.governanceCertified === false
    || input.portfolioCertification.result.governanceCertified === false
    || orderedBundles(input).some((bundle) => !governanceIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.governanceReferences.length === 0
    || orderedBundles(input).some((bundle) => collectGovernanceReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "GOVERNANCE_VISIBLE" : "GOVERNANCE_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateDriftAuditVisibility(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input).every((bundle) => collectAuditReferences(bundle).length > 0)
    && input.foundation.evidencePath.evidenceHashes.length > 0
    && input.analysis.evidencePath.evidenceHashes.length > 0;
  addReason(reasons, visible ? "DRIFT_AUDIT_VISIBLE" : "DRIFT_AUDIT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateVisibilityEvidence(visibleChecks: readonly boolean[], reasons: DriftObservabilityReasonCode[]): boolean {
  const complete = visibleChecks.every(Boolean);
  addReason(reasons, complete ? "VISIBILITY_EVIDENCE_COMPLETE" : "VISIBILITY_EVIDENCE_MISSING");
  return complete;
}

function validateBoundary(input: DriftObservabilityInput, reasons: DriftObservabilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const repairAbsent = input.repairRequested !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.impactFoundation.controlSurfacePresent
    && !input.impactAnalysis.controlSurfacePresent
    && !input.impactObservability.controlSurfacePresent
    && !input.impactReplay.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyAnalysis.controlSurfacePresent
    && !input.dependencyObservability.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.portfolio.controlSurfacePresent
    && !input.relationshipAnalysis.controlSurfacePresent
    && !input.portfolioObservability.controlSurfacePresent
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
      || input.approvalRequested === true
      || !repairAbsent
      || !authorityBounded
      || input.observabilityMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDriftObservabilityEvidencePath(input: DriftObservabilityInput): DriftObservabilityEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.observabilityScope,
    driftReferences: normalizeStrings(input.foundation.evidencePath.driftReferences),
    severityReferences: normalizeStrings(input.analysis.evidencePath.severityReferences),
    propagationReferences: normalizeStrings(input.analysis.evidencePath.propagationReferences),
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
      input.foundation.result.driftGraphHash,
      input.analysis.result.analysisHash,
      input.impactFoundation.result.impactGraphHash,
      input.impactAnalysis.result.analysisHash,
      input.impactObservability.result.observabilityHash,
      input.impactReplay.result.replayHash,
      input.impactCertification.result.certificationHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyAnalysis.result.analysisHash,
      input.dependencyObservability.result.observabilityHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioObservability.result.observabilityHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  driftCount: number,
  visiblePropagationCount: number,
  visibleConflictCount: number,
  visibleReplayReferenceCount: number,
  reasons: DriftObservabilityReasonCode[],
): boolean {
  const valid = driftCount <= MAX_DRIFTS
    && visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS
    && visibleConflictCount <= MAX_VISIBLE_CONFLICTS
    && visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES;
  addReason(reasons, driftCount <= MAX_DRIFTS ? "DRIFT_LIMIT_VALID" : "DRIFT_LIMIT_EXCEEDED");
  addReason(reasons, visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS ? "VISIBLE_PROPAGATION_LIMIT_VALID" : "VISIBLE_PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, visibleConflictCount <= MAX_VISIBLE_CONFLICTS ? "VISIBLE_CONFLICT_LIMIT_VALID" : "VISIBLE_CONFLICT_LIMIT_EXCEEDED");
  addReason(reasons, visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES ? "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID" : "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DriftObservabilityRequest,
  observabilityState: DriftObservabilityResult["observabilityState"],
  visibility: Readonly<{
    driftGraphVisible: boolean;
    driftSeverityVisible: boolean;
    driftPropagationVisible: boolean;
    driftLineageVisible: boolean;
    driftGovernanceVisible: boolean;
    driftReplayVisible: boolean;
    driftAuditVisible: boolean;
  }>,
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): DriftObservabilityResult {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityState,
    ...visibility,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildObservability(result: DriftObservabilityResult): DriftObservabilityObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    observabilityState: result.observabilityState,
    driftGraphVisible: result.driftGraphVisible,
    driftSeverityVisible: result.driftSeverityVisible,
    driftPropagationVisible: result.driftPropagationVisible,
    driftLineageVisible: result.driftLineageVisible,
    driftGovernanceVisible: result.driftGovernanceVisible,
    driftReplayVisible: result.driftReplayVisible,
    driftAuditVisible: result.driftAuditVisible,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  observabilityState: DriftObservabilityResult["observabilityState"],
  reasonCodes: readonly DriftObservabilityReasonCode[],
  visibility: Readonly<{
    driftGraphVisible: boolean;
    driftSeverityVisible: boolean;
    driftPropagationVisible: boolean;
    driftConflictsVisible: boolean;
    driftLineageVisible: boolean;
    driftGovernanceVisible: boolean;
    driftReplayVisible: boolean;
    driftAuditVisible: boolean;
  }>,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    visiblePropagationCount: number;
    visibleConflictCount: number;
    visibleReplayReferenceCount: number;
  }>,
): DriftObservabilityValidation {
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

export function buildDriftObservabilityRequest(request: DriftObservabilityRequest): DriftObservabilityRequest {
  return requestCore(request);
}

export function sealDriftObservability(input: DriftObservabilityInput): SealedDriftObservabilityRecord {
  const reasons: DriftObservabilityReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.observabilityScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const driftGraphVisible = validateDriftGraphVisibility(input, reasons);
  const driftSeverityVisible = validateDriftSeverityVisibility(input, reasons);
  const driftPropagationVisible = validateDriftPropagationVisibility(input, reasons);
  const driftConflictsVisible = validateDriftConflictVisibility(input, reasons);
  const driftLineageVisible = validateDriftLineageVisibility(input, reasons);
  const replayVisibility = validateDriftReplayVisibility(input, reasons);
  const governanceVisibility = validateGovernanceVisibility(input, reasons);
  const driftAuditVisible = validateDriftAuditVisibility(input, reasons);
  const visibilityEvidenceComplete = validateVisibilityEvidence([
    driftGraphVisible,
    driftSeverityVisible,
    driftPropagationVisible,
    driftConflictsVisible,
    driftLineageVisible,
    driftAuditVisible,
  ], reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDriftObservabilityEvidencePath(input);
  const counts = Object.freeze({
    visiblePropagationCount: evidencePath.propagationReferences.length,
    visibleConflictCount: evidencePath.conflictReferences.length,
    visibleReplayReferenceCount: evidencePath.replayReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.driftReferences.length,
    counts.visiblePropagationCount,
    counts.visibleConflictCount,
    counts.visibleReplayReferenceCount,
    reasons,
  );
  addReason(reasons, "DRIFT_OBSERVABILITY_IS_NOT_CONTROL");

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

  const observabilityHash = hashObservabilityValue("drift-observability-layer", {
    request: requestCore(input.request),
    observabilityState,
    driftReferences: evidencePath.driftReferences,
    severityReferences: evidencePath.severityReferences,
    propagationReferences: evidencePath.propagationReferences,
    conflictReferences: evidencePath.conflictReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const visibility = Object.freeze({
    driftGraphVisible,
    driftSeverityVisible,
    driftPropagationVisible,
    driftConflictsVisible,
    driftLineageVisible,
    driftGovernanceVisible: governanceVisibility.visible,
    driftReplayVisible: replayVisibility.visible,
    driftAuditVisible,
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
    repairAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
