import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  OpportunityObservabilityEvidencePath,
  OpportunityObservabilityInput,
  OpportunityObservabilityObservability,
  OpportunityObservabilityReasonCode,
  OpportunityObservabilityRequest,
  OpportunityObservabilityResult,
  OpportunityObservabilityScope,
  OpportunityObservabilityValidation,
  SealedOpportunityObservabilityRecord,
} from "./types";

const MAX_OPPORTUNITY_RECORDS = 50_000;
const MAX_VISIBLE_PROPAGATION_PATHS = 25_000;
const MAX_VISIBLE_CONFLICTS = 10_000;
const MAX_VISIBLE_REPLAY_REFERENCES = 10_000;

const OBSERVABILITY_SCOPES: readonly OpportunityObservabilityScope[] = Object.freeze([
  "SUMMARY",
  "STRENGTH",
  "PROPAGATION",
  "CONFLICTS",
  "LINEAGE",
  "REPLAY",
  "FULL",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  rankingAbsent: boolean;
  approvalAbsent: boolean;
  resourceAllocationAbsent: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: OpportunityObservabilityReasonCode[], reason: OpportunityObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: OpportunityObservabilityRequest): OpportunityObservabilityRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityScope: request.observabilityScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: OpportunityObservabilityInput): RecommendationPortfolioBundle[] {
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
    "recommendationRankingAllowed",
    "recommendationPrioritizationAllowed",
    "recommendationScoringAllowed",
    "resourceAllocationAllowed",
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

function validateTenantId(request: OpportunityObservabilityRequest, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const valid = request.tenantId.length > 0;
  addReason(reasons, valid ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  return valid;
}

function validateScope(scope: OpportunityObservabilityScope, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "OBSERVABILITY_SCOPE_VALID" : "OBSERVABILITY_SCOPE_INVALID");
  return valid;
}

function validateFoundation(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateAnalysis(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const valid = input.analysis.sealed === true && input.analysis.result.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "ANALYSIS_REQUIRED" : "ANALYSIS_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.analysis.sealed === true
    && input.dependencyRiskFoundation.sealed === true
    && input.dependencyRiskCertification.sealed === true
    && input.dependencyFoundation.sealed === true
    && input.dependencyCertification.sealed === true
    && input.impactFoundation.sealed === true
    && input.impactCertification.sealed === true
    && input.trustFoundation.sealed === true
    && input.trustCertification.sealed === true
    && input.driftFoundation.sealed === true
    && input.driftCertification.sealed === true
    && input.resilienceFoundation.sealed === true
    && input.resilienceCertification.sealed === true
    && input.portfolio.sealed === true
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

function validateTenantScope(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.analysis.result.tenantIsolationVerified
    && input.dependencyRiskFoundation.result.tenantIsolationVerified
    && input.dependencyRiskCertification.result.tenantIsolationVerified
    && input.dependencyFoundation.result.tenantIsolationVerified
    && input.dependencyCertification.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
    && input.trustFoundation.result.tenantIsolationVerified
    && input.trustCertification.result.tenantIsolationVerified
    && input.driftFoundation.result.tenantIsolationVerified
    && input.driftCertification.result.tenantIsolationVerified
    && input.resilienceFoundation.result.tenantIsolationVerified
    && input.resilienceCertification.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
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

function validateOwnership(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => (
      bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
      && bundle.ownershipEvidence.ownershipReferences.length > 0
    ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateOpportunityGraphVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const visible = input.foundation.opportunities.length > 0
    && input.foundation.evidencePath.opportunityReferences.length === input.foundation.opportunities.length
    && input.foundation.result.opportunitiesCreated === input.foundation.opportunities.length;
  addReason(reasons, visible ? "OPPORTUNITY_GRAPH_VISIBLE" : "OPPORTUNITY_GRAPH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateOpportunityStrengthVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const visible = input.analysis.strengths.length > 0
    && input.analysis.evidencePath.strengthReferences.length === input.analysis.result.opportunityStrengthsDetected;
  addReason(reasons, visible ? "OPPORTUNITY_STRENGTH_VISIBLE" : "OPPORTUNITY_STRENGTH_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateOpportunityPropagationVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.opportunityPropagationsDetected > 0
    && input.analysis.evidencePath.propagationReferences.length > 0
    && input.analysis.evidencePath.propagationReferences.length === input.analysis.result.opportunityPropagationsDetected;
  addReason(reasons, visible ? "OPPORTUNITY_PROPAGATION_VISIBLE" : "OPPORTUNITY_PROPAGATION_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateOpportunityConflictsVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.opportunityConflictsDetected >= 0
    && input.analysis.evidencePath.conflictReferences.length === input.analysis.result.opportunityConflictsDetected;
  addReason(reasons, visible ? "OPPORTUNITY_CONFLICTS_VISIBLE" : "OPPORTUNITY_CONFLICT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateOpportunityGapsVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const visible = input.analysis.result.opportunityGapsDetected >= 0
    && input.analysis.evidencePath.gapReferences.length === input.analysis.result.opportunityGapsDetected;
  addReason(reasons, visible ? "OPPORTUNITY_GAPS_VISIBLE" : "OPPORTUNITY_GAP_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateOpportunityLineageVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input).every((bundle) => collectLineageReferences(bundle).length > 0 && lineageIntegrity(bundle));
  addReason(reasons, visible ? "OPPORTUNITY_LINEAGE_VISIBLE" : "OPPORTUNITY_LINEAGE_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateReplayVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("REPLAY_CORRUPTION_DETECTED")
    || orderedBundles(input).some((bundle) => !replayIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.replayReferences.length === 0
    || orderedBundles(input).some((bundle) => collectReplayReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "OPPORTUNITY_REPLAY_VISIBLE" : "OPPORTUNITY_REPLAY_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateGovernanceVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): { visible: boolean; degraded: boolean; corrupted: boolean } {
  const corrupted = input.foundation.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || input.analysis.validation.reasonCodes.includes("GOVERNANCE_CORRUPTION_DETECTED")
    || orderedBundles(input).some((bundle) => !governanceIntegrity(bundle));
  const degraded = !corrupted && (
    input.foundation.evidencePath.governanceReferences.length === 0
    || orderedBundles(input).some((bundle) => collectGovernanceReferences(bundle).length === 0)
  );
  const visible = !corrupted && !degraded;
  addReason(reasons, visible ? "OPPORTUNITY_GOVERNANCE_VISIBLE" : "OPPORTUNITY_GOVERNANCE_VISIBILITY_MISSING");
  if (corrupted) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  return { visible, degraded, corrupted };
}

function validateOpportunityAuditVisibility(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): boolean {
  const visible = orderedBundles(input).every((bundle) => collectAuditReferences(bundle).length > 0)
    && input.foundation.evidencePath.evidenceHashes.length > 0
    && input.analysis.evidencePath.evidenceHashes.length > 0;
  addReason(reasons, visible ? "OPPORTUNITY_AUDIT_VISIBLE" : "OPPORTUNITY_AUDIT_VISIBILITY_INCOMPLETE");
  return visible;
}

function validateVisibilityEvidence(visibleChecks: readonly boolean[], reasons: OpportunityObservabilityReasonCode[]): boolean {
  const complete = visibleChecks.every(Boolean);
  addReason(reasons, complete ? "VISIBILITY_EVIDENCE_COMPLETE" : "VISIBILITY_EVIDENCE_MISSING");
  return complete;
}

function validateBoundary(input: OpportunityObservabilityInput, reasons: OpportunityObservabilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const rankingAbsent = input.recommendationRankingRequested !== true;
  const approvalAbsent = input.approvalRequested !== true;
  const resourceAllocationAbsent = input.resourceAllocationRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.analysis.controlSurfacePresent
    && !input.dependencyRiskFoundation.controlSurfacePresent
    && !input.dependencyRiskCertification.controlSurfacePresent
    && !input.dependencyFoundation.controlSurfacePresent
    && !input.dependencyCertification.controlSurfacePresent
    && !input.impactFoundation.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
    && !input.trustFoundation.controlSurfacePresent
    && !input.trustCertification.controlSurfacePresent
    && !input.driftFoundation.controlSurfacePresent
    && !input.driftCertification.controlSurfacePresent
    && !input.resilienceFoundation.controlSurfacePresent
    && !input.resilienceCertification.controlSurfacePresent
    && !input.portfolio.controlSurfacePresent
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
  addReason(reasons, rankingAbsent ? "RANKING_ABSENT" : "RANKING_DETECTED");
  addReason(reasons, approvalAbsent ? "APPROVAL_ABSENT" : "APPROVAL_DETECTED");
  addReason(reasons, resourceAllocationAbsent ? "RESOURCE_ALLOCATION_ABSENT" : "RESOURCE_ALLOCATION_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");

  return Object.freeze({
    executionImpossible,
    rankingAbsent,
    approvalAbsent,
    resourceAllocationAbsent,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || !rankingAbsent
      || !approvalAbsent
      || !resourceAllocationAbsent
      || !authorityBounded
      || input.observabilityMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createOpportunityObservabilityEvidencePath(input: OpportunityObservabilityInput): OpportunityObservabilityEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.observabilityScope,
    opportunityReferences: normalizeStrings(input.foundation.evidencePath.opportunityReferences),
    strengthReferences: normalizeStrings(input.analysis.evidencePath.strengthReferences),
    propagationReferences: normalizeStrings(input.analysis.evidencePath.propagationReferences),
    concentrationReferences: normalizeStrings(input.analysis.evidencePath.concentrationReferences),
    gapReferences: normalizeStrings(input.analysis.evidencePath.gapReferences),
    conflictReferences: normalizeStrings(input.analysis.evidencePath.conflictReferences),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
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
      input.foundation.result.opportunityGraphHash,
      input.analysis.result.analysisHash,
      input.dependencyRiskFoundation.result.dependencyRiskGraphHash,
      input.dependencyRiskCertification.result.certificationHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyCertification.result.certificationHash,
      input.impactFoundation.result.impactGraphHash,
      input.impactCertification.result.certificationHash,
      input.trustFoundation.result.trustGraphHash,
      input.trustCertification.result.certificationHash,
      input.driftFoundation.result.driftGraphHash,
      input.driftCertification.result.certificationHash,
      input.resilienceFoundation.result.resilienceGraphHash,
      input.resilienceCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...input.analysis.evidencePath.evidenceHashes,
      ...bundles.flatMap(collectEvidenceHashes),
    ]),
  });
}

function validateLimits(
  opportunityRecordCount: number,
  visiblePropagationCount: number,
  visibleConflictCount: number,
  visibleReplayReferenceCount: number,
  reasons: OpportunityObservabilityReasonCode[],
): boolean {
  const valid = opportunityRecordCount <= MAX_OPPORTUNITY_RECORDS
    && visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS
    && visibleConflictCount <= MAX_VISIBLE_CONFLICTS
    && visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES;
  addReason(reasons, opportunityRecordCount <= MAX_OPPORTUNITY_RECORDS ? "OPPORTUNITY_RECORD_LIMIT_VALID" : "OPPORTUNITY_RECORD_LIMIT_EXCEEDED");
  addReason(reasons, visiblePropagationCount <= MAX_VISIBLE_PROPAGATION_PATHS ? "VISIBLE_PROPAGATION_LIMIT_VALID" : "VISIBLE_PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, visibleConflictCount <= MAX_VISIBLE_CONFLICTS ? "VISIBLE_CONFLICT_LIMIT_VALID" : "VISIBLE_CONFLICT_LIMIT_EXCEEDED");
  addReason(reasons, visibleReplayReferenceCount <= MAX_VISIBLE_REPLAY_REFERENCES ? "VISIBLE_REPLAY_REFERENCE_LIMIT_VALID" : "VISIBLE_REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: OpportunityObservabilityRequest,
  observabilityState: OpportunityObservabilityResult["observabilityState"],
  visibility: Readonly<{
    opportunityGraphVisible: boolean;
    opportunityStrengthVisible: boolean;
    opportunityPropagationVisible: boolean;
    opportunityLineageVisible: boolean;
    opportunityGovernanceVisible: boolean;
    opportunityReplayVisible: boolean;
    opportunityAuditVisible: boolean;
  }>,
  tenantIsolationVerified: boolean,
  observabilityHash: string,
): OpportunityObservabilityResult {
  return Object.freeze({
    tenantId: request.tenantId,
    observabilityState,
    ...visibility,
    tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

function buildObservability(result: OpportunityObservabilityResult): OpportunityObservabilityObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    observabilityState: result.observabilityState,
    opportunityGraphVisible: result.opportunityGraphVisible,
    opportunityStrengthVisible: result.opportunityStrengthVisible,
    opportunityPropagationVisible: result.opportunityPropagationVisible,
    opportunityLineageVisible: result.opportunityLineageVisible,
    opportunityGovernanceVisible: result.opportunityGovernanceVisible,
    opportunityReplayVisible: result.opportunityReplayVisible,
    opportunityAuditVisible: result.opportunityAuditVisible,
    observabilityHash: result.observabilityHash,
  });
}

function buildValidation(
  observabilityState: OpportunityObservabilityResult["observabilityState"],
  reasonCodes: readonly OpportunityObservabilityReasonCode[],
  visibility: Readonly<{
    opportunityGraphVisible: boolean;
    opportunityStrengthVisible: boolean;
    opportunityPropagationVisible: boolean;
    opportunityLineageVisible: boolean;
    opportunityGovernanceVisible: boolean;
    opportunityReplayVisible: boolean;
    opportunityAuditVisible: boolean;
  }>,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    visiblePropagationCount: number;
    visibleConflictCount: number;
    visibleReplayReferenceCount: number;
  }>,
): OpportunityObservabilityValidation {
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
    rankingAbsent: boundary.rankingAbsent,
    approvalAbsent: boundary.approvalAbsent,
    resourceAllocationAbsent: boundary.resourceAllocationAbsent,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
    ...counts,
  });
}

export function buildOpportunityObservabilityRequest(request: OpportunityObservabilityRequest): OpportunityObservabilityRequest {
  return requestCore(request);
}

export function sealOpportunityObservability(input: OpportunityObservabilityInput): SealedOpportunityObservabilityRecord {
  const reasons: OpportunityObservabilityReasonCode[] = [];
  const requestValid = validateTenantId(input.request, reasons)
    && validateScope(input.request.observabilityScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const analysisValid = validateAnalysis(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const opportunityGraphVisible = validateOpportunityGraphVisibility(input, reasons);
  const opportunityStrengthVisible = validateOpportunityStrengthVisibility(input, reasons);
  const opportunityPropagationVisible = validateOpportunityPropagationVisibility(input, reasons);
  const opportunityConflictsVisible = validateOpportunityConflictsVisibility(input, reasons);
  const opportunityGapsVisible = validateOpportunityGapsVisibility(input, reasons);
  const opportunityLineageVisible = validateOpportunityLineageVisibility(input, reasons);
  const replayVisibility = validateReplayVisibility(input, reasons);
  const governanceVisibility = validateGovernanceVisibility(input, reasons);
  const opportunityAuditVisible = validateOpportunityAuditVisibility(input, reasons);
  const visibilityEvidenceComplete = validateVisibilityEvidence([
    opportunityGraphVisible,
    opportunityStrengthVisible,
    opportunityPropagationVisible,
    opportunityConflictsVisible,
    opportunityGapsVisible,
    opportunityLineageVisible,
    opportunityAuditVisible,
  ], reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createOpportunityObservabilityEvidencePath(input);
  const counts = Object.freeze({
    visiblePropagationCount: evidencePath.propagationReferences.length,
    visibleConflictCount: evidencePath.conflictReferences.length,
    visibleReplayReferenceCount: evidencePath.replayReferences.length,
  });
  const limitsValid = validateLimits(
    evidencePath.opportunityReferences.length,
    counts.visiblePropagationCount,
    counts.visibleConflictCount,
    counts.visibleReplayReferenceCount,
    reasons,
  );
  addReason(reasons, "OPPORTUNITY_OBSERVABILITY_IS_NOT_CONTROL");

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

  const observabilityHash = hashObservabilityValue("opportunity-observability-layer", {
    request: requestCore(input.request),
    observabilityState,
    opportunityReferences: evidencePath.opportunityReferences,
    strengthReferences: evidencePath.strengthReferences,
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
    opportunityGraphVisible,
    opportunityStrengthVisible,
    opportunityPropagationVisible,
    opportunityLineageVisible,
    opportunityGovernanceVisible: governanceVisibility.visible,
    opportunityReplayVisible: replayVisibility.visible,
    opportunityAuditVisible,
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
    resourceAllocationAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
