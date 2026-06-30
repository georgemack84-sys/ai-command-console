import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type { RecommendationPortfolioBundle } from "@/services/recommendation-portfolio";
import type {
  DependencyAnalysisEvidencePath,
  DependencyAnalysisInput,
  DependencyAnalysisObservability,
  DependencyAnalysisReasonCode,
  DependencyAnalysisRequest,
  DependencyAnalysisResult,
  DependencyAnalysisScope,
  DependencyAnalysisValidation,
  RecommendationDependency,
  SealedDependencyAnalysisRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_DEPENDENCIES = 50_000;
const MAX_DEPENDENCY_CHAINS = 25_000;
const MAX_DEPENDENCY_CONFLICTS = 10_000;

const ANALYSIS_SCOPES: readonly DependencyAnalysisScope[] = Object.freeze([
  "SHARED",
  "CHAINS",
  "GAPS",
  "CONTINUITY",
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

function addReason(reasons: DependencyAnalysisReasonCode[], reason: DependencyAnalysisReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAnalysisValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: DependencyAnalysisRequest): DependencyAnalysisRequest {
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

function orderedBundles(input: DependencyAnalysisInput): RecommendationPortfolioBundle[] {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function orderedDependencies(input: DependencyAnalysisInput): RecommendationDependency[] {
  return [...input.foundation.dependencies].sort((left, right) => (
    left.sourceRecommendationId.localeCompare(right.sourceRecommendationId)
    || left.targetRecommendationId.localeCompare(right.targetRecommendationId)
    || left.dependencyType.localeCompare(right.dependencyType)
    || left.dependencyId.localeCompare(right.dependencyId)
  ));
}

function createBoundaryFlags(record: Record<string, unknown>): boolean {
  const blockedFlags = [
    "executionAuthorized",
    "workflowRoutingAllowed",
    "prioritizationAllowed",
    "approvalOrderingAllowed",
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
    && bundle.replayEvidence.replayReferences.length > 0;
}

function governanceIntegrity(bundle: RecommendationPortfolioBundle): boolean {
  return bundle.binding.result.bindingState !== "INVALID"
    && bundle.authorityScope.result.scopeState !== "INVALID"
    && bundle.policyVisibility.result.visibilityState !== "INVALID"
    && bundle.governanceCertification.result.certificationState !== "FAIL";
}

function membershipComplete(input: DependencyAnalysisInput): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  return requested.length === actual.length && requested.every((value, index) => value === actual[index]);
}

function sharedDependenciesDetected(dependencies: readonly RecommendationDependency[]): number {
  return dependencies.length;
}

function dependencyChainsDetected(dependencies: readonly RecommendationDependency[]): { count: number; refs: string[] } {
  const adjacency = new Map<string, string[]>();
  for (const dependency of dependencies) {
    const list = adjacency.get(dependency.sourceRecommendationId) ?? [];
    list.push(dependency.targetRecommendationId);
    adjacency.set(dependency.sourceRecommendationId, list);
  }
  const chains = new Set<string>();
  for (const [source, targets] of adjacency.entries()) {
    for (const target of normalizeStrings(targets)) {
      const nextTargets = adjacency.get(target) ?? [];
      if (nextTargets.length > 0) {
        chains.add(`${source}->${target}`);
      }
    }
  }
  const refs = [...chains].sort();
  return { count: refs.length, refs };
}

function dependencyGapsDetected(input: DependencyAnalysisInput): { count: number; refs: string[] } {
  const refs: string[] = [];
  if (!membershipComplete(input)) refs.push("gap:membership");
  for (const bundle of orderedBundles(input)) {
    if (bundle.replayEvidence.replayReferences.length === 0) refs.push(`gap:replay:${recommendationId(bundle)}`);
    if (bundle.governanceReferences.governanceReferences.length === 0) refs.push(`gap:governance:${recommendationId(bundle)}`);
    if (bundle.lineage.ancestryChain.length === 0) refs.push(`gap:lineage:${recommendationId(bundle)}`);
  }
  return { count: refs.length, refs: refs.sort() };
}

function dependencyConflictsDetected(input: DependencyAnalysisInput): { count: number; refs: string[] } {
  const refs: string[] = [];
  for (const bundle of orderedBundles(input)) {
    const id = recommendationId(bundle);
    if (!governanceIntegrity(bundle)) refs.push(`conflict:governance:${id}`);
    if (!lineageIntegrity(bundle)) refs.push(`conflict:lineage:${id}`);
    if (!replayIntegrity(bundle)) refs.push(`conflict:replay:${id}`);
    if (bundle.ownershipEvidence.recommendationId !== id) refs.push(`conflict:ownership:${id}`);
  }
  return { count: refs.length, refs: refs.sort() };
}

function dependencyContinuityVerified(input: DependencyAnalysisInput): boolean {
  return input.foundation.result.dependencyState !== "INVALID"
    && input.replay.result.replayState !== "INVALID"
    && input.replay.result.replayState !== "ESCALATED"
    && orderedBundles(input).every((bundle) => lineageIntegrity(bundle) && governanceIntegrity(bundle) && replayIntegrity(bundle));
}

function validateScope(scope: DependencyAnalysisScope, reasons: DependencyAnalysisReasonCode[]): boolean {
  const valid = ANALYSIS_SCOPES.includes(scope);
  addReason(reasons, valid ? "ANALYSIS_SCOPE_VALID" : "ANALYSIS_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: DependencyAnalysisRequest, reasons: DependencyAnalysisReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateSealedArtifacts(input: DependencyAnalysisInput, reasons: DependencyAnalysisReasonCode[]): boolean {
  const sealed = input.foundation.sealed === true
    && input.portfolio.sealed === true
    && input.relationshipAnalysis.sealed === true
    && input.observability.sealed === true
    && input.replay.sealed === true
    && input.certification.sealed === true
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

function validateMembership(input: DependencyAnalysisInput, reasons: DependencyAnalysisReasonCode[]): boolean {
  const valid = membershipComplete(input);
  addReason(reasons, valid ? "MEMBERSHIP_COMPLETE" : "DEPENDENCY_EVIDENCE_MISSING");
  return valid;
}

function validateTenantScope(input: DependencyAnalysisInput, reasons: DependencyAnalysisReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.foundation.result.tenantIsolationVerified
    && input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_DEPENDENCIES_BLOCKED");
  return valid;
}

function validateOwnership(input: DependencyAnalysisInput, reasons: DependencyAnalysisReasonCode[]): boolean {
  const valid = input.certification.result.ownershipCertified
    && orderedBundles(input).every((bundle) => bundle.ownershipEvidence.recommendationId === recommendationId(bundle));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateSharedDependencies(sharedCount: number, reasons: DependencyAnalysisReasonCode[]): boolean {
  const valid = sharedCount > 0;
  addReason(reasons, valid ? "SHARED_DEPENDENCIES_ANALYZED" : "SHARED_DEPENDENCY_EVIDENCE_MISSING");
  return valid;
}

function validateChains(chainCount: number, reasons: DependencyAnalysisReasonCode[]): boolean {
  const analyzed = chainCount > 0;
  addReason(reasons, analyzed ? "DEPENDENCY_CHAINS_ANALYZED" : "DEPENDENCY_CHAINS_LIMITED");
  return analyzed;
}

function validateGaps(gapCount: number, reasons: DependencyAnalysisReasonCode[]): boolean {
  addReason(reasons, gapCount > 0 ? "DEPENDENCY_GAPS_DETECTED" : "DEPENDENCY_GAPS_ABSENT");
  return gapCount === 0;
}

function validateContinuity(verified: boolean, reasons: DependencyAnalysisReasonCode[]): boolean {
  addReason(reasons, verified ? "DEPENDENCY_CONTINUITY_VERIFIED" : "DEPENDENCY_CONTINUITY_DEGRADED");
  return verified;
}

function validateConflicts(conflictCount: number, reasons: DependencyAnalysisReasonCode[]): boolean {
  addReason(reasons, conflictCount > 0 ? "DEPENDENCY_CONFLICTS_DETECTED" : "DEPENDENCY_CONFLICTS_ABSENT");
  return conflictCount === 0;
}

function validateGovernance(input: DependencyAnalysisInput, reasons: DependencyAnalysisReasonCode[]): boolean {
  const valid = input.foundation.validation.governanceDependenciesValid
    && input.certification.result.governanceCertified
    && orderedBundles(input).every(governanceIntegrity);
  if (!valid) addReason(reasons, "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: DependencyAnalysisInput, reasons: DependencyAnalysisReasonCode[]): { valid: boolean; limited: boolean } {
  const invalid = input.foundation.validation.replayDependenciesValid === false
    || input.replay.result.replayState === "INVALID"
    || input.replay.result.replayState === "ESCALATED";
  const limited = !invalid && (
    input.foundation.result.dependencyState === "LIMITED"
    || input.replay.result.replayState === "LIMITED"
  );
  if (invalid) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  return { valid: !invalid, limited };
}

function validateDependencyReferences(dependencies: readonly RecommendationDependency[], reasons: DependencyAnalysisReasonCode[]): boolean {
  const present = dependencies.length > 0;
  addReason(reasons, present ? "DEPENDENCY_REFERENCES_PRESENT" : "DEPENDENCY_REFERENCES_MISSING");
  return present;
}

function validateBoundary(input: DependencyAnalysisInput, reasons: DependencyAnalysisReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true;
  const controlSurfaceAbsent = orderedBundles(input).every((bundle) => [
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
  addReason(reasons, input.approvalOrderingRequested === true ? "APPROVAL_ORDERING_DETECTED" : "APPROVAL_ORDERING_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, input.analysisMutationAttempted === true ? "ANALYSIS_MUTATION_DETECTED" : "ANALYSIS_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.approvalOrderingRequested === true
      || !authorityBounded
      || input.analysisMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createDependencyAnalysisEvidencePath(
  input: DependencyAnalysisInput,
  chains: readonly string[],
  gaps: readonly string[],
  conflicts: readonly string[],
): DependencyAnalysisEvidencePath {
  const dependencies = orderedDependencies(input);
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.analysisScope,
    dependencyReferences: normalizeStrings(dependencies.map((dependency) => dependency.dependencyId)),
    chainReferences: normalizeStrings(chains),
    gapReferences: normalizeStrings(gaps),
    conflictReferences: normalizeStrings(conflicts),
    evidenceHashes: normalizeStrings([
      input.foundation.result.dependencyGraphHash,
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.certification.result.certificationHash,
      ...bundles.flatMap((bundle) => [
        bundle.ledger.result.ledgerHash,
        bundle.lineage.result.reconstructionHash,
        bundle.replay.result.replayHash,
      ]),
      ...dependencies.map((dependency) => dependency.dependencyHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  dependencyCount: number,
  chainCount: number,
  conflictCount: number,
  reasons: DependencyAnalysisReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && dependencyCount <= MAX_DEPENDENCIES
    && chainCount <= MAX_DEPENDENCY_CHAINS
    && conflictCount <= MAX_DEPENDENCY_CONFLICTS;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, dependencyCount <= MAX_DEPENDENCIES ? "DEPENDENCY_LIMIT_VALID" : "DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, chainCount <= MAX_DEPENDENCY_CHAINS ? "CHAIN_LIMIT_VALID" : "CHAIN_LIMIT_EXCEEDED");
  addReason(reasons, conflictCount <= MAX_DEPENDENCY_CONFLICTS ? "CONFLICT_LIMIT_VALID" : "CONFLICT_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: DependencyAnalysisRequest,
  analysisState: DependencyAnalysisResult["analysisState"],
  sharedDependenciesDetected: number,
  dependencyChainsDetected: number,
  dependencyGapsDetected: number,
  dependencyContinuityVerified: boolean,
  dependencyConflictsDetected: number,
  tenantIsolationVerified: boolean,
  analysisHash: string,
): DependencyAnalysisResult {
  return Object.freeze({
    tenantId: request.tenantId,
    analysisState,
    sharedDependenciesDetected,
    dependencyChainsDetected,
    dependencyGapsDetected,
    dependencyContinuityVerified,
    dependencyConflictsDetected,
    tenantIsolationVerified,
    analysisHash,
    deterministic: true,
  });
}

function buildObservability(result: DependencyAnalysisResult): DependencyAnalysisObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    analysisState: result.analysisState,
    sharedDependenciesDetected: result.sharedDependenciesDetected,
    dependencyChainsDetected: result.dependencyChainsDetected,
    dependencyGapsDetected: result.dependencyGapsDetected,
    dependencyContinuityVerified: result.dependencyContinuityVerified,
    dependencyConflictsDetected: result.dependencyConflictsDetected,
    analysisHash: result.analysisHash,
  });
}

function buildValidation(
  analysisState: DependencyAnalysisResult["analysisState"],
  reasonCodes: readonly DependencyAnalysisReasonCode[],
  sharedDependenciesDetected: number,
  dependencyChainsDetected: number,
  dependencyGapsDetected: number,
  dependencyContinuityVerified: boolean,
  dependencyConflictsDetected: number,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
): DependencyAnalysisValidation {
  return Object.freeze({
    valid: analysisState !== "INVALID",
    analysisState,
    reasonCodes: [...reasonCodes],
    sharedDependenciesDetected,
    dependencyChainsDetected,
    dependencyGapsDetected,
    dependencyContinuityVerified,
    dependencyConflictsDetected,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: boundary.controlSurfaceAbsent,
  });
}

export function buildDependencyAnalysisRequest(request: DependencyAnalysisRequest): DependencyAnalysisRequest {
  return requestCore(request);
}

export function sealDependencyAnalysis(input: DependencyAnalysisInput): SealedDependencyAnalysisRecord {
  const reasons: DependencyAnalysisReasonCode[] = [];
  const dependencies = orderedDependencies(input);
  const sharedCount = sharedDependenciesDetected(dependencies);
  const chains = dependencyChainsDetected(dependencies);
  const gaps = dependencyGapsDetected(input);
  const conflicts = dependencyConflictsDetected(input);
  const continuityVerified = dependencyContinuityVerified(input);
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.analysisScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const membershipValid = validateMembership(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const sharedValid = validateSharedDependencies(sharedCount, reasons);
  const chainsAnalyzed = validateChains(chains.count, reasons);
  const gapsClear = validateGaps(gaps.count, reasons);
  const continuityValid = validateContinuity(continuityVerified, reasons);
  const conflictsClear = validateConflicts(conflicts.count, reasons);
  const governanceValid = validateGovernance(input, reasons);
  const replayValidation = validateReplay(input, reasons);
  const referencesPresent = validateDependencyReferences(dependencies, reasons);
  const boundary = validateBoundary(input, reasons);
  const evidencePath = createDependencyAnalysisEvidencePath(input, chains.refs, gaps.refs, conflicts.refs);
  const limitsValid = validateLimits(
    input.request.recommendationIds.length,
    dependencies.length,
    chains.count,
    conflicts.count,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_ANALYSIS_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValidation.valid
    || boundary.invalidBoundary;
  const observe = !invalid && (!membershipValid || !sharedValid);
  const limited = !invalid && !observe && (!referencesPresent || !chainsAnalyzed || !gapsClear || !continuityValid || !conflictsClear || replayValidation.limited || !limitsValid);
  const analysisState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "ANALYZED";

  const analysisHash = hashAnalysisValue("dependency-analysis-engine", {
    request: requestCore(input.request),
    analysisState,
    dependencyReferences: evidencePath.dependencyReferences,
    chainReferences: evidencePath.chainReferences,
    gapReferences: evidencePath.gapReferences,
    conflictReferences: evidencePath.conflictReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    analysisState,
    sharedCount,
    chains.count,
    gaps.count,
    continuityVerified,
    conflicts.count,
    tenantIsolationVerified,
    analysisHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    analysisState,
    reasons,
    sharedCount,
    chains.count,
    gaps.count,
    continuityVerified,
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
    approvalOrderingAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
