import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  GovernanceReplayEvidencePath,
  GovernanceReplayInput,
  GovernanceReplayObservability,
  GovernanceReplayReasonCode,
  GovernanceReplayRequest,
  GovernanceReplayResult,
  GovernanceReplayScope,
  GovernanceReplayValidation,
  SealedGovernanceReplayRecord,
} from "./types";

const MAX_REPLAY_DEPTH = 20;
const MAX_GOVERNANCE_REFERENCES = 5000;
const MAX_REPLAY_REFERENCES = 1000;

const REPLAY_SCOPES: readonly GovernanceReplayScope[] = Object.freeze([
  "AUTHORITY",
  "BINDINGS",
  "FULL",
  "LINEAGE",
  "POLICY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: GovernanceReplayReasonCode[], reason: GovernanceReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: GovernanceReplayRequest): GovernanceReplayRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    replayScope: request.replayScope,
    governanceReferences: normalizeStrings(request.governanceReferences),
    replayVersion: request.replayVersion,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: GovernanceReplayInput): string[] {
  return normalizeStrings([
    input.binding.result.governanceHash,
    input.authorityScope.result.authorityHash,
    input.policyVisibility.result.policyHash,
    input.observability.result.observabilityHash,
    input.inspection.result.inspectionHash,
    input.visibility.result.visibilityHash,
    input.audit.result.exportHash,
    input.ledger.result.ledgerHash,
    input.lineage.result.reconstructionHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.integrity.result.integrityHash,
    input.certification.result.certificationHash,
    input.governanceReferences.governanceHash,
    input.replayEvidence.replayHash,
    input.ownershipEvidence.ownershipHash,
  ]);
}

function governanceReferencesForScope(scope: GovernanceReplayScope, input: GovernanceReplayInput): string[] {
  if (scope === "LINEAGE") return [];
  return normalizeStrings([
    ...input.request.governanceReferences,
    ...input.governanceReferences.governanceReferences,
    ...input.binding.evidencePath.governanceReferences,
  ]);
}

function replayReferencesForScope(scope: GovernanceReplayScope, input: GovernanceReplayInput): string[] {
  if (scope === "BINDINGS") {
    return normalizeStrings([...input.binding.evidencePath.replayReferences]);
  }
  if (scope === "AUTHORITY") {
    return normalizeStrings([...input.replayEvidence.replayReferences]);
  }
  if (scope === "POLICY") {
    return normalizeStrings([...input.audit.evidencePath.evidenceIds]);
  }
  if (scope === "LINEAGE") {
    return normalizeStrings([...input.lineage.evidencePath.evidenceIds]);
  }
  return normalizeStrings([
    ...input.binding.evidencePath.replayReferences,
    ...input.replayEvidence.replayReferences,
    ...input.audit.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
  ]);
}

function lineageReferencesForScope(scope: GovernanceReplayScope, input: GovernanceReplayInput): string[] {
  if (scope === "AUTHORITY") return [];
  return normalizeStrings([
    ...input.lineage.evidencePath.lineageReferences,
    ...input.binding.evidencePath.lineageReferences,
    ...input.policyVisibility.evidencePath.lineageReferences,
  ]);
}

function validateSealedArtifacts(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const states = [
    [input.binding.sealed, "BINDING_REQUIRED", "BINDING_UNSEALED"],
    [input.authorityScope.sealed, "AUTHORITY_SCOPE_REQUIRED", "AUTHORITY_SCOPE_UNSEALED"],
    [input.policyVisibility.sealed, "POLICY_VISIBILITY_REQUIRED", "POLICY_VISIBILITY_UNSEALED"],
    [input.observability.sealed, "OBSERVABILITY_REQUIRED", "OBSERVABILITY_UNSEALED"],
    [input.inspection.sealed, "INSPECTION_REQUIRED", "INSPECTION_UNSEALED"],
    [input.visibility.sealed, "VISIBILITY_REQUIRED", "VISIBILITY_UNSEALED"],
    [input.audit.sealed, "AUDIT_REQUIRED", "AUDIT_UNSEALED"],
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.integrity.sealed, "INTEGRITY_REQUIRED", "INTEGRITY_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
    [input.governanceReferences.sealed, "GOVERNANCE_REFERENCES_REQUIRED", "GOVERNANCE_REFERENCES_UNSEALED"],
    [input.replayEvidence.sealed, "REPLAY_EVIDENCE_REQUIRED", "REPLAY_EVIDENCE_UNSEALED"],
    [input.ownershipEvidence.sealed, "OWNERSHIP_EVIDENCE_REQUIRED", "OWNERSHIP_EVIDENCE_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateScope(scope: GovernanceReplayScope, reasons: GovernanceReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: GovernanceReplayRequest, reasons: GovernanceReplayReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.binding.result.tenantIsolationVerified
    && input.authorityScope.result.tenantIsolationVerified
    && input.policyVisibility.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
    && input.visibility.result.tenantIsolationVerified
    && input.audit.result.tenantIsolationVerified
    && input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && input.governanceReferences.tenantId === tenantId
    && input.replayEvidence.tenantId === tenantId
    && input.ownershipEvidence.tenantId === tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_REPLAY_BLOCKED");
  return valid;
}

function validateOwnership(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const valid = input.ownershipEvidence.recommendationId === input.request.recommendationId
    && input.ownershipEvidence.ownershipReferences.length > 0
    && input.authorityScope.result.ownershipValidated
    && input.binding.validation.governanceBound;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGovernanceReconstruction(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const refs = normalizeStrings(input.request.governanceReferences);
  const sealedRefs = normalizeStrings(input.governanceReferences.governanceReferences);
  const reconstructed = refs.length > 0 && refs.every((reference) => sealedRefs.includes(reference));
  addReason(reasons, reconstructed ? "GOVERNANCE_RECONSTRUCTED" : "GOVERNANCE_REFERENCES_MISSING");
  return reconstructed;
}

function validateAuthorityReconstruction(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const reconstructed = input.authorityScope.result.scopeValidated
    && input.authorityScope.result.governanceScopeValidated;
  addReason(reasons, reconstructed ? "AUTHORITY_RECONSTRUCTED" : "AUTHORITY_REPLAY_MISSING");
  return reconstructed;
}

function validatePolicyReconstruction(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const reconstructed = input.policyVisibility.result.policiesVisible
    && input.policyVisibility.result.constraintsVisible;
  addReason(reasons, reconstructed ? "POLICY_RECONSTRUCTED" : "POLICY_REPLAY_MISSING");
  return reconstructed;
}

function validateLineageReconstruction(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const reconstructed = input.lineage.result.lineageIntegrity
    && input.policyVisibility.result.lineageVisible
    && input.binding.result.lineageBound;
  addReason(reasons, reconstructed ? "LINEAGE_RECONSTRUCTED" : "LINEAGE_REPLAY_MISSING");
  return reconstructed;
}

function validateReplayPath(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const valid = input.replayEvidence.replayReferences.length > 0
    && input.replay.result.replayIntegrity
    && input.audit.result.replayIncluded;
  addReason(reasons, valid ? "REPLAY_PATH_VALID" : "REPLAY_ARTIFACTS_MISSING");
  return valid;
}

function validateReconstruction(
  governanceReconstructed: boolean,
  authorityReconstructed: boolean,
  policyReconstructed: boolean,
  lineageReconstructed: boolean,
  reasons: GovernanceReplayReasonCode[],
): boolean {
  const valid = authorityReconstructed && policyReconstructed && lineageReconstructed;
  addReason(reasons, valid ? "RECONSTRUCTION_VALID" : "RECONSTRUCTION_BROKEN");
  return valid;
}

function validateEvidenceHashes(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return valid;
}

function validateHiddenReplayState(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): boolean {
  const valid = input.hiddenReplayStateDetected !== true;
  addReason(reasons, valid ? "HIDDEN_REPLAY_STATE_ABSENT" : "HIDDEN_REPLAY_STATE_DETECTED");
  return valid;
}

function validateBoundary(input: GovernanceReplayInput, reasons: GovernanceReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.binding.validation.authorityBounded
    && input.authorityScope.validation.authorityBounded
    && input.policyVisibility.validation.authorityBounded
    && input.observability.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.visibility.validation.authorityBounded
    && input.audit.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded;
  const invalidBoundary = input.replayMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalBehaviorRequested === true
    || input.policyExecutionRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenReplayStateDetected === true;
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalBehaviorRequested === true ? "APPROVAL_BEHAVIOR_DETECTED" : "APPROVAL_BEHAVIOR_BLOCKED");
  addReason(reasons, input.policyExecutionRequested === true ? "POLICY_EXECUTION_DETECTED" : "POLICY_EXECUTION_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "GOVERNANCE_REPLAY_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: GovernanceReplayEvidencePath, reasons: GovernanceReplayReasonCode[]): boolean {
  const depthValid = path.governanceReferences.length <= MAX_REPLAY_DEPTH;
  const governanceValid = path.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES;
  const replayValid = path.replayReferences.length <= MAX_REPLAY_REFERENCES;
  addReason(reasons, depthValid ? "REPLAY_DEPTH_VALID" : "REPLAY_DEPTH_EXCEEDED");
  addReason(reasons, governanceValid ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayValid ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && governanceValid && replayValid;
}

function classifyReplayState(
  valid: boolean,
  governanceReconstructed: boolean,
  replayPathValid: boolean,
  reconstructionValid: boolean,
  evidenceHashesValid: boolean,
): GovernanceReplayResult["replayState"] {
  if (!valid) return "INVALID";
  if (!reconstructionValid || !evidenceHashesValid) return "ESCALATED";
  if (!governanceReconstructed || !replayPathValid) return "LIMITED";
  return "REPLAYABLE";
}

export function buildGovernanceReplayRequest(
  input: Omit<GovernanceReplayInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    replayScope?: GovernanceReplayScope;
    requestedGovernanceReferences?: readonly string[];
    replayVersion?: string;
    graphVersion?: string;
  },
): GovernanceReplayRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    replayScope: input.replayScope ?? "FULL",
    governanceReferences: normalizeStrings(input.requestedGovernanceReferences ?? input.governanceReferences.governanceReferences),
    replayVersion: input.replayVersion ?? "governance-replay/v1",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as GovernanceReplayRequest);
}

export function createGovernanceReplayEvidencePath(input: GovernanceReplayInput): GovernanceReplayEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.replayScope,
    governanceReferences: Object.freeze(governanceReferencesForScope(request.replayScope, input)),
    replayReferences: Object.freeze(replayReferencesForScope(request.replayScope, input)),
    lineageReferences: Object.freeze(lineageReferencesForScope(request.replayScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateGovernanceReplay(input: GovernanceReplayInput): GovernanceReplayValidation {
  const reasons: GovernanceReplayReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createGovernanceReplayEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.replayScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const governanceReconstructed = validateGovernanceReconstruction(normalizedInput, reasons);
  const authorityReconstructed = validateAuthorityReconstruction(normalizedInput, reasons);
  const policyReconstructed = validatePolicyReconstruction(normalizedInput, reasons);
  const lineageReconstructed = validateLineageReconstruction(normalizedInput, reasons);
  const replayPathValid = validateReplayPath(normalizedInput, reasons);
  const reconstructionValid = validateReconstruction(
    governanceReconstructed,
    authorityReconstructed,
    policyReconstructed,
    lineageReconstructed,
    reasons,
  );
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const hiddenReplayValid = validateHiddenReplayState(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && hiddenReplayValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    replayState: classifyReplayState(valid, governanceReconstructed, replayPathValid, reconstructionValid, evidenceHashesValid),
    reasonCodes: normalizeStrings(reasons) as readonly GovernanceReplayReasonCode[],
    governanceReconstructed,
    authorityReconstructed,
    policyReconstructed,
    lineageReconstructed,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    replayReferenceCount: evidencePath.replayReferences.length,
  });
}

export function buildGovernanceReplayResult(input: GovernanceReplayInput): GovernanceReplayResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createGovernanceReplayEvidencePath(normalizedInput);
  const validation = validateGovernanceReplay(normalizedInput);

  const replayHash = hashReplayValue("governance-replay-framework-replay", {
    request,
    replayReferences: evidencePath.replayReferences,
    evidenceHashes: evidencePath.evidenceHashes,
    replayState: validation.replayState,
  });
  const reconstructionHash = hashReplayValue("governance-replay-framework-reconstruction", {
    request,
    governanceReferences: evidencePath.governanceReferences,
    lineageReferences: evidencePath.lineageReferences,
    governanceReconstructed: validation.governanceReconstructed,
    authorityReconstructed: validation.authorityReconstructed,
    policyReconstructed: validation.policyReconstructed,
    lineageReconstructed: validation.lineageReconstructed,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    replayState: validation.replayState,
    governanceReconstructed: validation.governanceReconstructed,
    authorityReconstructed: validation.authorityReconstructed,
    policyReconstructed: validation.policyReconstructed,
    lineageReconstructed: validation.lineageReconstructed,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

export function buildGovernanceReplayObservability(result: GovernanceReplayResult): GovernanceReplayObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    replayState: result.replayState,
    governanceReconstructed: result.governanceReconstructed,
    authorityReconstructed: result.authorityReconstructed,
    policyReconstructed: result.policyReconstructed,
    lineageReconstructed: result.lineageReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

export function sealGovernanceReplay(input: GovernanceReplayInput): SealedGovernanceReplayRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createGovernanceReplayEvidencePath(normalizedInput);
  const validation = validateGovernanceReplay(normalizedInput);
  const result = buildGovernanceReplayResult(normalizedInput);
  const observability = buildGovernanceReplayObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    replayOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    approvalBehaviorAllowed: false as const,
    policyExecutionAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const GovernanceReplayValidator = Object.freeze({
  validate: validateGovernanceReplay,
});

export const GovernanceReplayFramework = Object.freeze({
  buildRequest: buildGovernanceReplayRequest,
  createEvidencePath: createGovernanceReplayEvidencePath,
  buildResult: buildGovernanceReplayResult,
  seal: sealGovernanceReplay,
});

export const GovernanceReplayObservabilityService = Object.freeze({
  build: buildGovernanceReplayObservability,
});
