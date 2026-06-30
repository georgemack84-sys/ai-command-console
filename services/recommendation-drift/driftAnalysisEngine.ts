import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DriftAnalysisEvidencePath,
  DriftAnalysisInput,
  DriftAnalysisObservability,
  DriftAnalysisReasonCode,
  DriftAnalysisRequest,
  DriftAnalysisResult,
  DriftAnalysisScope,
  DriftSeverity,
  RecommendationDrift,
  SealedDriftAnalysisRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_DRIFTS = 50_000;
const MAX_DRIFT_CONFLICTS = 10_000;
const MAX_PROPAGATION_PATHS = 25_000;

const ANALYSIS_SCOPES: readonly DriftAnalysisScope[] = Object.freeze([
  "SEVERITY",
  "PROPAGATION",
  "CONCENTRATION",
  "GAPS",
  "CONFLICTS",
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

function addReason(reasons: DriftAnalysisReasonCode[], reason: DriftAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DriftAnalysisRequest): DriftAnalysisRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    analysisScope: request.analysisScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationPortfolioBundle): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: DriftAnalysisInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function orderedDrifts(input: DriftAnalysisInput): RecommendationDrift[] {
  return [...input.foundation.drifts].sort((left, right) => (
    left.recommendationId.localeCompare(right.recommendationId)
    || left.driftType.localeCompare(right.driftType)
    || left.driftId.localeCompare(right.driftId)
  ));
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

function governanceIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL";
}

function replayIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.replay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "INVALID"
    && bundle.governanceReplay.result.replayState !== "ESCALATED"
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED";
}

function membershipComplete(input: DriftAnalysisInput): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  return requested.length === actual.length && requested.every((value, index) => value === actual[index]);
}

function classifySeverity(input: DriftAnalysisInput, drift: RecommendationDrift): DriftSeverity {
  if (drift.driftType === "GOVERNANCE_DRIFT" && input.impactCertification.result.governanceCertified === false) return "CRITICAL";
  if (drift.driftType === "REPLAY_DRIFT" && input.impactReplay.result.replayState !== "REPLAYABLE") return "CRITICAL";
  if (drift.driftType === "PORTFOLIO_DRIFT" && input.portfolioCertification.result.certificationState !== "PASS") return "CRITICAL";
  if (drift.driftType === "DEPENDENCY_DRIFT" && input.dependencyCertification.result.certificationState !== "PASS") return "CRITICAL";
  if (drift.driftType === "IMPACT_DRIFT" && input.impactCertification.result.certificationState !== "PASS") return "CRITICAL";
  if (drift.driftType === "GOVERNANCE_DRIFT" || drift.driftType === "PORTFOLIO_DRIFT" || drift.driftType === "DEPENDENCY_DRIFT" || drift.driftType === "IMPACT_DRIFT") return "HIGH";
  if (drift.driftType === "REPLAY_DRIFT" || drift.driftType === "READINESS_DRIFT") return "MODERATE";
  return "LOW";
}

function severityAnalysis(input: DriftAnalysisInput, drifts: readonly RecommendationDrift[]): { count: number; refs: string[] } {
  const refs = drifts.map((drift) => `${drift.recommendationId}:${drift.driftType}:${classifySeverity(input, drift)}`);
  return { count: refs.length, refs: normalizeStrings(refs) };
}

function propagationAnalysis(input: DriftAnalysisInput, drifts: readonly RecommendationDrift[]): { count: number; refs: string[] } {
  const refs = new Set<string>();
  for (const drift of drifts) {
    refs.add(`propagation:${drift.recommendationId}:${drift.driftType}`);
    if (drift.driftType === "DEPENDENCY_DRIFT") {
      for (const chain of input.dependencyAnalysis.evidencePath.chainReferences) refs.add(`propagation:${drift.recommendationId}:dependency:${chain}`);
    }
    if (drift.driftType === "IMPACT_DRIFT") {
      for (const path of input.impactAnalysis.evidencePath.propagationReferences) refs.add(`propagation:${drift.recommendationId}:impact:${path}`);
    }
    if (drift.driftType === "PORTFOLIO_DRIFT") {
      for (const relationship of input.relationshipAnalysis.evidencePath.relationshipReferences) refs.add(`propagation:${drift.recommendationId}:portfolio:${relationship}`);
    }
  }
  return { count: refs.size, refs: [...refs].sort() };
}

function concentrationAnalysis(drifts: readonly RecommendationDrift[]): { count: number; refs: string[] } {
  const counts = new Map<string, number>();
  for (const drift of drifts) counts.set(drift.recommendationId, (counts.get(drift.recommendationId) ?? 0) + 1);
  const refs = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([recommendationId, count]) => `concentration:${recommendationId}:${count}`)
    .sort();
  return { count: refs.length, refs };
}

function gapAnalysis(input: DriftAnalysisInput): { count: number; refs: string[] } {
  const refs: string[] = [];
  if (input.foundation.evidencePath.baselineReferences.length === 0) refs.push("gap:baseline");
  if (input.foundation.evidencePath.currentReferences.length === 0) refs.push("gap:current");
  if (input.foundation.evidencePath.lineageReferences.length === 0) refs.push("gap:lineage");
  if (input.foundation.evidencePath.governanceReferences.length === 0) refs.push("gap:governance");
  if (input.foundation.evidencePath.replayReferences.length === 0) refs.push("gap:replay");
  if (!membershipComplete(input)) refs.push("gap:membership");
  return { count: refs.length, refs: refs.sort() };
}

function conflictAnalysis(input: DriftAnalysisInput, drifts: readonly RecommendationDrift[]): { count: number; refs: string[] } {
  const refs: string[] = [];
  for (const drift of drifts) {
    if (drift.driftType === "GOVERNANCE_DRIFT") refs.push(`conflict:governance:${drift.recommendationId}`);
    if (drift.driftType === "LINEAGE_DRIFT") refs.push(`conflict:lineage:${drift.recommendationId}`);
    if (drift.driftType === "REPLAY_DRIFT") refs.push(`conflict:replay:${drift.recommendationId}`);
    if (drift.driftType === "DEPENDENCY_DRIFT") refs.push(`conflict:dependency:${drift.recommendationId}`);
    if (drift.driftType === "IMPACT_DRIFT") refs.push(`conflict:impact:${drift.recommendationId}`);
  }
  for (const bundle of orderedBundles(input)) {
    const id = recommendationId(bundle);
    if (!governanceIntegrity(bundle)) refs.push(`conflict:authority:${id}`);
    if (!replayIntegrity(bundle)) refs.push(`conflict:replay-integrity:${id}`);
    if (bundle.ownershipEvidence.recommendationId !== id) refs.push(`conflict:ownership:${id}`);
    if (bundle.replayEvidence.tenantId !== input.request.tenantId) refs.push(`conflict:tenant:${id}`);
  }
  return { count: refs.length, refs: normalizeStrings(refs) };
}

function validateScope(scope: DriftAnalysisScope, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: DriftAnalysisRequest, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateFoundation(input: DriftAnalysisInput, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = input.foundation.sealed === true && input.foundation.result.tenantId === input.request.tenantId;
  addReason(reasons, input.foundation.sealed === true ? "FOUNDATION_REQUIRED" : "FOUNDATION_UNSEALED");
  return valid;
}

function validateSealedArtifacts(input: DriftAnalysisInput, reasons: DriftAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.impactFoundation.sealed === true
    && input.impactAnalysis.sealed === true
    && input.impactReplay.sealed === true
    && input.impactCertification.sealed === true
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

function validateMembership(input: DriftAnalysisInput, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = membershipComplete(input);
  addReason(reasons, valid ? "MEMBERSHIP_COMPLETE" : "DRIFT_EVIDENCE_MISSING");
  return valid;
}

function validateTenantScope(input: DriftAnalysisInput, reasons: DriftAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.impactFoundation.result.tenantIsolationVerified
    && input.impactAnalysis.result.tenantIsolationVerified
    && input.impactReplay.result.tenantIsolationVerified
    && input.impactCertification.result.tenantIsolationVerified
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
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_DRIFT_BLOCKED");
  return valid;
}

function validateOwnership(input: DriftAnalysisInput, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => bundle.ownershipEvidence.recommendationId === recommendationId(bundle));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateSeverity(severityCount: number, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = severityCount > 0 || ANALYSIS_SCOPES.includes("SEVERITY");
  addReason(reasons, valid ? "SEVERITY_ANALYZED" : "SEVERITY_LIMITED");
  return valid;
}

function validatePropagation(pathCount: number, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = pathCount > 0 || ANALYSIS_SCOPES.includes("PROPAGATION");
  addReason(reasons, valid ? "PROPAGATION_ANALYZED" : "PROPAGATION_LIMITED");
  return valid;
}

function validateConcentrations(concentrationCount: number, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = concentrationCount > 0 || ANALYSIS_SCOPES.includes("CONCENTRATION");
  addReason(reasons, valid ? "CONCENTRATION_ANALYZED" : "CONCENTRATION_LIMITED");
  return valid;
}

function validateGaps(gapCount: number, reasons: DriftAnalysisReasonCode[]): boolean {
  addReason(reasons, gapCount > 0 ? "DRIFT_GAPS_DETECTED" : "DRIFT_GAPS_ABSENT");
  return gapCount === 0;
}

function validateConflicts(conflictCount: number, reasons: DriftAnalysisReasonCode[]): boolean {
  addReason(reasons, conflictCount > 0 ? "DRIFT_CONFLICTS_DETECTED" : "DRIFT_CONFLICTS_ABSENT");
  return conflictCount === 0;
}

function validateGovernance(input: DriftAnalysisInput, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = input.foundation.validation.valid
    && input.impactCertification.result.governanceCertified
    && input.dependencyCertification.result.governanceCertified
    && input.portfolioCertification.result.governanceCertified
    && orderedBundles(input).every(governanceIntegrity);
  addReason(reasons, valid ? "GOVERNANCE_CONTINUITY_PRESERVED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: DriftAnalysisInput, reasons: DriftAnalysisReasonCode[]): boolean {
  const valid = input.impactReplay.result.replayState !== "INVALID"
    && input.impactReplay.result.replayState !== "ESCALATED"
    && input.dependencyReplay.result.replayState !== "INVALID"
    && input.dependencyReplay.result.replayState !== "ESCALATED"
    && input.portfolioReplay.result.replayState !== "INVALID"
    && input.portfolioReplay.result.replayState !== "ESCALATED"
    && orderedBundles(input).every(replayIntegrity);
  addReason(reasons, valid ? "REPLAY_CONTINUITY_PRESERVED" : "REPLAY_CORRUPTION_DETECTED");
  return valid;
}

function validateDriftReferences(drifts: readonly RecommendationDrift[], reasons: DriftAnalysisReasonCode[]): boolean {
  const present = drifts.length > 0 || reasons.includes("DRIFT_REFERENCES_MISSING");
  addReason(reasons, present ? "DRIFT_REFERENCES_PRESENT" : "DRIFT_REFERENCES_MISSING");
  return present;
}

function validateBoundary(input: DriftAnalysisInput, reasons: DriftAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const repairAbsent = input.repairRequested !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
    && !input.impactFoundation.controlSurfacePresent
    && !input.impactAnalysis.controlSurfacePresent
    && !input.impactReplay.controlSurfacePresent
    && !input.impactCertification.controlSurfacePresent
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
  addReason(reasons, repairAbsent ? "REPAIR_ABSENT" : "REPAIR_DETECTED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
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
      || input.analysisMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDriftAnalysisEvidencePath(
  input: DriftAnalysisInput,
  severities: readonly string[],
  propagation: readonly string[],
  concentrations: readonly string[],
  gaps: readonly string[],
  conflicts: readonly string[],
): DriftAnalysisEvidencePath {
  const drifts = orderedDrifts(input);
  return Object.freeze({
    scope: input.request.analysisScope,
    driftReferences: normalizeStrings(drifts.map((drift) => drift.driftId)),
    severityReferences: normalizeStrings(severities),
    propagationReferences: normalizeStrings(propagation),
    concentrationReferences: normalizeStrings(concentrations),
    gapReferences: normalizeStrings(gaps),
    conflictReferences: normalizeStrings(conflicts),
    baselineReferences: normalizeStrings(input.foundation.evidencePath.baselineReferences),
    currentReferences: normalizeStrings(input.foundation.evidencePath.currentReferences),
    evidenceHashes: normalizeStrings([
      input.foundation.result.driftGraphHash,
      input.impactFoundation.result.impactGraphHash,
      input.impactAnalysis.result.analysisHash,
      input.impactReplay.result.replayHash,
      input.impactCertification.result.certificationHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyAnalysis.result.analysisHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...input.foundation.evidencePath.evidenceHashes,
      ...drifts.map((drift) => drift.driftHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  driftCount: number,
  propagationCount: number,
  conflictCount: number,
  reasons: DriftAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && driftCount <= MAX_DRIFTS
    && propagationCount <= MAX_PROPAGATION_PATHS
    && conflictCount <= MAX_DRIFT_CONFLICTS;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, driftCount <= MAX_DRIFTS ? "DRIFT_LIMIT_VALID" : "DRIFT_LIMIT_EXCEEDED");
  addReason(reasons, propagationCount <= MAX_PROPAGATION_PATHS ? "PROPAGATION_LIMIT_VALID" : "PROPAGATION_LIMIT_EXCEEDED");
  addReason(reasons, conflictCount <= MAX_DRIFT_CONFLICTS ? "CONFLICT_LIMIT_VALID" : "CONFLICT_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DriftAnalysisRequest,
  analysisState: DriftAnalysisResult["analysisState"],
  severityCount: number,
  propagationCount: number,
  concentrationCount: number,
  gapCount: number,
  conflictCount: number,
  tenantIsolationVerified: boolean,
  analysisHash: string,
): DriftAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    driftSeveritiesDetected: severityCount,
    propagationPathsDetected: propagationCount,
    driftConcentrationsDetected: concentrationCount,
    driftGapsDetected: gapCount,
    driftConflictsDetected: conflictCount,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: DriftAnalysisResult): DriftAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    driftSeveritiesDetected: result.driftSeveritiesDetected,
    propagationPathsDetected: result.propagationPathsDetected,
    driftConcentrationsDetected: result.driftConcentrationsDetected,
    driftGapsDetected: result.driftGapsDetected,
    driftConflictsDetected: result.driftConflictsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: DriftAnalysisResult["analysisState"],
  reasonCodes: readonly DriftAnalysisReasonCode[],
  severityCount: number,
  propagationCount: number,
  concentrationCount: number,
  gapCount: number,
  conflictCount: number,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
) {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    driftSeveritiesDetected: severityCount,
    propagationPathsDetected: propagationCount,
    driftConcentrationsDetected: concentrationCount,
    driftGapsDetected: gapCount,
    driftConflictsDetected: conflictCount,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    repairAbsent: boundary.repairAbsent,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });
}

export function buildDriftAnalysisRequest(request: DriftAnalysisRequest): DriftAnalysisRequest {
  return requestCore(request);
}

export function sealDriftAnalysis(input: DriftAnalysisInput): SealedDriftAnalysisRecord {
  const reasons: DriftAnalysisReasonCode[] = [];
  const drifts = orderedDrifts(input);
  const severities = severityAnalysis(input, drifts);
  const propagation = propagationAnalysis(input, drifts);
  const concentrations = concentrationAnalysis(drifts);
  const gaps = gapAnalysis(input);
  const conflicts = conflictAnalysis(input, drifts);
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.analysisScope, reasons);
  const foundationValid = validateFoundation(input, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const membershipValid = validateMembership(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const severityValid = validateSeverity(severities.count, reasons);
  const propagationValid = validatePropagation(propagation.count, reasons);
  const concentrationValid = validateConcentrations(concentrations.count, reasons);
  const gapsClear = validateGaps(gaps.count, reasons);
  const conflictsClear = validateConflicts(conflicts.count, reasons);
  const governanceValid = validateGovernance(input, reasons);
  const replayValid = validateReplay(input, reasons);
  const referencesPresent = validateDriftReferences(drifts, reasons);
  addReason(reasons, input.foundation.evidencePath.baselineReferences.length > 0 ? "BASELINE_REFERENCES_PRESENT" : "BASELINE_REFERENCES_MISSING");
  addReason(reasons, input.foundation.evidencePath.currentReferences.length > 0 ? "CURRENT_REFERENCES_PRESENT" : "CURRENT_REFERENCES_MISSING");
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDriftAnalysisEvidencePath(input, severities.refs, propagation.refs, concentrations.refs, gaps.refs, conflicts.refs);
  const limitsValid = validateLimits(
    input.request.recommendationIds.length,
    drifts.length,
    propagation.count,
    conflicts.count,
    reasons,
  );
  addReason(reasons, "DRIFT_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !foundationValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValid
    || boundary.invalidBoundary;
  const observe = !invalid && !membershipValid;
  const limited = !invalid && !observe && (
    !referencesPresent
    || input.foundation.evidencePath.baselineReferences.length === 0
    || input.foundation.evidencePath.currentReferences.length === 0
    || !severityValid
    || !propagationValid
    || !concentrationValid
    || !gapsClear
    || !conflictsClear
    || !limitsValid
    || input.foundation.result.driftState === "OBSERVE"
  );
  const analysisState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "ANALYZED";

  const analysisHash = hashAnalysisValue("drift-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    driftReferences: evidencePath.driftReferences,
    severityReferences: evidencePath.severityReferences,
    propagationReferences: evidencePath.propagationReferences,
    concentrationReferences: evidencePath.concentrationReferences,
    gapReferences: evidencePath.gapReferences,
    conflictReferences: evidencePath.conflictReferences,
    baselineReferences: evidencePath.baselineReferences,
    currentReferences: evidencePath.currentReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    analysisState,
    severities.count,
    propagation.count,
    concentrations.count,
    gaps.count,
    conflicts.count,
    tenantIsolationVerified,
    analysisHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    analysisState,
    reasons,
    severities.count,
    propagation.count,
    concentrations.count,
    gaps.count,
    conflicts.count,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
  );

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    analysisOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    approvalAllowed: false,
    repairAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
