import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyRiskObservabilityEvidencePath,
  DependencyRiskObservabilityInput,
  DependencyRiskObservabilityObservability,
  DependencyRiskObservabilityReasonCode,
  DependencyRiskObservabilityRequest,
  DependencyRiskObservabilityResult,
  DependencyRiskObservabilityScope,
  DependencyRiskObservabilityValidation,
  SealedDependencyRiskObservabilityRecord,
} from "./types";

const MAX_DEPENDENCY_RISK_RECORDS = 50_000;
const MAX_VISIBLE_PROPAGATION_PATHS = 25_000;
const MAX_VISIBLE_CONFLICTS = 10_000;
const MAX_VISIBLE_REPLAY_REFERENCES = 10_000;

const OBSERVABILITY_SCOPES: readonly DependencyRiskObservabilityScope[] = Object.freeze([
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
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DependencyRiskObservabilityReasonCode[], reason: DependencyRiskObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyRiskObservabilityRequest): DependencyRiskObservabilityRequest {
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

function validateTenantId(request: DependencyRiskObservabilityRequest, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: DependencyRiskObservabilityScope, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OBSERVABILITY_SCOPE_VALID" : "OBSERVABILITY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, input.analysis.sealed === true ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.dependencyReplay.sealed === true
    && input.dependencyCertification.sealed === true
    && input.trustReplay.sealed === true
    && input.trustCertification.sealed === true
    && input.driftReplay.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceReplay.sealed === true
    && input.resilienceCertification.sealed === true
    && input.impactCertification.sealed === true
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
  addReason(reasons, input.dependencyReplay.sealed === true ? "DEPENDENCY_REPLAY_REQUIRED" : "DEPENDENCY_REPLAY_UNSEALED");
  addReason(reasons, input.dependencyCertification.sealed === true ? "DEPENDENCY_CERTIFICATION_REQUIRED" : "DEPENDENCY_CERTIFICATION_UNSEALED");
  addReason(reasons, input.trustReplay.sealed === true ? "TRUST_REPLAY_REQUIRED" : "TRUST_REPLAY_UNSEALED");
  addReason(reasons, input.trustCertification.sealed === true ? "TRUST_CERTIFICATION_REQUIRED" : "TRUST_CERTIFICATION_UNSEALED");
  addReason(reasons, input.driftReplay.sealed === true ? "DRIFT_REPLAY_REQUIRED" : "DRIFT_REPLAY_UNSEALED");
  addReason(reasons, input.driftCertification.sealed === true ? "DRIFT_CERTIFICATION_REQUIRED" : "DRIFT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.resilienceReplay.sealed === true ? "RESILIENCE_REPLAY_REQUIRED" : "RESILIENCE_REPLAY_UNSEALED");
  addReason(reasons, input.resilienceCertification.sealed === true ? "RESILIENCE_CERTIFICATION_REQUIRED" : "RESILIENCE_CERTIFICATION_UNSEALED");
  addReason(reasons, input.impactCertification.sealed === true ? "IMPACT_CERTIFICATION_REQUIRED" : "IMPACT_CERTIFICATION_UNSEALED");
  addReason(reasons, input.portfolioCertification.sealed === true ? "PORTFOLIO_CERTIFICATION_REQUIRED" : "PORTFOLIO_CERTIFICATION_UNSEALED");
  addReason(reasons, sealed ? "SEALED_ARTIFACTS_VERIFIED" : "UNSEALED_ARTIFACTS_BLOCKED");
  return sealed;
}

function validateTenantScope(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.dependencyReplay.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.trustReplay.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftReplay.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceReplay.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
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

function validateOwnership(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input.recommendations).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateDependencyRiskGraphVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const visible = input.foundation.risks.length > 0
    && input.foundation.evidencePath.dependencyRiskReferences.length === input.foundation.risks.length
    && input.foundation.result.dependencyRiskRecordsCreated === input.foundation.risks.length;
  addReason(reasons, visible ? "DEPENDENCY_RISK_GRAPH_VISIBLE" : "DEPENDENCY_RISK_GRAPH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateSeverityVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const visible = input.analysis.severities.length > 0
    && input.analysis.evidencePath.severityReferences.length === input.analysis.result.riskSeveritiesDetected;
  addReason(reasons, visible ? "SEVERITY_VISIBLE" : "SEVERITY_VISIBILITY_INCOMPLETE");
  return visible;
}

function validatePropagationVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.riskPropagationsDetected > 0
    && input.analysis.evidencePath.propagationReferences.length > 0
    && input.analysis.evidencePath.propagationReferences.length <= input.analysis.result.riskPropagationsDetected;
  addReason(reasons, visible ? "PROPAGATION_VISIBLE" : "PROPAGATION_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateConcentrationVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.riskConcentrationsDetected >= 0
    && input.analysis.evidencePath.concentrationReferences.length === input.analysis.result.riskConcentrationsDetected;
  addReason(reasons, visible ? "CONCENTRATION_VISIBLE" : "CONCENTRATION_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateGapVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.riskGapsDetected >= 0
    && input.analysis.evidencePath.gapReferences.length === input.analysis.result.riskGapsDetected;
  addReason(reasons, visible ? "GAPS_VISIBLE" : "GAP_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateConflictVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.riskConflictsDetected >= 0
    && input.analysis.evidencePath.conflictReferences.length === input.analysis.result.riskConflictsDetected;
  addReason(reasons, visible ? "CONFLICTS_VISIBLE" : "CONFLICT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateLineageVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input.recommendations).every((bundle) => collectLineageReferences(bundle).length > 0 && lineageIntegrity(bundle));
  addReason(reasons, visible ? "LINEAGE_VISIBLE" : "LINEAGE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateReplayVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || orderedBundles(input.recommendations).some((bundle) => !replayIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.replayReferences.length === 0
    || input.dependencyReplay.result.replayState === "LIMITED"
    || input.trustReplay.result.replayState === "LIMITED"
    || input.driftReplay.result.replayState === "LIMITED"
    || input.resilienceReplay.result.replayState === "LIMITED"
    || orderedBundles(input.recommendations).some((bundle) => collectReplayReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "REPLAY_VISIBLE" : "REPLAY_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateGovernanceVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
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

function validateAuditVisibility(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input.recommendations).every((bundle) => collectAuditReferences(bundle).length > 0)
    && input.foundation.evidencePath.evidenceHashes.length > 0
    && input.analysis.evidencePath.evidenceHashes.length > 0;
  addReason(reasons, visible ? "AUDIT_VISIBLE" : "AUDIT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateVisibilityEvidence(checks: readonly boolean[], reasons: DependencyRiskObservabilityReasonCode[]): boolean {
  const complete = checks.every(Boolean);
  addReason(reasons, complete ? "VISIBILITY_EVIDENCE_COMPLETE" : "VISIBILITY_EVIDENCE_MISSING");
  return complete;
}

function validateBoundary(input: DependencyRiskObservabilityInput, reasons: DependencyRiskObservabilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.dependencyReplay.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.trustReplay.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftReplay.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceReplay.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
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
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.recommendationRankingRequested === true
      || input.approvalRequested === true
      || !authorityBounded
      || input.observabilityMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyRiskObservabilityEvidencePath(input: DependencyRiskObservabilityInput): DependencyRiskObservabilityEvidencePath {
  const bundles = orderedBundles(input.recommendations);
  return Object.freeze({
    scope: input.request.observabilityScope,
    dependencyRiskReferences: normalizeStrings(input.foundation.evidencePath.dependencyRiskReferences),
    severityReferences: normalizeStrings(input.analysis.evidencePath.severityReferences),
    propagationReferences: normalizeStrings(input.analysis.evidencePath.propagationReferences),
    concentrationReferences: normalizeStrings(input.analysis.evidencePath.concentrationReferences),
    gapReferences: normalizeStrings(input.analysis.evidencePath.gapReferences),
    conflictReferences: normalizeStrings(input.analysis.evidencePath.conflictReferences),
    lineageReferences: normalizeStrings([
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
      input.foundation.result.dependencyRiskGraphHash,
      input.analysis.result.analysisHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.trustReplay.result.replayHash,
      input.trustCertification.result.certificationHash,
      input.driftReplay.result.replayHash,
      input.driftCertification.result.certificationHash,
      input.resilienceReplay.result.replayHash,
      input.resilienceCertification.result.certificationHash,
      input.impactCertification.result.certificationHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  dependencyRiskRecordCount: number,
  visiblePropagationCount: number,
  visibleConflictCount: number,
  visibleReplayReferenceCount: number,
  reasons: DependencyRiskObservabilityReasonCode[],
): boolean {
  const valid = dependencyRiskRecordCount <= MAX_DEPENDENCY_RISK_RECORDS
    && visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS
    && visibleConflictCount <= MAX_VISIBLE_CONFLICTS
    && visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES;
  addReason(reasons, dependencyRiskRecordCount <= MAX_DEPENDENCY_RISK_RECORDS ? "DEPENDENCY_RISK_RECORD_LIMIT_VALID" : "DEPENDENCY_RISK_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS ? "VISIBLE_PROPAGATION_LIMIT_VALID" : "VISIBLE_PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, visibleConflictCount <= MAX_VISIBLE_CONFLICTS ? "VISIBLE_CONFLICT_LIMIT_VALID" : "VISIBLE_CONFLICT_LIMIT_EXCEEDED");
  addReason(reasons, visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES ? "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID" : "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyRiskObservabilityRequest,
  observabilityState: DependencyRiskObservabilityResult["observabilityState"],
  visibility: Readonly<{
    dependencyRiskGraphVisible: boolean;
    severityVisible: boolean;
    propagationVisible: boolean;
    lineageVisible: boolean;
    governanceVisible: boolean;
    replayVisible: boolean;
    auditVisible: boolean;
  }>,
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): DependencyRiskObservabilityResult {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityState,
    ...visibility,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyRiskObservabilityResult): DependencyRiskObservabilityObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    observabilityState: result.observabilityState,
    dependencyRiskGraphVisible: result.dependencyRiskGraphVisible,
    severityVisible: result.severityVisible,
    propagationVisible: result.propagationVisible,
    lineageVisible: result.lineageVisible,
    governanceVisible: result.governanceVisible,
    replayVisible: result.replayVisible,
    auditVisible: result.auditVisible,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  observabilityState: DependencyRiskObservabilityResult["observabilityState"],
  reasonCodes: readonly DependencyRiskObservabilityReasonCode[],
  visibility: Readonly<{
    dependencyRiskGraphVisible: boolean;
    severityVisible: boolean;
    propagationVisible: boolean;
    concentrationsVisible: boolean;
    gapsVisible: boolean;
    conflictsVisible: boolean;
    lineageVisible: boolean;
    governanceVisible: boolean;
    replayVisible: boolean;
    auditVisible: boolean;
  }>,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    visiblePropagationCount: number;
    visibleConflictCount: number;
    visibleReplayReferenceCount: number;
  }>,
): DependencyRiskObservabilityValidation {
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

export function buildDependencyRiskObservabilityRequest(request: DependencyRiskObservabilityRequest): DependencyRiskObservabilityRequest {
  return requestCore(request);
}

export function sealDependencyRiskObservability(input: DependencyRiskObservabilityInput): SealedDependencyRiskObservabilityRecord {
  const reasons: DependencyRiskObservabilityReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.observabilityScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const dependencyRiskGraphVisible = validateDependencyRiskGraphVisibility(input, reasons);
  const severityVisible = validateSeverityVisibility(input, reasons);
  const propagationVisible = validatePropagationVisibility(input, reasons);
  const concentrationsVisible = validateConcentrationVisibility(input, reasons);
  const gapsVisible = validateGapVisibility(input, reasons);
  const conflictsVisible = validateConflictVisibility(input, reasons);
  const lineageVisible = validateLineageVisibility(input, reasons);
  const replayVisibility = validateReplayVisibility(input, reasons);
  const governanceVisibility = validateGovernanceVisibility(input, reasons);
  const auditVisible = validateAuditVisibility(input, reasons);
  const visibilityEvidenceComplete = validateVisibilityEvidence([
    dependencyRiskGraphVisible,
    severityVisible,
    propagationVisible,
    concentrationsVisible,
    gapsVisible,
    conflictsVisible,
    lineageVisible,
    auditVisible,
  ], reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyRiskObservabilityEvidencePath(input);
  const counts = Object.freeze({
    visiblePropagationCount: evidencePath.propagationReferences.length,
    visibleConflictCount: evidencePath.conflictReferences.length,
    visibleReplayReferenceCount: evidencePath.replayReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.dependencyRiskReferences.length,
    counts.visiblePropagationCount,
    counts.visibleConflictCount,
    counts.visibleReplayReferenceCount,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_RISK_OBSERVABILITY_IS_NOT_CONTROL");

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

  const observabilityHash = hashObservabilityValue("dependency-risk-observability-layer", {
    request: requestCore(input.request),
    observabilityState,
    dependencyRiskReferences: evidencePath.dependencyRiskReferences,
    severityReferences: evidencePath.severityReferences,
    propagationReferences: evidencePath.propagationReferences,
    concentrationReferences: evidencePath.concentrationReferences,
    gapReferences: evidencePath.gapReferences,
    conflictReferences: evidencePath.conflictReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    auditReferences: evidencePath.auditReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const visibility = Object.freeze({
    dependencyRiskGraphVisible,
    severityVisible,
    propagationVisible,
    concentrationsVisible,
    gapsVisible,
    conflictsVisible,
    lineageVisible,
    governanceVisible: governanceVisibility.visible,
    replayVisible: replayVisibility.visible,
    auditVisible,
  });
  const result = buildResult(
    input.request,
    observabilityState,
    {
      dependencyRiskGraphVisible,
      severityVisible,
      propagationVisible,
      lineageVisible,
      governanceVisible: governanceVisibility.visible,
      replayVisible: replayVisibility.visible,
      auditVisible,
    },
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
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
