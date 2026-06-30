import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationAuthorityScope,
  RecommendationAuthorityScopeEvidencePath,
  RecommendationAuthorityScopeInput,
  RecommendationAuthorityScopeObservability,
  RecommendationAuthorityScopeReasonCode,
  RecommendationAuthorityScopeRequest,
  RecommendationAuthorityScopeResult,
  RecommendationAuthorityScopeValidation,
  SealedRecommendationAuthorityScopeRecord,
} from "./types";

const MAX_SCOPE_DEPTH = 20;
const MAX_GOVERNANCE_REFERENCES = 5000;
const MAX_SCOPE_REFERENCES = 1000;

const AUTHORITY_SCOPES: readonly RecommendationAuthorityScope[] = Object.freeze([
  "ANALYSIS_ONLY",
  "AUDIT_ONLY",
  "FULL_VISIBILITY",
  "GOVERNANCE_ONLY",
  "OBSERVE_ONLY",
]);

const SCOPE_BINDINGS = Object.freeze({
  OBSERVE_ONLY: Object.freeze(["OBSERVABILITY", "OWNERSHIP"] as const),
  ANALYSIS_ONLY: Object.freeze(["OBSERVABILITY", "REPLAY"] as const),
  AUDIT_ONLY: Object.freeze(["FULL", "REPLAY"] as const),
  GOVERNANCE_ONLY: Object.freeze(["FULL", "OWNERSHIP"] as const),
  FULL_VISIBILITY: Object.freeze(["FULL"] as const),
}) satisfies Readonly<Record<RecommendationAuthorityScope, readonly string[]>>;

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: RecommendationAuthorityScopeReasonCode[], reason: RecommendationAuthorityScopeReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashAuthorityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationAuthorityScopeRequest): RecommendationAuthorityScopeRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    authorityScope: request.authorityScope,
    governanceReferences: normalizeStrings(request.governanceReferences),
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: RecommendationAuthorityScopeInput): string[] {
  return normalizeStrings([
    input.binding.result.governanceHash,
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
    input.ownershipEvidence.ownershipHash,
    input.replayEvidence.replayHash,
  ]);
}

function scopeReferences(input: RecommendationAuthorityScopeInput): string[] {
  const scope = input.request.authorityScope;
  if (scope === "OBSERVE_ONLY") {
    return normalizeStrings([
      ...input.observability.evidencePath.evidenceIds,
      ...input.visibility.evidencePath.evidenceIds,
    ]);
  }
  if (scope === "ANALYSIS_ONLY") {
    return normalizeStrings([
      ...input.inspection.evidencePath.evidenceIds,
      ...input.replay.evidencePath.evidenceIds,
    ]);
  }
  if (scope === "AUDIT_ONLY") {
    return normalizeStrings([
      ...input.audit.evidencePath.evidenceIds,
      ...input.replay.evidencePath.evidenceIds,
    ]);
  }
  if (scope === "GOVERNANCE_ONLY") {
    return normalizeStrings([
      ...input.binding.evidencePath.governanceReferences,
      ...input.certification.evidencePath.evidenceIds,
    ]);
  }
  return normalizeStrings([
    ...input.binding.evidencePath.governanceReferences,
    ...input.visibility.evidencePath.evidenceIds,
    ...input.inspection.evidencePath.evidenceIds,
    ...input.audit.evidencePath.evidenceIds,
  ]);
}

function validateSealedArtifacts(input: RecommendationAuthorityScopeInput, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const states = [
    [input.binding.sealed, "BINDING_REQUIRED", "BINDING_UNSEALED"],
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
    [input.ownershipEvidence.sealed, "OWNERSHIP_EVIDENCE_REQUIRED", "OWNERSHIP_EVIDENCE_UNSEALED"],
    [input.replayEvidence.sealed, "REPLAY_EVIDENCE_REQUIRED", "REPLAY_EVIDENCE_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateScope(scope: RecommendationAuthorityScope, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const valid = AUTHORITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "AUTHORITY_SCOPE_VALID" : "AUTHORITY_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationAuthorityScopeRequest, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: RecommendationAuthorityScopeInput, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.binding.result.tenantIsolationVerified
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
    && input.ownershipEvidence.tenantId === tenantId
    && input.replayEvidence.tenantId === tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_SCOPE_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationAuthorityScopeInput, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const valid = input.binding.validation.governanceBound
    && input.ownershipEvidence.recommendationId === input.request.recommendationId
    && input.ownershipEvidence.ownershipReferences.length > 0
    && input.ledger.result.ownershipVerified
    && input.binding.result.tenantIsolationVerified;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateGovernanceScope(
  input: RecommendationAuthorityScopeInput,
  reasons: RecommendationAuthorityScopeReasonCode[],
): Readonly<{ valid: boolean; mismatch: boolean }> {
  const allowed = SCOPE_BINDINGS[input.request.authorityScope];
  const bindingScope = input.binding.evidencePath.scope;
  const governanceRefs = normalizeStrings(input.request.governanceReferences);
  const sealedRefs = normalizeStrings(input.governanceReferences.governanceReferences);
  const present = governanceRefs.length > 0;
  const matches = present && governanceRefs.every((reference) => sealedRefs.includes(reference));
  const scopeAllowed = (allowed as readonly string[]).includes(bindingScope);
  const valid = present && matches && scopeAllowed;
  addReason(reasons, present ? "GOVERNANCE_SCOPE_VALIDATED" : "AUTHORITY_SCOPE_MISSING");
  if (!scopeAllowed && present) addReason(reasons, "GOVERNANCE_SCOPE_MISMATCH");
  return Object.freeze({ valid, mismatch: present && !scopeAllowed });
}

function validateScopeVisibility(input: RecommendationAuthorityScopeInput, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const scope = input.request.authorityScope;
  const valid = (scope === "OBSERVE_ONLY" && input.observability.result.observabilityState !== "INVALID" && input.visibility.result.visibilityState !== "INVALID")
    || (scope === "ANALYSIS_ONLY" && input.inspection.result.inspectionState !== "INVALID" && input.replay.result.replayState !== "INVALID")
    || (scope === "AUDIT_ONLY" && input.audit.result.exportState !== "INVALID" && input.audit.result.exportedArtifacts.length > 0)
    || (scope === "GOVERNANCE_ONLY" && input.binding.result.bindingState !== "INVALID" && input.certification.result.certificationState !== "FAIL")
    || (scope === "FULL_VISIBILITY" && input.binding.result.bindingState !== "INVALID" && input.visibility.result.visibilityState !== "INVALID");
  addReason(reasons, valid ? "SCOPE_VALIDATED" : "AUTHORITY_SCOPE_MISSING");
  return valid;
}

function validateHiddenAuthority(input: RecommendationAuthorityScopeInput, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const valid = input.hiddenAuthorityDetected !== true;
  addReason(reasons, valid ? "HIDDEN_AUTHORITY_ABSENT" : "HIDDEN_AUTHORITY_DETECTED");
  return valid;
}

function validateEvidenceHashes(input: RecommendationAuthorityScopeInput, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationAuthorityScopeInput, reasons: RecommendationAuthorityScopeReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.binding.validation.authorityBounded
    && input.observability.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.visibility.validation.authorityBounded
    && input.audit.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded;
  const invalidBoundary = input.scopeMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalBehaviorRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenAuthorityDetected === true;
  addReason(reasons, input.scopeMutationAttempted === true ? "SCOPE_MUTATION_DETECTED" : "SCOPE_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalBehaviorRequested === true ? "APPROVAL_BEHAVIOR_DETECTED" : "APPROVAL_BEHAVIOR_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_AUTHORITY_SCOPE_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: RecommendationAuthorityScopeEvidencePath, reasons: RecommendationAuthorityScopeReasonCode[]): boolean {
  const depthValid = path.governanceReferences.length <= MAX_SCOPE_DEPTH;
  const governanceValid = path.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES;
  const scopeValid = path.scopeReferences.length <= MAX_SCOPE_REFERENCES;
  addReason(reasons, depthValid ? "SCOPE_DEPTH_VALID" : "SCOPE_DEPTH_EXCEEDED");
  addReason(reasons, governanceValid ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, scopeValid ? "SCOPE_REFERENCE_LIMIT_VALID" : "SCOPE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && governanceValid && scopeValid;
}

function classifyScopeState(
  valid: boolean,
  scopeValidated: boolean,
  governanceScopeValidated: boolean,
  governanceScopeMismatch: boolean,
  bindingState: RecommendationAuthorityScopeInput["binding"]["result"]["bindingState"],
): RecommendationAuthorityScopeResult["scopeState"] {
  if (!valid) return "INVALID";
  if (governanceScopeMismatch || bindingState === "ESCALATED") return "ESCALATED";
  if (!scopeValidated || bindingState === "LIMITED") return "LIMITED";
  if (!governanceScopeValidated) return "LIMITED";
  return "WITHIN_SCOPE";
}

export function buildRecommendationAuthorityScopeRequest(
  input: Omit<RecommendationAuthorityScopeInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    authorityScope?: RecommendationAuthorityScope;
    requestedGovernanceReferences?: readonly string[];
    graphVersion?: string;
  },
): RecommendationAuthorityScopeRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    authorityScope: input.authorityScope ?? "FULL_VISIBILITY",
    governanceReferences: normalizeStrings(input.requestedGovernanceReferences ?? input.governanceReferences.governanceReferences),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as RecommendationAuthorityScopeRequest);
}

export function createRecommendationAuthorityScopeEvidencePath(input: RecommendationAuthorityScopeInput): RecommendationAuthorityScopeEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.authorityScope,
    governanceReferences: Object.freeze(normalizeStrings(request.governanceReferences)),
    scopeReferences: Object.freeze(scopeReferences(input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateRecommendationAuthorityScope(input: RecommendationAuthorityScopeInput): RecommendationAuthorityScopeValidation {
  const reasons: RecommendationAuthorityScopeReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationAuthorityScopeEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const authorityScopeValid = validateScope(request.authorityScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValidated = validateOwnership(normalizedInput, reasons);
  const governanceScope = validateGovernanceScope(normalizedInput, reasons);
  const scopeValidated = validateScopeVisibility(normalizedInput, reasons);
  const hiddenAuthorityAbsent = validateHiddenAuthority(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && authorityScopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValidated
    && hiddenAuthorityAbsent
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    scopeState: classifyScopeState(
      valid,
      scopeValidated,
      governanceScope.valid,
      governanceScope.mismatch,
      normalizedInput.binding.result.bindingState,
    ),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationAuthorityScopeReasonCode[],
    scopeValidated,
    governanceScopeValidated: governanceScope.valid,
    ownershipValidated,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    scopeReferenceCount: evidencePath.scopeReferences.length,
  });
}

export function buildRecommendationAuthorityScopeResult(input: RecommendationAuthorityScopeInput): RecommendationAuthorityScopeResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationAuthorityScopeEvidencePath(normalizedInput);
  const validation = validateRecommendationAuthorityScope(normalizedInput);

  const authorityHash = hashAuthorityValue("recommendation-authority-scope-enforcement", {
    request,
    evidencePath,
    scopeState: validation.scopeState,
    scopeValidated: validation.scopeValidated,
    governanceScopeValidated: validation.governanceScopeValidated,
    ownershipValidated: validation.ownershipValidated,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    scopeState: validation.scopeState,
    scopeValidated: validation.scopeValidated,
    governanceScopeValidated: validation.governanceScopeValidated,
    ownershipValidated: validation.ownershipValidated,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    authorityHash,
    deterministic: true,
  });
}

export function buildRecommendationAuthorityScopeObservability(result: RecommendationAuthorityScopeResult): RecommendationAuthorityScopeObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    scopeState: result.scopeState,
    scopeValidated: result.scopeValidated,
    governanceScopeValidated: result.governanceScopeValidated,
    ownershipValidated: result.ownershipValidated,
    authorityHash: result.authorityHash,
  });
}

export function sealRecommendationAuthorityScope(input: RecommendationAuthorityScopeInput): SealedRecommendationAuthorityScopeRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationAuthorityScopeEvidencePath(normalizedInput);
  const validation = validateRecommendationAuthorityScope(normalizedInput);
  const result = buildRecommendationAuthorityScopeResult(normalizedInput);
  const observability = buildRecommendationAuthorityScopeObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    enforcementOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    approvalBehaviorAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationAuthorityScopeValidator = Object.freeze({
  validate: validateRecommendationAuthorityScope,
});

export const RecommendationAuthorityScopeEnforcement = Object.freeze({
  buildRequest: buildRecommendationAuthorityScopeRequest,
  createEvidencePath: createRecommendationAuthorityScopeEvidencePath,
  buildResult: buildRecommendationAuthorityScopeResult,
  seal: sealRecommendationAuthorityScope,
});

export const RecommendationAuthorityScopeObservabilityService = Object.freeze({
  build: buildRecommendationAuthorityScopeObservability,
});
