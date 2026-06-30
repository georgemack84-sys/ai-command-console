import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  SealedStrategicReadinessReplayRecord,
  StrategicReadinessReplayEvidencePath,
  StrategicReadinessReplayInput,
  StrategicReadinessReplayObservability,
  StrategicReadinessReplayReasonCode,
  StrategicReadinessReplayRequest,
  StrategicReadinessReplayResult,
  StrategicReadinessReplayScope,
  StrategicReadinessReplayValidation,
} from "./types";

const MAX_REPLAY_DEPTH = 20;
const MAX_EVIDENCE_REFERENCES = 5000;
const MAX_REPLAY_REFERENCES = 1000;

const REPLAY_SCOPES: readonly StrategicReadinessReplayScope[] = Object.freeze([
  "ALIGNMENT",
  "FULL",
  "READINESS",
  "REVIEW_PACKET",
]);

type BoundaryValidation = Readonly<{ executionImpossible: boolean; authorityBounded: boolean; invalidBoundary: boolean }>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: StrategicReadinessReplayReasonCode[], reason: StrategicReadinessReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: StrategicReadinessReplayRequest): StrategicReadinessReplayRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    replayScope: request.replayScope,
    replayVersion: request.replayVersion,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: StrategicReadinessReplayInput): string[] {
  return normalizeStrings([
    input.readiness.result.readinessHash,
    input.alignment.result.alignmentHash,
    input.reviewPacket.result.packetHash,
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

function evidenceReferencesForScope(scope: StrategicReadinessReplayScope, input: StrategicReadinessReplayInput): string[] {
  if (scope === "READINESS") return normalizeStrings(input.readiness.evidencePath.evidenceReferences);
  if (scope === "ALIGNMENT") return normalizeStrings(input.alignment.evidencePath.evidenceReferences);
  if (scope === "REVIEW_PACKET") return normalizeStrings(input.reviewPacket.evidencePath.evidenceReferences);
  return normalizeStrings([
    ...input.readiness.evidencePath.evidenceReferences,
    ...input.alignment.evidencePath.evidenceReferences,
    ...input.reviewPacket.evidencePath.evidenceReferences,
  ]);
}

function replayReferencesForScope(scope: StrategicReadinessReplayScope, input: StrategicReadinessReplayInput): string[] {
  if (scope === "READINESS") return normalizeStrings(input.readiness.evidencePath.replayReferences);
  if (scope === "ALIGNMENT") return normalizeStrings(input.alignment.evidencePath.governanceReferences);
  if (scope === "REVIEW_PACKET") return normalizeStrings(input.reviewPacket.evidencePath.replayReferences);
  return normalizeStrings([
    ...input.readiness.evidencePath.replayReferences,
    ...input.reviewPacket.evidencePath.replayReferences,
    ...input.replayEvidence.replayReferences,
  ]);
}

function lineageReferencesForScope(scope: StrategicReadinessReplayScope, input: StrategicReadinessReplayInput): string[] {
  if (scope === "REVIEW_PACKET") return normalizeStrings(input.reviewPacket.evidencePath.lineageReferences);
  return normalizeStrings([
    ...input.lineage.ancestryChain.map((node) => node.lineageReference),
    ...input.reviewPacket.evidencePath.lineageReferences,
  ]);
}

function validateSealedArtifacts(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const states = [
    [input.readiness.sealed, "READINESS_REQUIRED", "READINESS_UNSEALED"],
    [input.alignment.sealed, "ALIGNMENT_REQUIRED", "ALIGNMENT_UNSEALED"],
    [input.reviewPacket.sealed, "REVIEW_PACKET_REQUIRED", "REVIEW_PACKET_UNSEALED"],
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

function validateScope(scope: StrategicReadinessReplayScope, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const valid = REPLAY_SCOPES.includes(scope);
  addReason(reasons, valid ? "REPLAY_SCOPE_VALID" : "REPLAY_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: StrategicReadinessReplayRequest, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.readiness.result.tenantIsolationVerified
    && input.alignment.result.tenantIsolationVerified
    && input.reviewPacket.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_REPLAY_BLOCKED");
  return valid;
}

function validateOwnership(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const valid = input.ownershipEvidence.recommendationId === input.request.recommendationId
    && input.ownershipEvidence.ownershipReferences.length > 0
    && input.certification.result.ownershipCertified
    && input.authorityScope.result.ownershipValidated;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateReadiness(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const reconstructed = input.readiness.result.readinessState !== "NOT_READY" && input.readiness.result.readinessHash.length === 64;
  addReason(reasons, reconstructed ? "READINESS_RECONSTRUCTED" : "READINESS_RECONSTRUCTION_MISSING");
  return reconstructed;
}

function validateAlignment(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const reconstructed = input.alignment.result.alignmentState !== "MISALIGNED" && input.alignment.result.alignmentHash.length === 64;
  addReason(reasons, reconstructed ? "ALIGNMENT_RECONSTRUCTED" : "ALIGNMENT_RECONSTRUCTION_MISSING");
  return reconstructed;
}

function validateReviewPacket(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const reconstructed = input.reviewPacket.result.packetState !== "INVALID" && input.reviewPacket.result.packetHash.length === 64;
  addReason(reasons, reconstructed ? "REVIEW_PACKET_RECONSTRUCTED" : "REVIEW_PACKET_RECONSTRUCTION_MISSING");
  return reconstructed;
}

function validateGovernance(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const reconstructed = input.binding.result.bindingState !== "INVALID"
    && input.authorityScope.result.scopeState !== "INVALID"
    && input.policyVisibility.result.visibilityState !== "INVALID"
    && input.governanceCertification.result.certificationState !== "FAIL";
  addReason(reasons, reconstructed ? "GOVERNANCE_RECONSTRUCTED" : "GOVERNANCE_RECONSTRUCTION_DEGRADED");
  return reconstructed;
}

function validateReplayArtifacts(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const present = input.replayEvidence.replayReferences.length > 0;
  addReason(reasons, present ? "REPLAY_HASH_VERIFIED" : "REPLAY_ARTIFACTS_MISSING");
  return present;
}

function validateEvidenceHashes(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateReplayHash(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const valid = input.replay.result.replayHash.length === 64 && input.governanceReplay.result.replayHash.length === 64;
  addReason(reasons, valid ? "REPLAY_HASH_VERIFIED" : "REPLAY_HASH_MISMATCH");
  return valid;
}

function validateHiddenState(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const valid = input.hiddenReplayStateDetected !== true;
  addReason(reasons, valid ? "HIDDEN_REPLAY_STATE_ABSENT" : "HIDDEN_REPLAY_STATE_DETECTED");
  return valid;
}

function validateBoundary(input: StrategicReadinessReplayInput, reasons: StrategicReadinessReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.readiness.validation.authorityBounded
    && input.alignment.validation.authorityBounded
    && input.reviewPacket.validation.authorityBounded
    && input.observabilityCertification.validation.authorityBounded
    && input.binding.validation.authorityBounded
    && input.authorityScope.validation.authorityBounded
    && input.policyVisibility.validation.authorityBounded
    && input.governanceReplay.validation.authorityBounded
    && input.governanceCertification.validation.authorityBounded;
  const invalidBoundary = input.replayMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationApprovalRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.governanceExecutionRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenReplayStateDetected === true;
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RECOMMENDATION_RANKING_DETECTED" : "RECOMMENDATION_RANKING_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.governanceExecutionRequested === true ? "GOVERNANCE_EXECUTION_DETECTED" : "GOVERNANCE_EXECUTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "STRATEGIC_READINESS_REPLAY_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(input: StrategicReadinessReplayInput, path: StrategicReadinessReplayEvidencePath, reasons: StrategicReadinessReplayReasonCode[]): boolean {
  const depthValid = input.lineage.ancestryChain.length <= MAX_REPLAY_DEPTH;
  const evidenceValid = path.evidenceReferences.length <= MAX_EVIDENCE_REFERENCES;
  const replayValid = path.replayReferences.length <= MAX_REPLAY_REFERENCES;
  addReason(reasons, depthValid ? "REPLAY_DEPTH_VALID" : "REPLAY_DEPTH_EXCEEDED");
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, replayValid ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && evidenceValid && replayValid;
}

function classifyReplayState(valid: boolean, limited: boolean, escalated: boolean): StrategicReadinessReplayResult["replayState"] {
  if (!valid) return "INVALID";
  if (escalated) return "ESCALATED";
  if (limited) return "LIMITED";
  return "REPLAYABLE";
}

export function buildStrategicReadinessReplayRequest(
  input: Omit<StrategicReadinessReplayInput, "request"> & { recommendationId?: string; tenantId?: string; replayScope?: StrategicReadinessReplayScope; replayVersion?: string; graphVersion?: string },
): StrategicReadinessReplayRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    replayScope: input.replayScope ?? "FULL",
    replayVersion: input.replayVersion ?? "strategic-readiness-replay/v1",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  });
}

export function createStrategicReadinessReplayEvidencePath(input: StrategicReadinessReplayInput): StrategicReadinessReplayEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.replayScope,
    evidenceReferences: Object.freeze(evidenceReferencesForScope(request.replayScope, input)),
    replayReferences: Object.freeze(replayReferencesForScope(request.replayScope, input)),
    lineageReferences: Object.freeze(lineageReferencesForScope(request.replayScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateStrategicReadinessReplay(input: StrategicReadinessReplayInput): StrategicReadinessReplayValidation {
  const reasons: StrategicReadinessReplayReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessReplayEvidencePath(normalizedInput);
  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.replayScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const readinessReconstructed = validateReadiness(normalizedInput, reasons);
  const alignmentReconstructed = validateAlignment(normalizedInput, reasons);
  const reviewPacketReconstructed = validateReviewPacket(normalizedInput, reasons);
  const governanceReconstructed = validateGovernance(normalizedInput, reasons);
  const replayArtifactsPresent = validateReplayArtifacts(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const replayHashValid = validateReplayHash(normalizedInput, reasons);
  const hiddenStateValid = validateHiddenState(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(normalizedInput, evidencePath, reasons);

  const limited = !replayArtifactsPresent || !readinessReconstructed || !alignmentReconstructed || !reviewPacketReconstructed;
  const escalated = !governanceReconstructed || !replayHashValid;
  if (escalated) addReason(reasons, "RECONSTRUCTION_BROKEN");

  const valid = sealedArtifacts && scopeValid && recommendationValid && tenantIsolationVerified && ownershipValid && evidenceHashesValid && hiddenStateValid && limitsValid && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    replayState: classifyReplayState(valid, limited, escalated),
    reasonCodes: normalizeStrings(reasons) as readonly StrategicReadinessReplayReasonCode[],
    readinessReconstructed,
    alignmentReconstructed,
    reviewPacketReconstructed,
    governanceReconstructed,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    replayReferenceCount: evidencePath.replayReferences.length,
  });
}

export function buildStrategicReadinessReplayResult(input: StrategicReadinessReplayInput): StrategicReadinessReplayResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessReplayEvidencePath(normalizedInput);
  const validation = validateStrategicReadinessReplay(normalizedInput);
  const replayHash = hashReplayValue("strategic-readiness-replay", { request, evidencePath, replayState: validation.replayState });
  const reconstructionHash = hashReplayValue("strategic-readiness-reconstruction", {
    request,
    readinessReconstructed: validation.readinessReconstructed,
    alignmentReconstructed: validation.alignmentReconstructed,
    reviewPacketReconstructed: validation.reviewPacketReconstructed,
    governanceReconstructed: validation.governanceReconstructed,
    replayHash,
  });
  return Object.freeze({
    recommendationId: request.recommendationId,
    replayState: validation.replayState,
    readinessReconstructed: validation.readinessReconstructed,
    alignmentReconstructed: validation.alignmentReconstructed,
    reviewPacketReconstructed: validation.reviewPacketReconstructed,
    governanceReconstructed: validation.governanceReconstructed,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

export function buildStrategicReadinessReplayObservability(result: StrategicReadinessReplayResult): StrategicReadinessReplayObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    replayState: result.replayState,
    readinessReconstructed: result.readinessReconstructed,
    alignmentReconstructed: result.alignmentReconstructed,
    reviewPacketReconstructed: result.reviewPacketReconstructed,
    governanceReconstructed: result.governanceReconstructed,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

export function sealStrategicReadinessReplay(input: StrategicReadinessReplayInput): SealedStrategicReadinessReplayRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createStrategicReadinessReplayEvidencePath(normalizedInput);
  const validation = validateStrategicReadinessReplay(normalizedInput);
  const result = buildStrategicReadinessReplayResult(normalizedInput);
  const observability = buildStrategicReadinessReplayObservability(result);
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
    recommendationApprovalAllowed: false as const,
    recommendationRankingAllowed: false as const,
    recommendationPrioritizationAllowed: false as const,
    governanceExecutionAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const StrategicReadinessReplayValidator = Object.freeze({ validate: validateStrategicReadinessReplay });
export const StrategicReadinessReplayFramework = Object.freeze({
  buildRequest: buildStrategicReadinessReplayRequest,
  createEvidencePath: createStrategicReadinessReplayEvidencePath,
  buildResult: buildStrategicReadinessReplayResult,
  seal: sealStrategicReadinessReplay,
});
export const StrategicReadinessReplayObservabilityService = Object.freeze({ build: buildStrategicReadinessReplayObservability });
