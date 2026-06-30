import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  OperatorVisibilityEvidencePath,
  OperatorVisibilityInput,
  OperatorVisibilityObservability,
  OperatorVisibilityReasonCode,
  OperatorVisibilityRequest,
  OperatorVisibilityResult,
  OperatorVisibilityRole,
  OperatorVisibilityScope,
  OperatorVisibilityValidation,
  SealedOperatorVisibilityRecord,
} from "./types";

const MAX_VISIBILITY_DEPTH = 20;
const MAX_VISIBLE_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const ROLE_SCOPES = Object.freeze({
  VIEWER: Object.freeze(["SUMMARY"] as const),
  ANALYST: Object.freeze(["SUMMARY", "LINEAGE", "REPLAY", "INTEGRITY"] as const),
  AUDITOR: Object.freeze(["SUMMARY", "LINEAGE", "REPLAY", "INTEGRITY", "CERTIFICATION", "FULL"] as const),
  GOVERNANCE: Object.freeze(["SUMMARY", "LINEAGE", "REPLAY", "INTEGRITY", "CERTIFICATION", "FULL"] as const),
}) satisfies Readonly<Record<OperatorVisibilityRole, readonly OperatorVisibilityScope[]>>;

const ROLES: readonly OperatorVisibilityRole[] = Object.freeze(["ANALYST", "AUDITOR", "GOVERNANCE", "VIEWER"]);
const SCOPES: readonly OperatorVisibilityScope[] = Object.freeze(["CERTIFICATION", "FULL", "INTEGRITY", "LINEAGE", "REPLAY", "SUMMARY"]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: OperatorVisibilityReasonCode[], reason: OperatorVisibilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashVisibilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: OperatorVisibilityRequest): OperatorVisibilityRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    operatorRole: request.operatorRole,
    visibilityScope: request.visibilityScope,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: OperatorVisibilityInput): string[] {
  return normalizeStrings([
    input.observability.result.observabilityHash,
    input.inspection.result.inspectionHash,
    input.ledger.result.ledgerHash,
    input.lineage.result.reconstructionHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.integrity.result.integrityHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: OperatorVisibilityInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    ...input.inspection.evidencePath.evidenceIds,
    ...input.observability.evidencePath.evidenceIds,
  ]);
}

function permittedScopes(role: OperatorVisibilityRole): string[] {
  return [...ROLE_SCOPES[role]].sort();
}

function createEvidenceIdsForScope(scope: OperatorVisibilityScope, input: OperatorVisibilityInput): string[] {
  switch (scope) {
    case "SUMMARY":
      return [input.ledger.entry.ledgerEntryId];
    case "LINEAGE":
    case "REPLAY":
    case "INTEGRITY":
    case "CERTIFICATION":
    case "FULL":
      return normalizeStrings([...input.inspection.evidencePath.evidenceIds]);
  }
}

function collectLineage(input: OperatorVisibilityInput): string[] {
  return normalizeStrings([
    ...input.lineage.evidencePath.lineageReferences,
    ...input.verification.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.integrity.evidencePath.lineageReferences,
    ...input.certification.evidencePath.lineageReferences,
    ...input.observability.evidencePath.lineageReferences,
  ]);
}

function validateSealedArtifacts(input: OperatorVisibilityInput, reasons: OperatorVisibilityReasonCode[]): boolean {
  const states = [
    [input.observability.sealed, "OBSERVABILITY_REQUIRED", "OBSERVABILITY_UNSEALED"],
    [input.inspection.sealed, "INSPECTION_REQUIRED", "INSPECTION_UNSEALED"],
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.integrity.sealed, "INTEGRITY_REQUIRED", "INTEGRITY_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateRole(role: OperatorVisibilityRole, reasons: OperatorVisibilityReasonCode[]): boolean {
  const valid = ROLES.includes(role);
  addReason(reasons, valid ? "ROLE_VALID" : "ROLE_INVALID");
  return valid;
}

function validateScope(scope: OperatorVisibilityScope, reasons: OperatorVisibilityReasonCode[]): boolean {
  const valid = SCOPES.includes(scope);
  addReason(reasons, valid ? "VISIBILITY_SCOPE_VALID" : "VISIBILITY_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: OperatorVisibilityRequest, reasons: OperatorVisibilityReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: OperatorVisibilityInput, reasons: OperatorVisibilityReasonCode[]): boolean {
  const valid = input.observability.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
    && input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ACCESS_BLOCKED");
  return valid;
}

function validateOwnership(input: OperatorVisibilityInput, reasons: OperatorVisibilityReasonCode[]): boolean {
  const valid = input.verification.result.ownershipVerified
    && input.integrity.result.ownershipIntegrity
    && input.certification.result.ownershipCertified;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateRoleScope(role: OperatorVisibilityRole, scope: OperatorVisibilityScope, reasons: OperatorVisibilityReasonCode[]): boolean {
  const allowed = (ROLE_SCOPES[role] as readonly OperatorVisibilityScope[]).includes(scope);
  if (role === "VIEWER") addReason(reasons, "VIEWER_SCOPE_ENFORCED");
  if (role === "ANALYST") addReason(reasons, "ANALYST_SCOPE_ENFORCED");
  if (role === "AUDITOR") addReason(reasons, "AUDITOR_SCOPE_ENFORCED");
  if (role === "GOVERNANCE") addReason(reasons, "GOVERNANCE_SCOPE_ENFORCED");
  if (!allowed) addReason(reasons, "ROLE_VISIBILITY_VIOLATION");
  return allowed;
}

function validateScopeVisibility(input: OperatorVisibilityInput, reasons: OperatorVisibilityReasonCode[]): boolean {
  const scope = input.request.visibilityScope;
  const visible = (scope === "SUMMARY")
    || (scope === "LINEAGE" && input.inspection.result.visibilityScope.includes("lineage"))
    || (scope === "REPLAY" && input.inspection.result.visibilityScope.includes("replay"))
    || (scope === "INTEGRITY" && input.inspection.result.visibilityScope.includes("integrity"))
    || (scope === "CERTIFICATION" && input.inspection.result.visibilityScope.includes("certification"))
    || (scope === "FULL" && input.inspection.result.visibilityScope.includes("summary"));
  if (!visible) addReason(reasons, "SCOPE_VIOLATION_ESCALATED");
  return visible;
}

function validateVisibilityFlags(input: OperatorVisibilityInput, reasons: OperatorVisibilityReasonCode[]) {
  const replayVisible = input.observability.result.replayVisible && input.inspection.result.replayVisible;
  const lineageVisible = input.observability.result.lineageVisible && input.inspection.result.lineageVisible;
  const integrityVisible = input.observability.result.integrityVisible && input.inspection.result.integrityVisible;
  const certificationVisible = input.observability.result.certificationVisible && input.inspection.result.certificationVisible;
  addReason(reasons, replayVisible ? "REPLAY_VISIBLE" : "REPLAY_VISIBILITY_LIMITED");
  addReason(reasons, lineageVisible ? "LINEAGE_VISIBLE" : "LINEAGE_VISIBILITY_LIMITED");
  addReason(reasons, integrityVisible ? "INTEGRITY_VISIBLE" : "INTEGRITY_VISIBILITY_LIMITED");
  addReason(reasons, certificationVisible ? "CERTIFICATION_VISIBLE" : "CERTIFICATION_VISIBILITY_LIMITED");
  return { replayVisible, lineageVisible, integrityVisible, certificationVisible };
}

function validateEvidenceHashes(input: OperatorVisibilityInput, reasons: OperatorVisibilityReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: OperatorVisibilityInput, reasons: OperatorVisibilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.observability.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded;
  const invalidBoundary = input.visibilityMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.prioritizationRequested === true
    || input.approvalBehaviorRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.visibilityMutationAttempted === true ? "VISIBILITY_MUTATION_DETECTED" : "VISIBILITY_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_BLOCKED");
  addReason(reasons, input.approvalBehaviorRequested === true ? "APPROVAL_BEHAVIOR_DETECTED" : "APPROVAL_BEHAVIOR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "OPERATOR_VISIBILITY_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: OperatorVisibilityEvidencePath, reasons: OperatorVisibilityReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_VISIBILITY_DEPTH;
  const visibleValid = path.evidenceIds.length <= MAX_VISIBLE_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "VISIBILITY_DEPTH_VALID" : "VISIBILITY_DEPTH_EXCEEDED");
  addReason(reasons, visibleValid ? "VISIBLE_REFERENCE_LIMIT_VALID" : "VISIBLE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && visibleValid && lineageValid;
}

function classifyVisibilityState(
  valid: boolean,
  roleScopeAllowed: boolean,
  scopeVisible: boolean,
  replayVisible: boolean,
): OperatorVisibilityResult["visibilityState"] {
  if (!valid) return "INVALID";
  if (!roleScopeAllowed) return "INVALID";
  if (!scopeVisible) return "ESCALATED";
  if (!replayVisible) return "LIMITED";
  return "VISIBLE";
}

export function buildOperatorVisibilityRequest(
  input: Omit<OperatorVisibilityInput, "request"> & {
    operatorRole?: OperatorVisibilityRole;
    visibilityScope?: OperatorVisibilityScope;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
  },
): OperatorVisibilityRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    operatorRole: input.operatorRole ?? "VIEWER",
    visibilityScope: input.visibilityScope ?? "SUMMARY",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as OperatorVisibilityRequest);
}

export function createOperatorVisibilityEvidencePath(input: OperatorVisibilityInput): OperatorVisibilityEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    role: request.operatorRole,
    scope: request.visibilityScope,
    permittedScopes: Object.freeze(permittedScopes(request.operatorRole)),
    evidenceIds: Object.freeze(createEvidenceIdsForScope(request.visibilityScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(collectLineage(input)),
  });
}

export function validateOperatorVisibility(input: OperatorVisibilityInput): OperatorVisibilityValidation {
  const reasons: OperatorVisibilityReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createOperatorVisibilityEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const roleValid = validateRole(request.operatorRole, reasons);
  const scopeValid = validateScope(request.visibilityScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const roleScopeAllowed = validateRoleScope(request.operatorRole, request.visibilityScope, reasons);
  const scopeVisible = validateScopeVisibility(normalizedInput, reasons);
  const visibilityFlags = validateVisibilityFlags(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && roleValid
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    visibilityState: classifyVisibilityState(valid, roleScopeAllowed, scopeVisible, visibilityFlags.replayVisible),
    reasonCodes: normalizeStrings(reasons) as readonly OperatorVisibilityReasonCode[],
    permittedScopes: Object.freeze(evidencePath.permittedScopes),
    replayVisible: visibilityFlags.replayVisible,
    lineageVisible: visibilityFlags.lineageVisible,
    integrityVisible: visibilityFlags.integrityVisible,
    certificationVisible: visibilityFlags.certificationVisible,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    visibleReferenceCount: evidencePath.evidenceIds.length,
  });
}

export function buildOperatorVisibilityResult(input: OperatorVisibilityInput): OperatorVisibilityResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createOperatorVisibilityEvidencePath(normalizedInput);
  const validation = validateOperatorVisibility(normalizedInput);

  const visibilityHash = hashVisibilityValue("operator-visibility-model", {
    request,
    evidencePath,
    visibilityState: validation.visibilityState,
    permittedScopes: validation.permittedScopes,
    replayVisible: validation.replayVisible,
    lineageVisible: validation.lineageVisible,
    integrityVisible: validation.integrityVisible,
    certificationVisible: validation.certificationVisible,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    visibilityState: validation.visibilityState,
    permittedScopes: [...validation.permittedScopes],
    replayVisible: validation.replayVisible,
    lineageVisible: validation.lineageVisible,
    integrityVisible: validation.integrityVisible,
    certificationVisible: validation.certificationVisible,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    visibilityHash,
    deterministic: true,
  });
}

export function buildOperatorVisibilityObservability(result: OperatorVisibilityResult): OperatorVisibilityObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    visibilityState: result.visibilityState,
    permittedScopes: Object.freeze([...result.permittedScopes]),
    replayVisible: result.replayVisible,
    lineageVisible: result.lineageVisible,
    integrityVisible: result.integrityVisible,
    certificationVisible: result.certificationVisible,
    visibilityHash: result.visibilityHash,
  });
}

export function sealOperatorVisibility(input: OperatorVisibilityInput): SealedOperatorVisibilityRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createOperatorVisibilityEvidencePath(normalizedInput);
  const validation = validateOperatorVisibility(normalizedInput);
  const result = buildOperatorVisibilityResult(normalizedInput);
  const observability = buildOperatorVisibilityObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    visibilityOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    recommendationGenerationAllowed: false as const,
    prioritizationAllowed: false as const,
    approvalBehaviorAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const OperatorVisibilityValidator = Object.freeze({
  validate: validateOperatorVisibility,
});

export const OperatorVisibilityModel = Object.freeze({
  buildRequest: buildOperatorVisibilityRequest,
  createEvidencePath: createOperatorVisibilityEvidencePath,
  buildResult: buildOperatorVisibilityResult,
  seal: sealOperatorVisibility,
});

export const OperatorVisibilityObservabilityService = Object.freeze({
  build: buildOperatorVisibilityObservability,
});
