import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedStrategicReadinessCertificationRecord,
  StrategicReadinessCertificationEvidencePath,
  StrategicReadinessCertificationInput,
  StrategicReadinessCertificationObservability,
  StrategicReadinessCertificationReasonCode,
  StrategicReadinessCertificationRequest,
  StrategicReadinessCertificationResult,
  StrategicReadinessCertificationScope,
  StrategicReadinessCertificationValidation,
} from "./types";

const MAX_CERTIFICATION_DEPTH = 20;
const MAX_EVIDENCE_REFERENCES = 5000;
const MAX_REPLAY_REFERENCES = 1000;

const CERTIFICATION_SCOPES: readonly StrategicReadinessCertificationScope[] = Object.freeze([
  "ALIGNMENT",
  "FULL",
  "READINESS",
  "REPLAY",
  "REVIEW_PACKET",
]);

type BoundaryValidation = Readonly<{ executionImpossible: boolean; authorityBounded: boolean; invalidBoundary: boolean }>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: StrategicReadinessCertificationReasonCode[], reason: StrategicReadinessCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: StrategicReadinessCertificationRequest): StrategicReadinessCertificationRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: StrategicReadinessCertificationInput): string[] {
  return normalizeStrings([
    input.readiness.result.readinessHash,
    input.alignment.result.alignmentHash,
    input.reviewPacket.result.packetHash,
    input.replayFramework.result.replayHash,
    input.replayFramework.result.reconstructionHash,
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

function evidenceReferencesForScope(scope: StrategicReadinessCertificationScope, input: StrategicReadinessCertificationInput): string[] {
  if (scope === "READINESS") return normalizeStrings(input.readiness.evidencePath.evidenceReferences);
  if (scope === "ALIGNMENT") return normalizeStrings(input.alignment.evidencePath.evidenceReferences);
  if (scope === "REVIEW_PACKET") return normalizeStrings(input.reviewPacket.evidencePath.evidenceReferences);
  if (scope === "REPLAY") return normalizeStrings(input.replayFramework.evidencePath.evidenceReferences);
  return normalizeStrings([
    ...input.readiness.evidencePath.evidenceReferences,
    ...input.alignment.evidencePath.evidenceReferences,
    ...input.reviewPacket.evidencePath.evidenceReferences,
    ...input.replayFramework.evidencePath.evidenceReferences,
  ]);
}

function replayReferencesForScope(scope: StrategicReadinessCertificationScope, input: StrategicReadinessCertificationInput): string[] {
  if (scope === "READINESS") return normalizeStrings(input.readiness.evidencePath.replayReferences);
  if (scope === "REPLAY") return normalizeStrings(input.replayFramework.evidencePath.replayReferences);
  return normalizeStrings([
    ...input.reviewPacket.evidencePath.replayReferences,
    ...input.replayFramework.evidencePath.replayReferences,
  ]);
}

function lineageReferencesForScope(scope: StrategicReadinessCertificationScope, input: StrategicReadinessCertificationInput): string[] {
  if (scope === "REVIEW_PACKET") return normalizeStrings(input.reviewPacket.evidencePath.lineageReferences);
  return normalizeStrings([
    ...input.lineage.ancestryChain.map((node) => node.lineageReference),
    ...input.reviewPacket.evidencePath.lineageReferences,
  ]);
}

function validateSealedArtifacts(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const states = [
    [input.readiness.sealed, "READINESS_REQUIRED", "READINESS_UNSEALED"],
    [input.alignment.sealed, "ALIGNMENT_REQUIRED", "ALIGNMENT_UNSEALED"],
    [input.reviewPacket.sealed, "REVIEW_PACKET_REQUIRED", "REVIEW_PACKET_UNSEALED"],
    [input.replayFramework.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "RECOMMENDATION_REPLAY_REQUIRED", "RECOMMENDATION_REPLAY_UNSEALED"],
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

function validateScope(scope: StrategicReadinessCertificationScope, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: StrategicReadinessCertificationRequest, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.readiness.result.tenantIsolationVerified
    && input.alignment.result.tenantIsolationVerified
    && input.reviewPacket.result.tenantIsolationVerified
    && input.replayFramework.result.tenantIsolationVerified
    && input.ledger.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CERTIFICATION_BLOCKED");
  return valid;
}

function validateOwnership(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const valid = input.ownershipEvidence.recommendationId === input.request.recommendationId
    && input.ownershipEvidence.ownershipReferences.length > 0
    && input.certification.result.ownershipCertified
    && input.authorityScope.result.ownershipValidated;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateReadiness(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const certified = input.readiness.result.readinessState !== "NOT_READY"
    && input.readiness.result.readinessHash.length === 64
    && input.readiness.result.evidenceComplete;
  addReason(reasons, certified ? "READINESS_CERTIFIED" : "READINESS_INTEGRITY_BROKEN");
  return certified;
}

function validateAlignment(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const certified = input.alignment.result.alignmentState !== "MISALIGNED"
    && input.alignment.result.alignmentHash.length === 64
    && input.alignment.result.governanceAligned;
  addReason(reasons, certified ? "ALIGNMENT_CERTIFIED" : "ALIGNMENT_INTEGRITY_BROKEN");
  return certified;
}

function validateReviewPacket(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const certified = input.reviewPacket.result.packetState !== "INVALID"
    && input.reviewPacket.result.packetHash.length === 64
    && input.reviewPacket.result.governanceIncluded;
  addReason(reasons, certified ? "REVIEW_PACKET_CERTIFIED" : "REVIEW_PACKET_INTEGRITY_BROKEN");
  return certified;
}

function validateReplay(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const certified = input.replayFramework.result.replayState === "REPLAYABLE"
    && input.replayFramework.result.replayHash.length === 64
    && input.replayFramework.result.reconstructionHash.length === 64;
  addReason(reasons, certified ? "REPLAY_CERTIFIED" : "REPLAY_DEGRADED");
  if (input.replayFramework.result.replayState === "INVALID" || input.replayFramework.result.replayState === "ESCALATED") {
    addReason(reasons, "REPLAY_CORRUPTION_DETECTED");
  }
  return certified;
}

function validateGovernance(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const certified = input.binding.result.bindingState !== "INVALID"
    && input.authorityScope.result.scopeState !== "INVALID"
    && input.policyVisibility.result.visibilityState !== "INVALID"
    && input.governanceCertification.result.certificationState !== "FAIL";
  addReason(reasons, certified ? "GOVERNANCE_CERTIFIED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return certified;
}

function validateObservability(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const certified = input.observability.result.observabilityState === "VISIBLE"
    && input.inspection.result.inspectionState === "AVAILABLE"
    && input.visibility.result.visibilityState === "VISIBLE"
    && input.audit.result.exportState === "EXPORTED"
    && input.observabilityCertification.result.certificationState === "PASS";
  addReason(reasons, certified ? "OBSERVABILITY_CERTIFIED" : "OBSERVABILITY_INCOMPLETE");
  return certified;
}

function validateEvidenceHashes(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateHiddenState(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const valid = input.hiddenCertificationStateDetected !== true;
  addReason(reasons, valid ? "HIDDEN_CERTIFICATION_STATE_ABSENT" : "HIDDEN_CERTIFICATION_STATE_DETECTED");
  return valid;
}

function validateBoundary(input: StrategicReadinessCertificationInput, reasons: StrategicReadinessCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.readiness.validation.authorityBounded
    && input.alignment.validation.authorityBounded
    && input.reviewPacket.validation.authorityBounded
    && input.replayFramework.validation.authorityBounded
    && input.observabilityCertification.validation.authorityBounded
    && input.binding.validation.authorityBounded
    && input.authorityScope.validation.authorityBounded
    && input.policyVisibility.validation.authorityBounded
    && input.governanceReplay.validation.authorityBounded
    && input.governanceCertification.validation.authorityBounded;
  const invalidBoundary = input.certificationMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationApprovalRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.governanceExecutionRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenCertificationStateDetected === true;
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RECOMMENDATION_RANKING_DETECTED" : "RECOMMENDATION_RANKING_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.governanceExecutionRequested === true ? "GOVERNANCE_EXECUTION_DETECTED" : "GOVERNANCE_EXECUTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "STRATEGIC_READINESS_CERTIFICATION_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(input: StrategicReadinessCertificationInput, path: StrategicReadinessCertificationEvidencePath, reasons: StrategicReadinessCertificationReasonCode[]): boolean {
  const depthValid = input.lineage.ancestryChain.length <= MAX_CERTIFICATION_DEPTH;
  const evidenceValid = path.evidenceReferences.length <= MAX_EVIDENCE_REFERENCES;
  const replayValid = path.replayReferences.length <= MAX_REPLAY_REFERENCES;
  addReason(reasons, depthValid ? "CERTIFICATION_DEPTH_VALID" : "CERTIFICATION_DEPTH_EXCEEDED");
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayValid ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && evidenceValid && replayValid;
}

function classifyCertificationState(valid: boolean, replayCertified: boolean, observabilityCertified: boolean): StrategicReadinessCertificationResult["certificationState"] {
  if (!valid) return "FAIL";
  if (!replayCertified || !observabilityCertified) return "CONDITIONAL_PASS";
  return "PASS";
}

export function buildStrategicReadinessCertificationRequest(
  input: Omit<StrategicReadinessCertificationInput, "request"> & { recommendationId?: string; tenantId?: string; certificationScope?: StrategicReadinessCertificationScope; graphVersion?: string },
): StrategicReadinessCertificationRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    certificationScope: input.certificationScope ?? "FULL",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  });
}

export function createStrategicReadinessCertificationEvidencePath(input: StrategicReadinessCertificationInput): StrategicReadinessCertificationEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.certificationScope,
    evidenceReferences: Object.freeze(evidenceReferencesForScope(request.certificationScope, input)),
    replayReferences: Object.freeze(replayReferencesForScope(request.certificationScope, input)),
    lineageReferences: Object.freeze(lineageReferencesForScope(request.certificationScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateStrategicReadinessCertification(input: StrategicReadinessCertificationInput): StrategicReadinessCertificationValidation {
  const reasons: StrategicReadinessCertificationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessCertificationEvidencePath(normalizedInput);
  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.certificationScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const readinessCertified = validateReadiness(normalizedInput, reasons);
  const alignmentCertified = validateAlignment(normalizedInput, reasons);
  const reviewPacketCertified = validateReviewPacket(normalizedInput, reasons);
  const replayCertified = validateReplay(normalizedInput, reasons);
  const governanceCertified = validateGovernance(normalizedInput, reasons);
  const observabilityCertified = validateObservability(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const hiddenStateValid = validateHiddenState(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(normalizedInput, evidencePath, reasons);
  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && readinessCertified
    && alignmentCertified
    && reviewPacketCertified
    && governanceCertified
    && evidenceHashesValid
    && hiddenStateValid
    && limitsValid
    && !boundary.invalidBoundary
    && input.replayFramework.result.replayState !== "INVALID"
    && input.replayFramework.result.replayState !== "ESCALATED";
  return Object.freeze({
    valid,
    certificationState: classifyCertificationState(valid, replayCertified, observabilityCertified),
    reasonCodes: normalizeStrings(reasons) as readonly StrategicReadinessCertificationReasonCode[],
    readinessCertified,
    alignmentCertified,
    reviewPacketCertified,
    replayCertified,
    governanceCertified,
    observabilityCertified,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    replayReferenceCount: evidencePath.replayReferences.length,
  });
}

export function buildStrategicReadinessCertificationResult(input: StrategicReadinessCertificationInput): StrategicReadinessCertificationResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessCertificationEvidencePath(normalizedInput);
  const validation = validateStrategicReadinessCertification(normalizedInput);
  const certificationHash = hashCertificationValue("strategic-readiness-certification", {
    request,
    evidencePath,
    certificationState: validation.certificationState,
    readinessCertified: validation.readinessCertified,
    alignmentCertified: validation.alignmentCertified,
    reviewPacketCertified: validation.reviewPacketCertified,
    replayCertified: validation.replayCertified,
    governanceCertified: validation.governanceCertified,
    observabilityCertified: validation.observabilityCertified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });
  return Object.freeze({
    recommendationId: request.recommendationId,
    certificationState: validation.certificationState,
    readinessCertified: validation.readinessCertified,
    alignmentCertified: validation.alignmentCertified,
    reviewPacketCertified: validation.reviewPacketCertified,
    replayCertified: validation.replayCertified,
    governanceCertified: validation.governanceCertified,
    observabilityCertified: validation.observabilityCertified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

export function buildStrategicReadinessCertificationObservability(result: StrategicReadinessCertificationResult): StrategicReadinessCertificationObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    certificationState: result.certificationState,
    readinessCertified: result.readinessCertified,
    alignmentCertified: result.alignmentCertified,
    reviewPacketCertified: result.reviewPacketCertified,
    replayCertified: result.replayCertified,
    governanceCertified: result.governanceCertified,
    observabilityCertified: result.observabilityCertified,
    certificationHash: result.certificationHash,
  });
}

export function sealStrategicReadinessCertification(input: StrategicReadinessCertificationInput): SealedStrategicReadinessCertificationRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessCertificationEvidencePath(normalizedInput);
  const validation = validateStrategicReadinessCertification(normalizedInput);
  const result = buildStrategicReadinessCertificationResult(normalizedInput);
  const observability = buildStrategicReadinessCertificationObservability(result);
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
    recommendationApprovalAllowed: false as const,
    recommendationRankingAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    governanceExecutionAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const StrategicReadinessCertificationValidator = Object.freeze({ validate: validateStrategicReadinessCertification });
export const StrategicReadinessCertificationGate = Object.freeze({
  buildRequest: buildStrategicReadinessCertificationRequest,
  createEvidencePath: createStrategicReadinessCertificationEvidencePath,
  buildResult: buildStrategicReadinessCertificationResult,
  seal: sealStrategicReadinessCertification,
});
export const StrategicReadinessCertificationObservabilityService = Object.freeze({ build: buildStrategicReadinessCertificationObservability });
