import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  PolicyVisibilityEvidencePath,
  PolicyVisibilityInput,
  PolicyVisibilityObservability,
  PolicyVisibilityReasonCode,
  PolicyVisibilityRequest,
  PolicyVisibilityResult,
  PolicyVisibilityScope,
  PolicyVisibilityValidation,
  SealedPolicyVisibilityRecord,
} from "./types";

const MAX_POLICY_DEPTH = 20;
const MAX_POLICY_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const VISIBILITY_SCOPES: readonly PolicyVisibilityScope[] = Object.freeze([
  "AUTHORITY",
  "CONSTRAINTS",
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

function addReason(reasons: PolicyVisibilityReasonCode[], reason: PolicyVisibilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashPolicyValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: PolicyVisibilityRequest): PolicyVisibilityRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    visibilityScope: request.visibilityScope,
    governanceReferences: normalizeStrings(request.governanceReferences),
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: PolicyVisibilityInput): string[] {
  return normalizeStrings([
    input.binding.result.governanceHash,
    input.authorityScope.result.authorityHash,
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
    input.policyReferences.policyHash,
  ]);
}

function policyReferencesForScope(scope: PolicyVisibilityScope, input: PolicyVisibilityInput): string[] {
  if (scope === "LINEAGE") return [];
  return normalizeStrings([
    ...input.policyReferences.policyReferences,
    ...input.governanceReferences.governanceReferences,
    ...input.request.governanceReferences,
  ]);
}

function lineageReferencesForScope(scope: PolicyVisibilityScope, input: PolicyVisibilityInput): string[] {
  if (scope === "POLICY" || scope === "AUTHORITY") return [];
  return normalizeStrings([
    ...input.lineage.evidencePath.lineageReferences,
    ...input.binding.evidencePath.lineageReferences,
    ...input.audit.evidencePath.lineageReferences,
  ]);
}

function validateSealedArtifacts(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): boolean {
  const states = [
    [input.binding.sealed, "BINDING_REQUIRED", "BINDING_UNSEALED"],
    [input.authorityScope.sealed, "AUTHORITY_SCOPE_REQUIRED", "AUTHORITY_SCOPE_UNSEALED"],
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
    [input.policyReferences.sealed, "POLICY_REFERENCES_REQUIRED", "POLICY_REFERENCES_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateScope(scope: PolicyVisibilityScope, reasons: PolicyVisibilityReasonCode[]): boolean {
  const valid = VISIBILITY_SCOPES.includes(scope);
  addReason(reasons, valid ? "VISIBILITY_SCOPE_VALID" : "VISIBILITY_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: PolicyVisibilityRequest, reasons: PolicyVisibilityReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.binding.result.tenantIsolationVerified
    && input.authorityScope.result.tenantIsolationVerified
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
    && input.policyReferences.tenantId === tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_VISIBILITY_BLOCKED");
  return valid;
}

function validateOwnership(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): boolean {
  const valid = input.binding.validation.governanceBound
    && input.authorityScope.result.ownershipValidated
    && input.ledger.result.ownershipVerified
    && input.certification.result.ownershipCertified;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validatePolicyReferences(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): boolean {
  const requested = normalizeStrings(input.request.governanceReferences);
  const policyRefs = normalizeStrings(input.policyReferences.policyReferences);
  const present = requested.length > 0 && requested.every((reference) => policyRefs.includes(reference) || input.governanceReferences.governanceReferences.includes(reference));
  addReason(reasons, present ? "POLICIES_VISIBLE" : "POLICY_REFERENCES_MISSING");
  return present;
}

function validateConstraints(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): { visible: boolean; escalated: boolean } {
  const degraded = input.binding.result.bindingState === "ESCALATED" || input.authorityScope.result.scopeState === "ESCALATED";
  const visible = input.binding.result.bindingState !== "INVALID" && input.authorityScope.result.scopeState !== "INVALID" && !degraded;
  addReason(reasons, visible ? "CONSTRAINTS_VISIBLE" : "CONSTRAINTS_DEGRADED");
  return { visible, escalated: degraded };
}

function validateAuthority(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): { visible: boolean; escalated: boolean } {
  const broken = input.authorityScope.result.scopeState === "ESCALATED" || input.authorityScope.result.scopeState === "INVALID";
  addReason(reasons, broken ? "AUTHORITY_CONSTRAINT_BROKEN" : "AUTHORITY_VISIBLE");
  return { visible: !broken, escalated: broken };
}

function validateLineage(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): boolean {
  const scope = input.request.visibilityScope;
  if (scope === "POLICY" || scope === "AUTHORITY") {
    addReason(reasons, "LINEAGE_VISIBLE");
    return true;
  }
  const visible = input.lineage.result.lineageIntegrity
    && input.binding.result.lineageBound
    && input.audit.result.lineageIncluded;
  addReason(reasons, visible ? "LINEAGE_VISIBLE" : "LINEAGE_DEGRADED");
  return visible;
}

function validateHiddenPolicyState(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): boolean {
  const valid = input.hiddenPolicyStateDetected !== true;
  addReason(reasons, valid ? "HIDDEN_POLICY_STATE_ABSENT" : "HIDDEN_POLICY_STATE_DETECTED");
  return valid;
}

function validateEvidenceHashes(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: PolicyVisibilityInput, reasons: PolicyVisibilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.binding.validation.authorityBounded
    && input.authorityScope.validation.authorityBounded
    && input.observability.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.visibility.validation.authorityBounded
    && input.audit.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded;
  const invalidBoundary = input.policyMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalBehaviorRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.policyExecutionRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenPolicyStateDetected === true;
  addReason(reasons, input.policyMutationAttempted === true ? "POLICY_MUTATION_DETECTED" : "POLICY_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalBehaviorRequested === true ? "APPROVAL_BEHAVIOR_DETECTED" : "APPROVAL_BEHAVIOR_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.policyExecutionRequested === true ? "POLICY_EXECUTION_DETECTED" : "POLICY_EXECUTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "POLICY_VISIBILITY_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: PolicyVisibilityEvidencePath, reasons: PolicyVisibilityReasonCode[]): boolean {
  const depthValid = path.policyReferences.length <= MAX_POLICY_DEPTH;
  const policyValid = path.policyReferences.length <= MAX_POLICY_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "POLICY_DEPTH_VALID" : "POLICY_DEPTH_EXCEEDED");
  addReason(reasons, policyValid ? "POLICY_REFERENCE_LIMIT_VALID" : "POLICY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && policyValid && lineageValid;
}

function classifyVisibilityState(
  valid: boolean,
  policiesVisible: boolean,
  constraintsEscalated: boolean,
  authorityEscalated: boolean,
  lineageVisible: boolean,
): PolicyVisibilityResult["visibilityState"] {
  if (!valid) return "INVALID";
  if (constraintsEscalated || authorityEscalated) return "ESCALATED";
  if (!policiesVisible || !lineageVisible) return "LIMITED";
  return "VISIBLE";
}

export function buildPolicyVisibilityRequest(
  input: Omit<PolicyVisibilityInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    visibilityScope?: PolicyVisibilityScope;
    requestedGovernanceReferences?: readonly string[];
    graphVersion?: string;
  },
): PolicyVisibilityRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    visibilityScope: input.visibilityScope ?? "FULL",
    governanceReferences: normalizeStrings(input.requestedGovernanceReferences ?? input.governanceReferences.governanceReferences),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as PolicyVisibilityRequest);
}

export function createPolicyVisibilityEvidencePath(input: PolicyVisibilityInput): PolicyVisibilityEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.visibilityScope,
    governanceReferences: Object.freeze(normalizeStrings(request.governanceReferences)),
    policyReferences: Object.freeze(policyReferencesForScope(request.visibilityScope, input)),
    lineageReferences: Object.freeze(lineageReferencesForScope(request.visibilityScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validatePolicyVisibility(input: PolicyVisibilityInput): PolicyVisibilityValidation {
  const reasons: PolicyVisibilityReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createPolicyVisibilityEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.visibilityScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const policiesVisible = validatePolicyReferences(normalizedInput, reasons);
  const constraints = validateConstraints(normalizedInput, reasons);
  const authority = validateAuthority(normalizedInput, reasons);
  const lineageVisible = validateLineage(normalizedInput, reasons);
  const hiddenPolicyValid = validateHiddenPolicyState(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && hiddenPolicyValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    visibilityState: classifyVisibilityState(valid, policiesVisible, constraints.escalated, authority.escalated, lineageVisible),
    reasonCodes: normalizeStrings(reasons) as readonly PolicyVisibilityReasonCode[],
    policiesVisible,
    constraintsVisible: constraints.visible,
    authorityVisible: authority.visible,
    lineageVisible,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    policyReferenceCount: evidencePath.policyReferences.length,
  });
}

export function buildPolicyVisibilityResult(input: PolicyVisibilityInput): PolicyVisibilityResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createPolicyVisibilityEvidencePath(normalizedInput);
  const validation = validatePolicyVisibility(normalizedInput);

  const policyHash = hashPolicyValue("policy-visibility-layer", {
    request,
    evidencePath,
    visibilityState: validation.visibilityState,
    policiesVisible: validation.policiesVisible,
    constraintsVisible: validation.constraintsVisible,
    authorityVisible: validation.authorityVisible,
    lineageVisible: validation.lineageVisible,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    visibilityState: validation.visibilityState,
    policiesVisible: validation.policiesVisible,
    constraintsVisible: validation.constraintsVisible,
    authorityVisible: validation.authorityVisible,
    lineageVisible: validation.lineageVisible,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    policyHash,
    deterministic: true,
  });
}

export function buildPolicyVisibilityObservability(result: PolicyVisibilityResult): PolicyVisibilityObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    visibilityState: result.visibilityState,
    policiesVisible: result.policiesVisible,
    constraintsVisible: result.constraintsVisible,
    authorityVisible: result.authorityVisible,
    lineageVisible: result.lineageVisible,
    policyHash: result.policyHash,
  });
}

export function sealPolicyVisibility(input: PolicyVisibilityInput): SealedPolicyVisibilityRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createPolicyVisibilityEvidencePath(normalizedInput);
  const validation = validatePolicyVisibility(normalizedInput);
  const result = buildPolicyVisibilityResult(normalizedInput);
  const observability = buildPolicyVisibilityObservability(result);

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
    approvalBehaviorAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const PolicyVisibilityValidator = Object.freeze({
  validate: validatePolicyVisibility,
});

export const PolicyVisibilityLayer = Object.freeze({
  buildRequest: buildPolicyVisibilityRequest,
  createEvidencePath: createPolicyVisibilityEvidencePath,
  buildResult: buildPolicyVisibilityResult,
  seal: sealPolicyVisibility,
});

export const PolicyVisibilityObservabilityService = Object.freeze({
  build: buildPolicyVisibilityObservability,
});
