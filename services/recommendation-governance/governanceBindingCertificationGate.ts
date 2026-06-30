import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  GovernanceBindingCertificationEvidencePath,
  GovernanceBindingCertificationInput,
  GovernanceBindingCertificationObservability,
  GovernanceBindingCertificationReasonCode,
  GovernanceBindingCertificationRequest,
  GovernanceBindingCertificationResult,
  GovernanceBindingCertificationScope,
  GovernanceBindingCertificationValidation,
  SealedGovernanceBindingCertificationRecord,
} from "./types";

const MAX_CERTIFICATION_DEPTH = 20;
const MAX_GOVERNANCE_REFERENCES = 5000;
const MAX_REPLAY_REFERENCES = 1000;

const CERTIFICATION_SCOPES: readonly GovernanceBindingCertificationScope[] = Object.freeze([
  "AUTHORITY",
  "BINDINGS",
  "FULL",
  "POLICY",
  "REPLAY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: GovernanceBindingCertificationReasonCode[], reason: GovernanceBindingCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: GovernanceBindingCertificationRequest): GovernanceBindingCertificationRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    governanceReferences: normalizeStrings(request.governanceReferences),
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: GovernanceBindingCertificationInput): string[] {
  return normalizeStrings([
    input.binding.result.governanceHash,
    input.authorityScope.result.authorityHash,
    input.policyVisibility.result.policyHash,
    input.governanceReplay.result.replayHash,
    input.governanceReplay.result.reconstructionHash,
    input.observability.result.observabilityHash,
    input.inspection.result.inspectionHash,
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

function replayReferencesForScope(scope: GovernanceBindingCertificationScope, input: GovernanceBindingCertificationInput): string[] {
  if (scope === "BINDINGS") return normalizeStrings(input.binding.evidencePath.replayReferences);
  if (scope === "AUTHORITY") return normalizeStrings(input.authorityScope.evidencePath.scopeReferences);
  if (scope === "POLICY") return normalizeStrings(input.policyVisibility.evidencePath.policyReferences);
  if (scope === "REPLAY") return normalizeStrings(input.governanceReplay.evidencePath.replayReferences);
  return normalizeStrings([
    ...input.binding.evidencePath.replayReferences,
    ...input.governanceReplay.evidencePath.replayReferences,
  ]);
}

function validateSealedArtifacts(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const states = [
    [input.binding.sealed, "BINDING_REQUIRED", "BINDING_UNSEALED"],
    [input.authorityScope.sealed, "AUTHORITY_SCOPE_REQUIRED", "AUTHORITY_SCOPE_UNSEALED"],
    [input.policyVisibility.sealed, "POLICY_VISIBILITY_REQUIRED", "POLICY_VISIBILITY_UNSEALED"],
    [input.governanceReplay.sealed, "GOVERNANCE_REPLAY_REQUIRED", "GOVERNANCE_REPLAY_UNSEALED"],
    [input.observability.sealed, "OBSERVABILITY_REQUIRED", "OBSERVABILITY_UNSEALED"],
    [input.inspection.sealed, "INSPECTION_REQUIRED", "INSPECTION_UNSEALED"],
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

function validateScope(scope: GovernanceBindingCertificationScope, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: GovernanceBindingCertificationRequest, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.binding.result.tenantIsolationVerified
    && input.authorityScope.result.tenantIsolationVerified
    && input.policyVisibility.result.tenantIsolationVerified
    && input.governanceReplay.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CERTIFICATION_BLOCKED");
  return valid;
}

function validateOwnership(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const valid = input.ownershipEvidence.recommendationId === input.request.recommendationId
    && input.ownershipEvidence.ownershipReferences.length > 0
    && input.binding.validation.governanceBound
    && input.authorityScope.result.ownershipValidated;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateBindings(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const certified = input.binding.result.bindingState !== "INVALID"
    && input.binding.result.governanceBound
    && input.binding.result.lineageBound;
  addReason(reasons, certified ? "BINDINGS_CERTIFIED" : "GOVERNANCE_BINDING_BROKEN");
  return certified;
}

function validateAuthority(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const certified = input.authorityScope.result.scopeState !== "INVALID"
    && input.authorityScope.result.scopeValidated
    && input.authorityScope.result.governanceScopeValidated;
  addReason(reasons, certified ? "AUTHORITY_CERTIFIED" : "AUTHORITY_CONCERN_DETECTED");
  return certified;
}

function validatePolicy(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const certified = input.policyVisibility.result.visibilityState !== "INVALID"
    && input.policyVisibility.result.policiesVisible
    && input.policyVisibility.result.constraintsVisible;
  addReason(reasons, certified ? "POLICY_CERTIFIED" : "POLICY_VISIBILITY_BROKEN");
  return certified;
}

function validateReplayEvidence(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const certified = input.governanceReplay.result.replayState === "REPLAYABLE"
    && input.governanceReplay.result.governanceReconstructed
    && input.governanceReplay.result.authorityReconstructed
    && input.governanceReplay.result.policyReconstructed
    && input.governanceReplay.result.lineageReconstructed;
  addReason(reasons, certified ? "REPLAY_CERTIFIED" : "REPLAY_DEGRADED");
  return certified;
}

function validateEvidenceHashes(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateHiddenState(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const valid = input.hiddenGovernanceStateDetected !== true;
  addReason(reasons, valid ? "HIDDEN_GOVERNANCE_STATE_ABSENT" : "HIDDEN_GOVERNANCE_STATE_DETECTED");
  return valid;
}

function validateBoundary(input: GovernanceBindingCertificationInput, reasons: GovernanceBindingCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.binding.validation.authorityBounded
    && input.authorityScope.validation.authorityBounded
    && input.policyVisibility.validation.authorityBounded
    && input.governanceReplay.validation.authorityBounded
    && input.observability.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.audit.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded;
  const invalidBoundary = input.certificationMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalBehaviorRequested === true
    || input.policyExecutionRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenGovernanceStateDetected === true;
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalBehaviorRequested === true ? "APPROVAL_BEHAVIOR_DETECTED" : "APPROVAL_BEHAVIOR_BLOCKED");
  addReason(reasons, input.policyExecutionRequested === true ? "POLICY_EXECUTION_DETECTED" : "POLICY_EXECUTION_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "GOVERNANCE_CERTIFICATION_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: GovernanceBindingCertificationEvidencePath, reasons: GovernanceBindingCertificationReasonCode[]): boolean {
  const depthValid = path.governanceReferences.length <= MAX_CERTIFICATION_DEPTH;
  const governanceValid = path.governanceReferences.length <= MAX_GOVERNANCE_REFERENCES;
  const replayValid = path.replayReferences.length <= MAX_REPLAY_REFERENCES;
  addReason(reasons, depthValid ? "CERTIFICATION_DEPTH_VALID" : "CERTIFICATION_DEPTH_EXCEEDED");
  addReason(reasons, governanceValid ? "GOVERNANCE_REFERENCE_LIMIT_VALID" : "GOVERNANCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayValid ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && governanceValid && replayValid;
}

function classifyCertificationState(
  valid: boolean,
  replayCertified: boolean,
): GovernanceBindingCertificationResult["certificationState"] {
  if (!valid) return "FAIL";
  if (!replayCertified) return "CONDITIONAL_PASS";
  return "PASS";
}

export function buildGovernanceBindingCertificationRequest(
  input: Omit<GovernanceBindingCertificationInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    certificationScope?: GovernanceBindingCertificationScope;
    requestedGovernanceReferences?: readonly string[];
    graphVersion?: string;
  },
): GovernanceBindingCertificationRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    certificationScope: input.certificationScope ?? "FULL",
    governanceReferences: normalizeStrings(input.requestedGovernanceReferences ?? input.governanceReferences.governanceReferences),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as GovernanceBindingCertificationRequest);
}

export function createGovernanceBindingCertificationEvidencePath(input: GovernanceBindingCertificationInput): GovernanceBindingCertificationEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.certificationScope,
    governanceReferences: Object.freeze(normalizeStrings(request.governanceReferences)),
    replayReferences: Object.freeze(replayReferencesForScope(request.certificationScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateGovernanceBindingCertification(input: GovernanceBindingCertificationInput): GovernanceBindingCertificationValidation {
  const reasons: GovernanceBindingCertificationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createGovernanceBindingCertificationEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.certificationScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const bindingsCertified = validateBindings(normalizedInput, reasons);
  const authorityCertified = validateAuthority(normalizedInput, reasons);
  const policyCertified = validatePolicy(normalizedInput, reasons);
  const replayCertified = validateReplayEvidence(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const hiddenStateValid = validateHiddenState(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && bindingsCertified
    && authorityCertified
    && policyCertified
    && evidenceHashesValid
    && hiddenStateValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    certificationState: classifyCertificationState(valid, replayCertified),
    reasonCodes: normalizeStrings(reasons) as readonly GovernanceBindingCertificationReasonCode[],
    bindingsCertified,
    authorityCertified,
    policyCertified,
    replayCertified,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    replayReferenceCount: evidencePath.replayReferences.length,
  });
}

export function buildGovernanceBindingCertificationResult(input: GovernanceBindingCertificationInput): GovernanceBindingCertificationResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createGovernanceBindingCertificationEvidencePath(normalizedInput);
  const validation = validateGovernanceBindingCertification(normalizedInput);

  const certificationHash = hashCertificationValue("governance-binding-certification-gate", {
    request,
    evidencePath,
    certificationState: validation.certificationState,
    bindingsCertified: validation.bindingsCertified,
    authorityCertified: validation.authorityCertified,
    policyCertified: validation.policyCertified,
    replayCertified: validation.replayCertified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    certificationState: validation.certificationState,
    bindingsCertified: validation.bindingsCertified,
    authorityCertified: validation.authorityCertified,
    policyCertified: validation.policyCertified,
    replayCertified: validation.replayCertified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

export function buildGovernanceBindingCertificationObservability(result: GovernanceBindingCertificationResult): GovernanceBindingCertificationObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    certificationState: result.certificationState,
    bindingsCertified: result.bindingsCertified,
    authorityCertified: result.authorityCertified,
    policyCertified: result.policyCertified,
    replayCertified: result.replayCertified,
    certificationHash: result.certificationHash,
  });
}

export function sealGovernanceBindingCertification(input: GovernanceBindingCertificationInput): SealedGovernanceBindingCertificationRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createGovernanceBindingCertificationEvidencePath(normalizedInput);
  const validation = validateGovernanceBindingCertification(normalizedInput);
  const result = buildGovernanceBindingCertificationResult(normalizedInput);
  const observability = buildGovernanceBindingCertificationObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    certificationOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    approvalBehaviorAllowed: false as const,
    policyExecutionAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const GovernanceBindingCertificationValidator = Object.freeze({
  validate: validateGovernanceBindingCertification,
});

export const GovernanceBindingCertificationGate = Object.freeze({
  buildRequest: buildGovernanceBindingCertificationRequest,
  createEvidencePath: createGovernanceBindingCertificationEvidencePath,
  buildResult: buildGovernanceBindingCertificationResult,
  seal: sealGovernanceBindingCertification,
});

export const GovernanceBindingCertificationObservabilityService = Object.freeze({
  build: buildGovernanceBindingCertificationObservability,
});
