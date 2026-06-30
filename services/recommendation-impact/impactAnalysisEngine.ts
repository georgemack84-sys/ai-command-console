import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  ImpactAnalysisEvidencePath,
  ImpactAnalysisInput,
  ImpactAnalysisObservability,
  ImpactAnalysisReasonCode,
  ImpactAnalysisRequest,
  ImpactAnalysisResult,
  ImpactAnalysisScope,
  ImpactAnalysisValidation,
  RecommendationImpact,
  SealedImpactAnalysisRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_IMPACTS = 50_000;
const MAX_IMPACT_CHAINS = 25_000;
const MAX_IMPACT_CONFLICTS = 10_000;

const ANALYSIS_SCOPES: readonly ImpactAnalysisScope[] = Object.freeze([
  "CHAINS",
  "PROPAGATION",
  "CONCENTRATION",
  "GAPS",
  "CONFLICTS",
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

function addReason(reasons: ImpactAnalysisReasonCode[], reason: ImpactAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ImpactAnalysisRequest): ImpactAnalysisRequest {
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

function orderedBundles(input: ImpactAnalysisInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function orderedImpacts(input: ImpactAnalysisInput): RecommendationImpact[] {
  return [...input.foundation.impacts].sort((left, right) => (
    left.sourceRecommendationId.localeCompare(right.sourceRecommendationId)
    || left.affectedRecommendationId.localeCompare(right.affectedRecommendationId)
    || left.impactType.localeCompare(right.impactType)
    || left.impactId.localeCompare(right.impactId)
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
    && bundle.replayFramework.result.replayState !== "INVALID"
    && bundle.replayFramework.result.replayState !== "ESCALATED";
}

function readinessIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.readiness.result.readinessState !== "NOT_READY"
    && bundle.alignment.result.alignmentState !== "MISALIGNED"
    && bundle.readinessCertification.result.certificationState !== "FAIL";
}

function membershipComplete(input: ImpactAnalysisInput): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  return requested.length === actual.length && requested.every((value, index) => value === actual[index]);
}

function impactChainsDetected(impacts: readonly RecommendationImpact[]): { count: number; refs: string[] } {
  const adjacency = new Map<string, string[]>();
  for (const impact of impacts) {
    const list = adjacency.get(impact.sourceRecommendationId) ?? [];
    list.push(impact.affectedRecommendationId);
    adjacency.set(impact.sourceRecommendationId, list);
  }
  const refs = new Set<string>();
  for (const [source, targets] of adjacency.entries()) {
    for (const target of normalizeStrings(targets)) {
      const nextTargets = adjacency.get(target) ?? [];
      for (const next of normalizeStrings(nextTargets)) refs.add(`${source}->${target}->${next}`);
      if (nextTargets.length === 0) refs.add(`${source}->${target}`);
    }
  }
  return { count: refs.size, refs: [...refs].sort() };
}

function propagationPathsDetected(impacts: readonly RecommendationImpact[]): { count: number; refs: string[] } {
  const refs = impacts.map((impact) => `${impact.impactType}:${impact.sourceRecommendationId}->${impact.affectedRecommendationId}`);
  return { count: refs.length, refs: normalizeStrings(refs) };
}

function impactConcentrationsDetected(impacts: readonly RecommendationImpact[]): { count: number; refs: string[] } {
  const counts = new Map<string, number>();
  for (const impact of impacts) {
    counts.set(impact.affectedRecommendationId, (counts.get(impact.affectedRecommendationId) ?? 0) + 1);
  }
  const refs = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([recommendation, count]) => `concentration:${recommendation}:${count}`)
    .sort();
  return { count: refs.length, refs };
}

function impactGapsDetected(input: ImpactAnalysisInput): { count: number; refs: string[] } {
  const refs: string[] = [];
  if (!membershipComplete(input)) refs.push("gap:membership");
  if (input.foundation.evidencePath.lineageReferences.length === 0) refs.push("gap:lineage");
  if (input.foundation.evidencePath.governanceReferences.length === 0) refs.push("gap:governance");
  if (input.foundation.evidencePath.replayReferences.length === 0) refs.push("gap:replay");
  if (input.foundation.evidencePath.readinessReferences.length === 0) refs.push("gap:readiness");
  for (const bundle of orderedBundles(input)) {
    if (bundle.replayEvidence.replayReferences.length === 0) refs.push(`gap:replay:${recommendationId(bundle)}`);
    if (bundle.governanceReferences.governanceReferences.length === 0) refs.push(`gap:governance:${recommendationId(bundle)}`);
  }
  return { count: refs.length, refs: refs.sort() };
}

function impactConflictsDetected(input: ImpactAnalysisInput): { count: number; refs: string[] } {
  const refs: string[] = [];
  for (const bundle of orderedBundles(input)) {
    const id = recommendationId(bundle);
    if (!governanceIntegrity(bundle)) refs.push(`conflict:governance:${id}`);
    if (!replayIntegrity(bundle)) refs.push(`conflict:replay:${id}`);
    if (!readinessIntegrity(bundle)) refs.push(`conflict:readiness:${id}`);
    if (bundle.ownershipEvidence.recommendationId !== id) refs.push(`conflict:ownership:${id}`);
    if (bundle.replayEvidence.tenantId !== input.request.tenantId) refs.push(`conflict:tenant:${id}`);
  }
  return { count: refs.length, refs: refs.sort() };
}

function validateScope(scope: ImpactAnalysisScope, reasons: ImpactAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: ImpactAnalysisRequest, reasons: ImpactAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateSealedArtifacts(input: ImpactAnalysisInput, reasons: ImpactAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
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

function validateMembership(input: ImpactAnalysisInput, reasons: ImpactAnalysisReasonCode[]): boolean {
  const valid = membershipComplete(input);
  addReason(reasons, valid ? "MEMBERSHIP_COMPLETE" : "IMPACT_EVIDENCE_MISSING");
  return valid;
}

function validateTenantScope(input: ImpactAnalysisInput, reasons: ImpactAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_IMPACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: ImpactAnalysisInput, reasons: ImpactAnalysisReasonCode[]): boolean {
  const valid = input.foundation.validation.ownershipValid
    && orderedBundles(input).every((bundle) => bundle.ownershipEvidence.recommendationId === recommendationId(bundle));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateChains(chainCount: number, reasons: ImpactAnalysisReasonCode[]): boolean {
  const valid = chainCount > 0;
  addReason(reasons, valid ? "IMPACT_CHAINS_ANALYZED" : "IMPACT_CHAINS_LIMITED");
  return valid;
}

function validatePropagation(pathCount: number, reasons: ImpactAnalysisReasonCode[]): boolean {
  const valid = pathCount > 0;
  addReason(reasons, valid ? "PROPAGATION_PATHS_ANALYZED" : "PROPAGATION_PATHS_LIMITED");
  return valid;
}

function validateConcentrations(concentrationCount: number, reasons: ImpactAnalysisReasonCode[]): boolean {
  const valid = concentrationCount > 0;
  addReason(reasons, valid ? "IMPACT_CONCENTRATIONS_ANALYZED" : "IMPACT_CONCENTRATIONS_LIMITED");
  return valid;
}

function validateGaps(gapCount: number, reasons: ImpactAnalysisReasonCode[]): boolean {
  addReason(reasons, gapCount > 0 ? "IMPACT_GAPS_DETECTED" : "IMPACT_GAPS_ABSENT");
  return gapCount === 0;
}

function validateConflicts(conflictCount: number, reasons: ImpactAnalysisReasonCode[]): boolean {
  addReason(reasons, conflictCount > 0 ? "IMPACT_CONFLICTS_DETECTED" : "IMPACT_CONFLICTS_ABSENT");
  return conflictCount === 0;
}

function validateGovernance(input: ImpactAnalysisInput, reasons: ImpactAnalysisReasonCode[]): boolean {
  const valid = orderedBundles(input).every(governanceIntegrity);
  if (!valid) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: ImpactAnalysisInput, reasons: ImpactAnalysisReasonCode[]): { valid: boolean; limited: boolean } {
  const invalid = input.foundation.validation.replayImpactsValid === false
    || input.dependencyReplay.result.replayState === "INVALID"
    || input.dependencyReplay.result.replayState === "ESCALATED"
    || input.portfolioReplay.result.replayState === "INVALID"
    || input.portfolioReplay.result.replayState === "ESCALATED";
  const limited = !invalid && (
    input.foundation.result.impactState === "LIMITED"
    || input.dependencyReplay.result.replayState === "LIMITED"
    || input.portfolioReplay.result.replayState === "LIMITED"
  );
  if (invalid) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  return { valid: !invalid, limited };
}

function validateImpactReferences(impacts: readonly RecommendationImpact[], reasons: ImpactAnalysisReasonCode[]): boolean {
  const present = impacts.length > 0;
  addReason(reasons, present ? "IMPACT_REFERENCES_PRESENT" : "IMPACT_REFERENCES_MISSING");
  return present;
}

function validateBoundary(input: ImpactAnalysisInput, reasons: ImpactAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = !input.foundation.controlSurfacePresent
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
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.approvalRequested === true
      || !authorityBounded
      || input.analysisMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createImpactAnalysisEvidencePath(
  input: ImpactAnalysisInput,
  chains: readonly string[],
  propagation: readonly string[],
  concentrations: readonly string[],
  gaps: readonly string[],
  conflicts: readonly string[],
): ImpactAnalysisEvidencePath {
  const impacts = orderedImpacts(input);
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.analysisScope,
    impactReferences: normalizeStrings(impacts.map((impact) => impact.impactId)),
    chainReferences: normalizeStrings(chains),
    propagationReferences: normalizeStrings(propagation),
    concentrationReferences: normalizeStrings(concentrations),
    gapReferences: normalizeStrings(gaps),
    conflictReferences: normalizeStrings(conflicts),
    evidenceHashes: normalizeStrings([
      input.foundation.result.impactGraphHash,
      input.dependencyFoundation.result.dependencyGraphHash,
      input.dependencyAnalysis.result.analysisHash,
      input.dependencyReplay.result.replayHash,
      input.dependencyCertification.result.certificationHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.portfolioReplay.result.replayHash,
      input.portfolioCertification.result.certificationHash,
      ...bundles.flatMap((bundle) => [
        bundle.ledger.result.ledgerHash,
        bundle.lineage.result.reconstructionHash,
        bundle.replay.result.replayHash,
        bundle.binding.result.governanceHash,
        bundle.readiness.result.readinessHash,
      ]),
      ...impacts.map((impact) => impact.impactHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  impactCount: number,
  chainCount: number,
  conflictCount: number,
  reasons: ImpactAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && impactCount <= MAX_IMPACTS
    && chainCount <= MAX_IMPACT_CHAINS
    && conflictCount <= MAX_IMPACT_CONFLICTS;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, impactCount <= MAX_IMPACTS ? "IMPACT_LIMIT_VALID" : "IMPACT_LIMIT_EXCEEDED");
  addReason(reasons, chainCount <= MAX_IMPACT_CHAINS ? "CHAIN_LIMIT_VALID" : "CHAIN_LIMIT_EXCEEDED");
  addReason(reasons, conflictCount <= MAX_IMPACT_CONFLICTS ? "CONFLICT_LIMIT_VALID" : "CONFLICT_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: ImpactAnalysisRequest,
  analysisState: ImpactAnalysisResult["analysisState"],
  chainCount: number,
  propagationCount: number,
  concentrationCount: number,
  gapCount: number,
  conflictCount: number,
  tenantIsolationVerified: boolean,
  analysisHash: string,
): ImpactAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    impactChainsDetected: chainCount,
    propagationPathsDetected: propagationCount,
    impactConcentrationsDetected: concentrationCount,
    impactGapsDetected: gapCount,
    impactConflictsDetected: conflictCount,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: ImpactAnalysisResult): ImpactAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    impactChainsDetected: result.impactChainsDetected,
    propagationPathsDetected: result.propagationPathsDetected,
    impactConcentrationsDetected: result.impactConcentrationsDetected,
    impactGapsDetected: result.impactGapsDetected,
    impactConflictsDetected: result.impactConflictsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: ImpactAnalysisResult["analysisState"],
  reasonCodes: readonly ImpactAnalysisReasonCode[],
  chainCount: number,
  propagationCount: number,
  concentrationCount: number,
  gapCount: number,
  conflictCount: number,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
): ImpactAnalysisValidation {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    impactChainsDetected: chainCount,
    propagationPathsDetected: propagationCount,
    impactConcentrationsDetected: concentrationCount,
    impactGapsDetected: gapCount,
    impactConflictsDetected: conflictCount,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });
}

export function buildImpactAnalysisRequest(request: ImpactAnalysisRequest): ImpactAnalysisRequest {
  return requestCore(request);
}

export function sealImpactAnalysis(input: ImpactAnalysisInput): SealedImpactAnalysisRecord {
  const reasons: ImpactAnalysisReasonCode[] = [];
  const impacts = orderedImpacts(input);
  const chains = impactChainsDetected(impacts);
  const propagation = propagationPathsDetected(impacts);
  const concentrations = impactConcentrationsDetected(impacts);
  const gaps = impactGapsDetected(input);
  const conflicts = impactConflictsDetected(input);
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.analysisScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const membershipValid = validateMembership(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const chainsValid = validateChains(chains.count, reasons);
  const propagationValid = validatePropagation(propagation.count, reasons);
  const concentrationsValid = validateConcentrations(concentrations.count, reasons);
  const gapsClear = validateGaps(gaps.count, reasons);
  const conflictsClear = validateConflicts(conflicts.count, reasons);
  const governanceValid = validateGovernance(input, reasons);
  const replayValidation = validateReplay(input, reasons);
  const referencesPresent = validateImpactReferences(impacts, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createImpactAnalysisEvidencePath(input, chains.refs, propagation.refs, concentrations.refs, gaps.refs, conflicts.refs);
  const limitsValid = validateLimits(
    input.request.recommendationIds.length,
    impacts.length,
    chains.count,
    conflicts.count,
    reasons,
  );
  addReason(reasons, "IMPACT_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValidation.valid
    || boundary.invalidBoundary;
  const observe = !invalid && !membershipValid;
  const limited = !invalid && !observe && (
    !referencesPresent
    || !chainsValid
    || !propagationValid
    || !concentrationsValid
    || !gapsClear
    || !conflictsClear
    || replayValidation.limited
    || !limitsValid
  );
  const analysisState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "ANALYZED";

  const analysisHash = hashAnalysisValue("impact-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    impactReferences: evidencePath.impactReferences,
    chainReferences: evidencePath.chainReferences,
    propagationReferences: evidencePath.propagationReferences,
    concentrationReferences: evidencePath.concentrationReferences,
    gapReferences: evidencePath.gapReferences,
    conflictReferences: evidencePath.conflictReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    analysisState,
    chains.count,
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
    chains.count,
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
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
