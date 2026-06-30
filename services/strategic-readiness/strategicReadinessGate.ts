import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedStrategicReadinessRecord,
  StrategicReadinessEvidencePath,
  StrategicReadinessInput,
  StrategicReadinessObservability,
  StrategicReadinessReasonCode,
  StrategicReadinessRequest,
  StrategicReadinessResult,
  StrategicReadinessScope,
  StrategicReadinessValidation,
} from "./types";

const MAX_READINESS_DEPTH = 20;
const MAX_EVIDENCE_REFERENCES = 5000;
const MAX_REPLAY_REFERENCES = 1000;

const READINESS_SCOPES: readonly StrategicReadinessScope[] = Object.freeze([
  "EVIDENCE",
  "FULL",
  "GOVERNANCE",
  "OBSERVABILITY",
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

function addReason(reasons: StrategicReadinessReasonCode[], reason: StrategicReadinessReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReadinessValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: StrategicReadinessRequest): StrategicReadinessRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    readinessScope: request.readinessScope,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: StrategicReadinessInput): string[] {
  return normalizeStrings([
    input.ledger.result.ledgerHash,
    input.lineage.result.reconstructionHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.replay.result.reconstructionHash,
    input.integrity.result.integrityHash,
    input.certification.result.certificationHash,
    input.observability.result.observabilityHash,
    input.inspection.result.inspectionHash,
    input.visibility.result.visibilityHash,
    input.audit.result.exportHash,
    input.observabilityCertification.result.certificationHash,
    input.binding.result.governanceHash,
    input.authorityScope.result.authorityHash,
    input.policyVisibility.result.policyHash,
    input.governanceReplay.result.replayHash,
    input.governanceReplay.result.reconstructionHash,
    input.governanceCertification.result.certificationHash,
    input.governanceReferences.governanceHash,
    input.ownershipEvidence.ownershipHash,
    input.replayEvidence.replayHash,
  ]);
}

function evidenceReferencesForScope(scope: StrategicReadinessScope, input: StrategicReadinessInput): string[] {
  if (scope === "EVIDENCE") {
    return normalizeStrings([
      input.ledger.entry.ledgerEntryId,
      ...input.ledger.entry.evidenceIds,
      ...input.lineage.evidencePath.evidenceIds,
      ...input.verification.evidencePath.evidenceIds,
    ]);
  }
  if (scope === "OBSERVABILITY") {
    return normalizeStrings([
      ...input.observability.evidencePath.evidenceIds,
      ...input.inspection.evidencePath.evidenceIds,
      ...input.visibility.evidencePath.evidenceIds,
      ...input.audit.evidencePath.evidenceIds,
    ]);
  }
  if (scope === "GOVERNANCE") {
    return normalizeStrings([
      ...input.binding.evidencePath.lineageReferences,
      ...input.authorityScope.evidencePath.scopeReferences,
      ...input.policyVisibility.evidencePath.policyReferences,
    ]);
  }
  if (scope === "REPLAY") {
    return normalizeStrings([
      ...input.replay.evidencePath.evidenceIds,
      ...input.governanceReplay.evidencePath.replayReferences,
      ...input.replayEvidence.replayReferences,
    ]);
  }
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    ...input.ledger.entry.evidenceIds,
    ...input.lineage.evidencePath.evidenceIds,
    ...input.verification.evidencePath.evidenceIds,
    ...input.observability.evidencePath.evidenceIds,
    ...input.inspection.evidencePath.evidenceIds,
    ...input.visibility.evidencePath.evidenceIds,
    ...input.audit.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.governanceReplay.evidencePath.replayReferences,
  ]);
}

function replayReferencesForScope(scope: StrategicReadinessScope, input: StrategicReadinessInput): string[] {
  if (scope === "EVIDENCE") return normalizeStrings(input.replayEvidence.replayReferences);
  if (scope === "REPLAY") {
    return normalizeStrings([
      ...input.replay.evidencePath.evidenceIds,
      ...input.governanceReplay.evidencePath.replayReferences,
      ...input.replayEvidence.replayReferences,
    ]);
  }
  return normalizeStrings([
    ...input.replay.evidencePath.evidenceIds,
    ...input.governanceReplay.evidencePath.replayReferences,
  ]);
}

function governanceReferencesForScope(scope: StrategicReadinessScope, input: StrategicReadinessInput): string[] {
  if (scope === "GOVERNANCE" || scope === "FULL") {
    return normalizeStrings(input.governanceReferences.governanceReferences);
  }
  return normalizeStrings(input.binding.evidencePath.governanceReferences);
}

function validateSealedArtifacts(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const states = [
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.integrity.sealed, "INTEGRITY_REQUIRED", "INTEGRITY_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
    [input.observability.sealed, "OBSERVABILITY_REQUIRED", "OBSERVABILITY_UNSEALED"],
    [input.inspection.sealed, "INSPECTION_REQUIRED", "INSPECTION_UNSEALED"],
    [input.visibility.sealed, "VISIBILITY_REQUIRED", "VISIBILITY_UNSEALED"],
    [input.audit.sealed, "AUDIT_REQUIRED", "AUDIT_UNSEALED"],
    [input.observabilityCertification.sealed, "OBSERVABILITY_CERTIFICATION_REQUIRED", "OBSERVABILITY_CERTIFICATION_UNSEALED"],
    [input.binding.sealed, "BINDING_REQUIRED", "BINDING_UNSEALED"],
    [input.authorityScope.sealed, "AUTHORITY_SCOPE_REQUIRED", "AUTHORITY_SCOPE_UNSEALED"],
    [input.policyVisibility.sealed, "POLICY_VISIBILITY_REQUIRED", "POLICY_VISIBILITY_UNSEALED"],
    [input.governanceReplay.sealed, "GOVERNANCE_REPLAY_REQUIRED", "GOVERNANCE_REPLAY_UNSEALED"],
    [input.governanceCertification.sealed, "GOVERNANCE_CERTIFICATION_REQUIRED", "GOVERNANCE_CERTIFICATION_UNSEALED"],
    [input.governanceReferences.sealed, "GOVERNANCE_REFERENCES_REQUIRED", "GOVERNANCE_REFERENCES_UNSEALED"],
    [input.ownershipEvidence.sealed, "OWNERSHIP_EVIDENCE_REQUIRED", "OWNERSHIP_EVIDENCE_UNSEALED"],
    [input.replayEvidence.sealed, "REPLAY_EVIDENCE_REQUIRED", "REPLAY_EVIDENCE_UNSEALED"],
  ] as const;

  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateScope(scope: StrategicReadinessScope, reasons: StrategicReadinessReasonCode[]): boolean {
  const valid = READINESS_SCOPES.includes(scope);
  addReason(reasons, valid ? "READINESS_SCOPE_VALID" : "READINESS_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: StrategicReadinessRequest, reasons: StrategicReadinessReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && input.observability.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
    && input.visibility.result.tenantIsolationVerified
    && input.audit.result.tenantIsolationVerified
    && input.observabilityCertification.result.tenantIsolationVerified
    && input.binding.result.tenantIsolationVerified
    && input.authorityScope.result.tenantIsolationVerified
    && input.policyVisibility.result.tenantIsolationVerified
    && input.governanceReplay.result.tenantIsolationVerified
    && input.governanceCertification.result.tenantIsolationVerified
    && input.governanceReferences.tenantId === tenantId
    && input.ownershipEvidence.tenantId === tenantId
    && input.replayEvidence.tenantId === tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_READINESS_BLOCKED");
  return valid;
}

function validateOwnership(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const valid = input.ownershipEvidence.recommendationId === input.request.recommendationId
    && input.ownershipEvidence.ownershipReferences.length > 0
    && input.verification.result.ownershipVerified
    && input.certification.result.ownershipCertified
    && input.authorityScope.result.ownershipValidated;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateEvidenceCompleteness(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const complete = input.ledger.entry.evidenceIds.length > 0
    && input.lineage.ancestryChain.length > 0
    && input.verification.result.historyIntegrity
    && input.verification.result.lineageIntegrity
    && input.verification.result.ownershipVerified
    && input.replayEvidence.replayReferences.length > 0
    && input.ownershipEvidence.ownershipReferences.length > 0;
  addReason(reasons, complete ? "EVIDENCE_COMPLETE" : "EVIDENCE_INCOMPLETE");
  return complete;
}

function validateGovernanceAlignment(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const aligned = input.binding.result.bindingState !== "INVALID"
    && input.authorityScope.result.scopeState !== "INVALID"
    && input.policyVisibility.result.visibilityState !== "INVALID"
    && input.governanceCertification.result.certificationState !== "FAIL"
    && input.governanceCertification.result.bindingsCertified
    && input.governanceCertification.result.authorityCertified
    && input.governanceCertification.result.policyCertified;
  addReason(reasons, aligned ? "GOVERNANCE_ALIGNED" : "GOVERNANCE_ALIGNMENT_FAILED");
  return aligned;
}

function validateReplayReadiness(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const ready = input.replay.result.replayState === "REPLAYABLE"
    && input.replay.result.replayIntegrity
    && input.replay.result.reconstructionSuccessful
    && input.governanceReplay.result.replayState === "REPLAYABLE"
    && input.governanceReplay.result.governanceReconstructed
    && input.governanceReplay.result.authorityReconstructed
    && input.governanceReplay.result.policyReconstructed
    && input.governanceReplay.result.lineageReconstructed
    && input.governanceCertification.result.replayCertified;
  addReason(reasons, ready ? "REPLAY_READY" : "REPLAY_UNAVAILABLE");
  return ready;
}

function validateObservabilityCompleteness(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const complete = input.observability.result.observabilityState === "VISIBLE"
    && input.inspection.result.inspectionState === "AVAILABLE"
    && input.visibility.result.visibilityState === "VISIBLE"
    && input.audit.result.exportState === "EXPORTED"
    && input.observabilityCertification.result.certificationState !== "FAIL"
    && input.observabilityCertification.result.visibilityCertified
    && input.observabilityCertification.result.inspectionCertified
    && input.observabilityCertification.result.auditCertified;
  addReason(reasons, complete ? "OBSERVABILITY_COMPLETE" : "OBSERVABILITY_INCOMPLETE");
  return complete;
}

function validateCertificationValidity(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const valid = input.certification.result.certificationState !== "FAIL"
    && input.certification.result.historyCertified
    && input.certification.result.lineageCertified
    && input.certification.result.ownershipCertified
    && input.observabilityCertification.result.certificationState !== "FAIL"
    && input.governanceCertification.result.certificationState !== "FAIL";
  addReason(reasons, valid ? "CERTIFICATION_VALID" : "CERTIFICATION_INCOMPLETE");
  return valid;
}

function validateEvidenceHashes(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateReplayCorruption(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const corrupted = input.replay.result.replayState === "INVALID"
    || input.governanceReplay.result.replayState === "INVALID"
    || input.replay.result.replayIntegrity !== true;
  addReason(reasons, corrupted ? "REPLAY_CORRUPTION_DETECTED" : "REPLAY_READY");
  return !corrupted;
}

function validateCertificationCorruption(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const corrupted = input.certification.result.certificationState === "FAIL"
    || input.observabilityCertification.result.certificationState === "FAIL"
    || input.governanceCertification.result.certificationState === "FAIL";
  addReason(reasons, corrupted ? "CERTIFICATION_CORRUPTION_DETECTED" : "CERTIFICATION_VALID");
  return !corrupted;
}

function validateHiddenState(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): boolean {
  const valid = input.hiddenStateDetected !== true;
  addReason(reasons, valid ? "HIDDEN_STATE_ABSENT" : "HIDDEN_STATE_DETECTED");
  return valid;
}

function validateBoundary(input: StrategicReadinessInput, reasons: StrategicReadinessReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.certification.validation.authorityBounded
    && input.observabilityCertification.validation.authorityBounded
    && input.binding.validation.authorityBounded
    && input.authorityScope.validation.authorityBounded
    && input.policyVisibility.validation.authorityBounded
    && input.governanceReplay.validation.authorityBounded
    && input.governanceCertification.validation.authorityBounded;
  const invalidBoundary = input.readinessMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationApprovalRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.governanceExecutionRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenStateDetected === true;

  addReason(reasons, input.readinessMutationAttempted === true ? "READINESS_MUTATION_DETECTED" : "READINESS_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RECOMMENDATION_RANKING_DETECTED" : "RECOMMENDATION_RANKING_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.governanceExecutionRequested === true ? "GOVERNANCE_EXECUTION_DETECTED" : "GOVERNANCE_EXECUTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "STRATEGIC_READINESS_IS_NOT_APPROVAL");

  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(input: StrategicReadinessInput, path: StrategicReadinessEvidencePath, reasons: StrategicReadinessReasonCode[]): boolean {
  const depthValid = input.lineage.ancestryChain.length <= MAX_READINESS_DEPTH;
  const evidenceValid = path.evidenceReferences.length <= MAX_EVIDENCE_REFERENCES;
  const replayValid = path.replayReferences.length <= MAX_REPLAY_REFERENCES;
  addReason(reasons, depthValid ? "READINESS_DEPTH_VALID" : "READINESS_DEPTH_EXCEEDED");
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayValid ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && evidenceValid && replayValid;
}

function classifyReadinessState(
  valid: boolean,
  evidenceComplete: boolean,
  governanceAligned: boolean,
  replayReady: boolean,
  observabilityComplete: boolean,
  certificationValid: boolean,
  tenantIsolationVerified: boolean,
  ownershipValid: boolean,
  authorityBounded: boolean,
  replayDegraded: boolean,
  observabilityDegraded: boolean,
): StrategicReadinessResult["readinessState"] {
  if (!valid) return "NOT_READY";
  if (
    evidenceComplete
    && governanceAligned
    && replayReady
    && observabilityComplete
    && certificationValid
    && tenantIsolationVerified
    && ownershipValid
  ) {
    return "READY";
  }
  if (governanceAligned && authorityBounded && (replayDegraded || observabilityDegraded)) {
    return "LIMITED";
  }
  return "OBSERVE";
}

export function buildStrategicReadinessRequest(
  input: Omit<StrategicReadinessInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    readinessScope?: StrategicReadinessScope;
    graphVersion?: string;
  },
): StrategicReadinessRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    readinessScope: input.readinessScope ?? "FULL",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  });
}

export function createStrategicReadinessEvidencePath(input: StrategicReadinessInput): StrategicReadinessEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.readinessScope,
    evidenceReferences: Object.freeze(evidenceReferencesForScope(request.readinessScope, input)),
    replayReferences: Object.freeze(replayReferencesForScope(request.readinessScope, input)),
    governanceReferences: Object.freeze(governanceReferencesForScope(request.readinessScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateStrategicReadiness(input: StrategicReadinessInput): StrategicReadinessValidation {
  const reasons: StrategicReadinessReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.readinessScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const evidenceComplete = validateEvidenceCompleteness(normalizedInput, reasons);
  const governanceAligned = validateGovernanceAlignment(normalizedInput, reasons);
  const replayReady = validateReplayReadiness(normalizedInput, reasons);
  const observabilityComplete = validateObservabilityCompleteness(normalizedInput, reasons);
  const certificationValid = validateCertificationValidity(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const replayIntegrityValid = validateReplayCorruption(normalizedInput, reasons);
  const certificationIntegrityValid = validateCertificationCorruption(normalizedInput, reasons);
  const hiddenStateValid = validateHiddenState(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(normalizedInput, evidencePath, reasons);

  const replayDegraded = normalizedInput.replay.result.replayState === "LIMITED"
    || normalizedInput.governanceReplay.result.replayState === "LIMITED"
    || normalizedInput.certification.result.certificationState === "CONDITIONAL_PASS"
    || normalizedInput.governanceCertification.result.certificationState === "CONDITIONAL_PASS";
  if (replayDegraded) addReason(reasons, "REPLAY_DEGRADED");

  const observabilityDegraded = normalizedInput.observability.result.observabilityState === "LIMITED"
    || normalizedInput.inspection.result.inspectionState === "LIMITED"
    || normalizedInput.visibility.result.visibilityState === "LIMITED"
    || normalizedInput.audit.result.exportState === "LIMITED"
    || normalizedInput.observabilityCertification.result.certificationState === "CONDITIONAL_PASS";
  if (observabilityDegraded) addReason(reasons, "OBSERVABILITY_INCOMPLETE");

  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && governanceAligned
    && evidenceHashesValid
    && replayIntegrityValid
    && certificationIntegrityValid
    && hiddenStateValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    readinessState: classifyReadinessState(
      valid,
      evidenceComplete,
      governanceAligned,
      replayReady,
      observabilityComplete,
      certificationValid,
      tenantIsolationVerified,
      ownershipValid,
      boundary.authorityBounded,
      replayDegraded,
      observabilityDegraded,
    ),
    reasonCodes: normalizeStrings(reasons) as readonly StrategicReadinessReasonCode[],
    evidenceComplete,
    governanceAligned,
    replayReady,
    observabilityComplete,
    certificationValid,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    evidenceReferenceCount: evidencePath.evidenceReferences.length,
  });
}

export function buildStrategicReadinessResult(input: StrategicReadinessInput): StrategicReadinessResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessEvidencePath(normalizedInput);
  const validation = validateStrategicReadiness(normalizedInput);

  const readinessHash = hashReadinessValue("strategic-readiness-gate", {
    request,
    evidencePath,
    readinessState: validation.readinessState,
    evidenceComplete: validation.evidenceComplete,
    governanceAligned: validation.governanceAligned,
    replayReady: validation.replayReady,
    observabilityComplete: validation.observabilityComplete,
    certificationValid: validation.certificationValid,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    readinessState: validation.readinessState,
    evidenceComplete: validation.evidenceComplete,
    governanceAligned: validation.governanceAligned,
    replayReady: validation.replayReady,
    observabilityComplete: validation.observabilityComplete,
    certificationValid: validation.certificationValid,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    readinessHash,
    deterministic: true,
  });
}

export function buildStrategicReadinessObservability(result: StrategicReadinessResult): StrategicReadinessObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    readinessState: result.readinessState,
    evidenceComplete: result.evidenceComplete,
    governanceAligned: result.governanceAligned,
    replayReady: result.replayReady,
    observabilityComplete: result.observabilityComplete,
    certificationValid: result.certificationValid,
    readinessHash: result.readinessHash,
  });
}

export function sealStrategicReadiness(input: StrategicReadinessInput): SealedStrategicReadinessRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessEvidencePath(normalizedInput);
  const validation = validateStrategicReadiness(normalizedInput);
  const result = buildStrategicReadinessResult(normalizedInput);
  const observability = buildStrategicReadinessObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    readinessOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    recommendationApprovalAllowed: false as const,
    recommendationRankingAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    governanceExecutionAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const StrategicReadinessValidator = Object.freeze({
  validate: validateStrategicReadiness,
});

export const StrategicReadinessGate = Object.freeze({
  buildRequest: buildStrategicReadinessRequest,
  createEvidencePath: createStrategicReadinessEvidencePath,
  buildResult: buildStrategicReadinessResult,
  seal: sealStrategicReadiness,
});

export const StrategicReadinessObservabilityService = Object.freeze({
  build: buildStrategicReadinessObservability,
});
