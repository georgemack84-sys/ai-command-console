import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationDependency,
  RecommendationDependencyEvidencePath,
  RecommendationDependencyFoundationInput,
  RecommendationDependencyFoundationObservability,
  RecommendationDependencyFoundationReasonCode,
  RecommendationDependencyFoundationRequest,
  RecommendationDependencyFoundationResult,
  RecommendationDependencyScope,
  RecommendationDependencyFoundationValidation,
  RecommendationDependencyType,
  SealedRecommendationDependencyFoundationRecord,
} from "./types";

const MAX_RECOMMENDATIONS = 10_000;
const MAX_DEPENDENCIES = 50_000;
const MAX_GOVERNANCE_DEPENDENCIES = 10_000;
const MAX_REPLAY_DEPENDENCIES = 10_000;

const DEPENDENCY_SCOPES: readonly RecommendationDependencyScope[] = Object.freeze([
  "EVIDENCE",
  "LINEAGE",
  "GOVERNANCE",
  "REPLAY",
  "FULL",
]);

type DependencyDescriptor = Readonly<{
  sourceRecommendationId: string;
  targetRecommendationId: string;
  dependencyType: RecommendationDependencyType;
  sharedReferences: readonly string[];
}>;

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
  controlSurfaceAbsent: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: RecommendationDependencyFoundationReasonCode[], reason: RecommendationDependencyFoundationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashDependencyValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationDependencyFoundationRequest): RecommendationDependencyFoundationRequest {
  return Object.freeze({
    tenantId: request.tenantId,
    recommendationIds: [...request.recommendationIds],
    dependencyScope: request.dependencyScope,
    graphVersion: request.graphVersion,
  });
}

function recommendationId(bundle: RecommendationDependencyFoundationInput["recommendations"][number]): string {
  return bundle.ledger.entry.recommendationId;
}

function orderedBundles(input: RecommendationDependencyFoundationInput) {
  return [...input.recommendations].sort((left, right) => recommendationId(left).localeCompare(recommendationId(right)));
}

function intersect(left: readonly string[], right: readonly string[]): string[] {
  const rightSet = new Set(right);
  return normalizeStrings(left.filter((value) => rightSet.has(value)));
}

function collectEvidenceReferences(bundle: RecommendationDependencyFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.evidenceIds,
    ...bundle.ledger.evidencePath.evidenceIds,
    ...bundle.lineage.evidencePath.evidenceIds,
    ...bundle.verification.evidencePath.evidenceIds,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.integrity.evidencePath.evidenceIds,
    ...bundle.certification.evidencePath.evidenceIds,
    ...bundle.observability.evidencePath.evidenceIds,
    ...bundle.audit.evidencePath.evidenceIds,
    ...bundle.readiness.evidencePath.evidenceReferences,
    ...bundle.alignment.evidencePath.evidenceReferences,
  ]);
}

function collectLineageReferences(bundle: RecommendationDependencyFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.ledger.entry.lineageReferences,
    ...bundle.lineage.ancestryChain.map((node) => node.lineageReference),
    ...bundle.lineage.evidencePath.lineageReferences,
    ...bundle.verification.evidencePath.lineageReferences,
    ...bundle.audit.evidencePath.lineageReferences,
    ...bundle.replayFramework.evidencePath.lineageReferences,
  ]);
}

function collectGovernanceReferences(bundle: RecommendationDependencyFoundationInput["recommendations"][number]): string[] {
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

function collectReplayReferences(bundle: RecommendationDependencyFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.replayEvidence.replayReferences,
    ...bundle.replay.evidencePath.evidenceIds,
    ...bundle.governanceReplay.evidencePath.replayReferences,
    ...bundle.replayFramework.evidencePath.replayReferences,
    ...bundle.readinessCertification.evidencePath.replayReferences,
  ]);
}

function collectReadinessReferences(bundle: RecommendationDependencyFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.readiness.evidencePath.evidenceReferences,
    ...bundle.reviewPacket.evidencePath.evidenceReferences,
  ]);
}

function collectAlignmentReferences(bundle: RecommendationDependencyFoundationInput["recommendations"][number]): string[] {
  return normalizeStrings([
    ...bundle.alignment.evidencePath.alignmentReferences,
    ...bundle.alignment.evidencePath.governanceReferences,
  ]);
}

function collectEvidenceHashes(bundle: RecommendationDependencyFoundationInput["recommendations"][number]): string[] {
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
    bundle.governanceReplay.result.replayHash,
    bundle.readiness.result.readinessHash,
    bundle.alignment.result.alignmentHash,
  ]);
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

function descriptorToDependency(descriptor: DependencyDescriptor): RecommendationDependency {
  const dependencyHash = hashDependencyValue("recommendation-dependency", descriptor);
  return Object.freeze({
    dependencyId: hashDependencyValue("recommendation-dependency-id", {
      sourceRecommendationId: descriptor.sourceRecommendationId,
      targetRecommendationId: descriptor.targetRecommendationId,
      dependencyType: descriptor.dependencyType,
    }),
    sourceRecommendationId: descriptor.sourceRecommendationId,
    targetRecommendationId: descriptor.targetRecommendationId,
    dependencyType: descriptor.dependencyType,
    dependencyHash,
  });
}

function createDependencies(input: RecommendationDependencyFoundationInput): RecommendationDependency[] {
  const bundles = orderedBundles(input);
  const dependencies: RecommendationDependency[] = [];
  for (let i = 0; i < bundles.length; i += 1) {
    for (let j = i + 1; j < bundles.length; j += 1) {
      const left = bundles[i];
      const right = bundles[j];
      const descriptors: DependencyDescriptor[] = [
        { sourceRecommendationId: recommendationId(left), targetRecommendationId: recommendationId(right), dependencyType: "EVIDENCE", sharedReferences: intersect(collectEvidenceReferences(left), collectEvidenceReferences(right)) },
        { sourceRecommendationId: recommendationId(left), targetRecommendationId: recommendationId(right), dependencyType: "LINEAGE", sharedReferences: intersect(collectLineageReferences(left), collectLineageReferences(right)) },
        { sourceRecommendationId: recommendationId(left), targetRecommendationId: recommendationId(right), dependencyType: "GOVERNANCE", sharedReferences: intersect(collectGovernanceReferences(left), collectGovernanceReferences(right)) },
        { sourceRecommendationId: recommendationId(left), targetRecommendationId: recommendationId(right), dependencyType: "REPLAY", sharedReferences: intersect(collectReplayReferences(left), collectReplayReferences(right)) },
        { sourceRecommendationId: recommendationId(left), targetRecommendationId: recommendationId(right), dependencyType: "READINESS", sharedReferences: intersect(collectReadinessReferences(left), collectReadinessReferences(right)) },
        { sourceRecommendationId: recommendationId(left), targetRecommendationId: recommendationId(right), dependencyType: "ALIGNMENT", sharedReferences: intersect(collectAlignmentReferences(left), collectAlignmentReferences(right)) },
      ];
      for (const descriptor of descriptors) {
        if (descriptor.sharedReferences.length > 0) dependencies.push(descriptorToDependency(descriptor));
      }
    }
  }
  return dependencies.sort((a, b) => (
    a.sourceRecommendationId.localeCompare(b.sourceRecommendationId)
    || a.targetRecommendationId.localeCompare(b.targetRecommendationId)
    || a.dependencyType.localeCompare(b.dependencyType)
    || a.dependencyId.localeCompare(b.dependencyId)
  ));
}

function validateScope(scope: RecommendationDependencyScope, reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const valid = DEPENDENCY_SCOPES.includes(scope);
  addReason(reasons, valid ? "DEPENDENCY_SCOPE_VALID" : "DEPENDENCY_SCOPE_INVALID");
  return valid;
}

function validateRecommendationIds(request: RecommendationDependencyFoundationRequest, reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const valid = request.recommendationIds.length > 0;
  addReason(reasons, valid ? "RECOMMENDATION_IDS_PRESENT" : "RECOMMENDATION_IDS_MISSING");
  return valid;
}

function validateSealedArtifacts(input: RecommendationDependencyFoundationInput, reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const sealed = input.portfolio.sealed === true
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

function validateMembership(input: RecommendationDependencyFoundationInput, reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const requested = normalizeStrings(input.request.recommendationIds);
  const actual = normalizeStrings(orderedBundles(input).map(recommendationId));
  const valid = requested.length === actual.length && requested.every((value, index) => value === actual[index]);
  addReason(reasons, valid ? "MEMBERSHIP_COMPLETE" : "DEPENDENCY_EVIDENCE_MISSING");
  return valid;
}

function validateTenantScope(input: RecommendationDependencyFoundationInput, reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.portfolio.result.tenantIsolationVerified
    && input.relationshipAnalysis.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && orderedBundles(input).every((bundle) => (
      bundle.ledger.entry.tenantId === tenantId
      && bundle.governanceReferences.tenantId === tenantId
      && bundle.ownershipEvidence.tenantId === tenantId
      && bundle.replayEvidence.tenantId === tenantId
    ));
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_DEPENDENCIES_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationDependencyFoundationInput, reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const valid = orderedBundles(input).every((bundle) => (
    bundle.ownershipEvidence.recommendationId === recommendationId(bundle)
    && bundle.certification.result.ownershipCertified
    && bundle.authorityScope.result.ownershipValidated
  ));
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGovernance(input: RecommendationDependencyFoundationInput, reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const valid = input.portfolio.result.governanceBound
    && input.certification.result.governanceCertified
    && orderedBundles(input).every((bundle) => (
      bundle.binding.result.bindingState !== "INVALID"
      && bundle.authorityScope.result.scopeState !== "INVALID"
      && bundle.policyVisibility.result.visibilityState !== "INVALID"
      && bundle.governanceCertification.result.certificationState !== "FAIL"
    ));
  addReason(reasons, valid ? "GOVERNANCE_DEPENDENCIES_VALID" : "GOVERNANCE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: RecommendationDependencyFoundationInput, reasons: RecommendationDependencyFoundationReasonCode[]): { valid: boolean; limited: boolean } {
  const invalid = input.replay.result.replayState === "INVALID" || input.replay.result.replayState === "ESCALATED";
  const limited = !invalid && (
    input.replay.result.replayState === "LIMITED"
    || orderedBundles(input).some((bundle) => bundle.replayEvidence.replayReferences.length === 0)
  );
  if (invalid) addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  else addReason(reasons, "REPLAY_DEPENDENCIES_VALID");
  return { valid: !invalid, limited };
}

function validateLineage(input: RecommendationDependencyFoundationInput, reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const valid = input.portfolio.result.lineageBound
    && input.certification.validation.lineageCertified
    && orderedBundles(input).every((bundle) => (
      bundle.lineage.result.reconstructionState !== "INVALID"
      && bundle.lineage.result.lineageIntegrity
      && collectLineageReferences(bundle).length > 0
    ));
  addReason(reasons, valid ? "LINEAGE_DEPENDENCIES_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateDependencyReferences(dependencies: readonly RecommendationDependency[], reasons: RecommendationDependencyFoundationReasonCode[]): boolean {
  const present = dependencies.length > 0;
  addReason(reasons, present ? "DEPENDENCY_REFERENCES_PRESENT" : "DEPENDENCY_REFERENCES_MISSING");
  return present;
}

function validateBoundary(input: RecommendationDependencyFoundationInput, reasons: RecommendationDependencyFoundationReasonCode[]): BoundaryValidation {
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
  addReason(reasons, input.dependencyMutationAttempted === true ? "DEPENDENCY_MUTATION_DETECTED" : "DEPENDENCY_MUTATION_BLOCKED");
  addReason(reasons, controlSurfaceAbsent ? "CONTROL_SURFACE_ABSENT" : "CONTROL_SURFACE_DETECTED");
  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary: !executionImpossible
      || input.workflowRoutingRequested === true
      || input.prioritizationRequested === true
      || input.approvalOrderingRequested === true
      || !authorityBounded
      || input.dependencyMutationAttempted === true
      || !controlSurfaceAbsent,
    controlSurfaceAbsent,
  });
}

export function createRecommendationDependencyEvidencePath(
  input: RecommendationDependencyFoundationInput,
  dependencies: readonly RecommendationDependency[],
): RecommendationDependencyEvidencePath {
  const bundles = orderedBundles(input);
  return Object.freeze({
    scope: input.request.dependencyScope,
    dependencyReferences: normalizeStrings(dependencies.map((dependency) => dependency.dependencyId)),
    lineageReferences: normalizeStrings(bundles.flatMap(collectLineageReferences)),
    replayReferences: normalizeStrings(bundles.flatMap(collectReplayReferences)),
    governanceReferences: normalizeStrings(bundles.flatMap(collectGovernanceReferences)),
    evidenceHashes: normalizeStrings([
      input.portfolio.result.portfolioHash,
      input.relationshipAnalysis.result.analysisHash,
      input.observability.result.observabilityHash,
      input.replay.result.replayHash,
      input.certification.result.certificationHash,
      ...bundles.flatMap(collectEvidenceHashes),
      ...dependencies.map((dependency) => dependency.dependencyHash),
    ]),
  });
}

function validateLimits(
  recommendationCount: number,
  dependencyCount: number,
  governanceDependencyCount: number,
  replayDependencyCount: number,
  reasons: RecommendationDependencyFoundationReasonCode[],
): boolean {
  const valid = recommendationCount <= MAX_RECOMMENDATIONS
    && dependencyCount <= MAX_DEPENDENCIES
    && governanceDependencyCount <= MAX_GOVERNANCE_DEPENDENCIES
    && replayDependencyCount <= MAX_REPLAY_DEPENDENCIES;
  addReason(reasons, recommendationCount <= MAX_RECOMMENDATIONS ? "RECOMMENDATION_LIMIT_VALID" : "RECOMMENDATION_LIMIT_EXCEEDED");
  addReason(reasons, dependencyCount <= MAX_DEPENDENCIES ? "DEPENDENCY_LIMIT_VALID" : "DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, governanceDependencyCount <= MAX_GOVERNANCE_DEPENDENCIES ? "GOVERNANCE_DEPENDENCY_LIMIT_VALID" : "GOVERNANCE_DEPENDENCY_LIMIT_EXCEEDED");
  addReason(reasons, replayDependencyCount <= MAX_REPLAY_DEPENDENCIES ? "REPLAY_DEPENDENCY_LIMIT_VALID" : "REPLAY_DEPENDENCY_LIMIT_EXCEEDED");
  return valid;
}

function buildResult(
  request: RecommendationDependencyFoundationRequest,
  dependencyState: RecommendationDependencyFoundationResult["dependencyState"],
  dependencies: readonly RecommendationDependency[],
  tenantIsolationVerified: boolean,
  dependencyGraphHash: string,
): RecommendationDependencyFoundationResult {
  return Object.freeze({
    tenantId: request.tenantId,
    dependencyState,
    dependenciesCreated: dependencies.length,
    governanceDependenciesDetected: dependencies.filter((dependency) => dependency.dependencyType === "GOVERNANCE").length,
    replayDependenciesDetected: dependencies.filter((dependency) => dependency.dependencyType === "REPLAY").length,
    lineageDependenciesDetected: dependencies.filter((dependency) => dependency.dependencyType === "LINEAGE").length,
    tenantIsolationVerified,
    dependencyGraphHash,
    deterministic: true,
  });
}

function buildObservability(result: RecommendationDependencyFoundationResult): RecommendationDependencyFoundationObservability {
  return Object.freeze({
    tenantId: result.tenantId,
    dependencyState: result.dependencyState,
    dependenciesCreated: result.dependenciesCreated,
    governanceDependenciesDetected: result.governanceDependenciesDetected,
    replayDependenciesDetected: result.replayDependenciesDetected,
    lineageDependenciesDetected: result.lineageDependenciesDetected,
    dependencyGraphHash: result.dependencyGraphHash,
  });
}

function buildValidation(
  dependencyState: RecommendationDependencyFoundationResult["dependencyState"],
  reasonCodes: readonly RecommendationDependencyFoundationReasonCode[],
  governanceDependenciesValid: boolean,
  replayDependenciesValid: boolean,
  lineageDependenciesValid: boolean,
  ownershipValid: boolean,
  tenantIsolationVerified: boolean,
  boundary: BoundaryValidation,
  counts: Readonly<{
    dependenciesCreated: number;
    governanceDependenciesDetected: number;
    replayDependenciesDetected: number;
    lineageDependenciesDetected: number;
  }>,
): RecommendationDependencyFoundationValidation {
  return Object.freeze({
    valid: dependencyState !== "INVALID",
    dependencyState,
    reasonCodes: [...reasonCodes],
    governanceDependenciesValid,
    replayDependenciesValid,
    lineageDependenciesValid,
    ownershipValid,
    tenantIsolationVerified,
    deterministic: true,
    readOnly: true,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true,
    dependenciesCreated: counts.dependenciesCreated,
    governanceDependenciesDetected: counts.governanceDependenciesDetected,
    replayDependenciesDetected: counts.replayDependenciesDetected,
    lineageDependenciesDetected: counts.lineageDependenciesDetected,
  });
}

export function buildRecommendationDependencyFoundationRequest(
  request: RecommendationDependencyFoundationRequest,
): RecommendationDependencyFoundationRequest {
  return requestCore(request);
}

export function sealRecommendationDependencyFoundation(input: RecommendationDependencyFoundationInput): SealedRecommendationDependencyFoundationRecord {
  const reasons: RecommendationDependencyFoundationReasonCode[] = [];
  const dependencies = createDependencies(input);
  const evidencePath = createRecommendationDependencyEvidencePath(input, dependencies);
  const requestValid = validateRecommendationIds(input.request, reasons)
    && validateScope(input.request.dependencyScope, reasons);
  const sealedValid = validateSealedArtifacts(input, reasons);
  const membershipValid = validateMembership(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const ownershipValid = validateOwnership(input, reasons);
  const governanceValid = validateGovernance(input, reasons);
  const replayValidation = validateReplay(input, reasons);
  const lineageValid = validateLineage(input, reasons);
  const referencesPresent = validateDependencyReferences(dependencies, reasons);
  const boundary = validateBoundary(input, reasons);
  const counts = Object.freeze({
    dependenciesCreated: dependencies.length,
    governanceDependenciesDetected: dependencies.filter((dependency) => dependency.dependencyType === "GOVERNANCE").length,
    replayDependenciesDetected: dependencies.filter((dependency) => dependency.dependencyType === "REPLAY").length,
    lineageDependenciesDetected: dependencies.filter((dependency) => dependency.dependencyType === "LINEAGE").length,
  });
  const limitsValid = validateLimits(
    normalizeStrings(input.request.recommendationIds).length,
    counts.dependenciesCreated,
    counts.governanceDependenciesDetected,
    counts.replayDependenciesDetected,
    reasons,
  );
  addReason(reasons, "DEPENDENCY_FOUNDATION_IS_NOT_CONTROL");

  const invalid = !requestValid
    || !sealedValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !governanceValid
    || !replayValidation.valid
    || !lineageValid
    || boundary.invalidBoundary
    || !limitsValid;
  const observe = !invalid && (!membershipValid || !referencesPresent);
  const limited = !invalid && !observe && replayValidation.limited;
  const dependencyState = invalid ? "INVALID" : limited ? "LIMITED" : observe ? "OBSERVE" : "ESTABLISHED";

  const dependencyGraphHash = hashDependencyValue("recommendation-dependency-foundation", {
    request: requestCore(input.request),
    dependencyState,
    dependencyReferences: evidencePath.dependencyReferences,
    lineageReferences: evidencePath.lineageReferences,
    replayReferences: evidencePath.replayReferences,
    governanceReferences: evidencePath.governanceReferences,
    evidenceHashes: evidencePath.evidenceHashes,
  });

  const result = buildResult(
    input.request,
    dependencyState,
    dependencies,
    tenantIsolationVerified,
    dependencyGraphHash,
  );
  const observability = buildObservability(result);
  const validation = buildValidation(
    dependencyState,
    reasons,
    governanceValid,
    replayValidation.valid && !replayValidation.limited,
    lineageValid,
    ownershipValid,
    tenantIsolationVerified,
    boundary,
    counts,
  );

  return Object.freeze({
    result,
    dependencies,
    evidencePath,
    validation,
    observability,
    sealed: true,
    readOnly: true,
    dependencyOnly: true,
    executionAuthorized: false,
    workflowRoutingAllowed: false,
    prioritizationAllowed: false,
    approvalOrderingAllowed: false,
    authorityMutationAllowed: false,
    controlSurfacePresent: false,
  });
}
