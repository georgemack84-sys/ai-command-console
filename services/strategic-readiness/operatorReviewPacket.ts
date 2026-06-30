import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  OperatorReviewPacketEvidencePath,
  OperatorReviewPacketInput,
  OperatorReviewPacketObservability,
  OperatorReviewPacketReasonCode,
  OperatorReviewPacketRequest,
  OperatorReviewPacketResult,
  OperatorReviewPacketScope,
  OperatorReviewPacketValidation,
  SealedOperatorReviewPacketRecord,
} from "./types";

const MAX_PACKET_DEPTH = 20;
const MAX_EVIDENCE_REFERENCES = 5000;
const MAX_PACKET_REFERENCES = 1000;

const PACKET_SCOPES: readonly OperatorReviewPacketScope[] = Object.freeze([
  "ALIGNMENT",
  "FULL",
  "GOVERNANCE",
  "READINESS",
  "SUMMARY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: OperatorReviewPacketReasonCode[], reason: OperatorReviewPacketReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashPacketValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: OperatorReviewPacketRequest): OperatorReviewPacketRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    packetScope: request.packetScope,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: OperatorReviewPacketInput): string[] {
  return normalizeStrings([
    input.readiness.result.readinessHash,
    input.alignment.result.alignmentHash,
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

function evidenceReferencesForScope(scope: OperatorReviewPacketScope, input: OperatorReviewPacketInput): string[] {
  if (scope === "SUMMARY") {
    return normalizeStrings([
      input.ledger.entry.ledgerEntryId,
      ...input.ledger.entry.evidenceIds,
      ...input.ownershipEvidence.ownershipReferences,
    ]);
  }
  if (scope === "READINESS") {
    return normalizeStrings([
      ...input.readiness.evidencePath.evidenceReferences,
      ...input.readiness.evidencePath.governanceReferences,
    ]);
  }
  if (scope === "ALIGNMENT") {
    return normalizeStrings([
      ...input.alignment.evidencePath.evidenceReferences,
      ...input.alignment.evidencePath.alignmentReferences,
    ]);
  }
  if (scope === "GOVERNANCE") {
    return normalizeStrings([
      ...input.binding.evidencePath.governanceReferences,
      ...input.authorityScope.evidencePath.scopeReferences,
      ...input.policyVisibility.evidencePath.policyReferences,
      ...input.governanceReplay.evidencePath.replayReferences,
    ]);
  }
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    ...input.ledger.entry.evidenceIds,
    ...input.readiness.evidencePath.evidenceReferences,
    ...input.alignment.evidencePath.evidenceReferences,
    ...input.governanceReplay.evidencePath.replayReferences,
    ...input.audit.evidencePath.evidenceIds,
  ]);
}

function replayReferencesForScope(scope: OperatorReviewPacketScope, input: OperatorReviewPacketInput): string[] {
  if (scope === "SUMMARY") return normalizeStrings(input.replayEvidence.replayReferences);
  if (scope === "GOVERNANCE") return normalizeStrings(input.governanceReplay.evidencePath.replayReferences);
  return normalizeStrings([
    ...input.replay.evidencePath.evidenceIds,
    ...input.governanceReplay.evidencePath.replayReferences,
    ...input.replayEvidence.replayReferences,
  ]);
}

function lineageReferencesForScope(scope: OperatorReviewPacketScope, input: OperatorReviewPacketInput): string[] {
  if (scope === "GOVERNANCE") return normalizeStrings(input.binding.evidencePath.lineageReferences);
  return normalizeStrings([
    ...input.lineage.ancestryChain.map((node) => node.lineageReference),
    ...input.lineage.evidencePath.lineageReferences,
  ]);
}

function validateSealedArtifacts(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const states = [
    [input.readiness.sealed, "READINESS_REQUIRED", "READINESS_UNSEALED"],
    [input.alignment.sealed, "ALIGNMENT_REQUIRED", "ALIGNMENT_UNSEALED"],
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

function validateScope(scope: OperatorReviewPacketScope, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const valid = PACKET_SCOPES.includes(scope);
  addReason(reasons, valid ? "PACKET_SCOPE_VALID" : "PACKET_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(request: OperatorReviewPacketRequest, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.readiness.result.tenantIsolationVerified
    && input.alignment.result.tenantIsolationVerified
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
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_PACKET_BLOCKED");
  return valid;
}

function validateOwnership(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const valid = input.ownershipEvidence.recommendationId === input.request.recommendationId
    && input.ownershipEvidence.ownershipReferences.length > 0
    && input.certification.result.ownershipCertified
    && input.authorityScope.result.ownershipValidated;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateReadiness(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const included = input.readiness.result.readinessState !== "NOT_READY";
  addReason(reasons, included ? "READINESS_INCLUDED" : "READINESS_MISSING");
  return included;
}

function validateAlignment(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const included = input.alignment.result.alignmentState !== "MISALIGNED";
  addReason(reasons, included ? "ALIGNMENT_INCLUDED" : "ALIGNMENT_MISSING");
  return included;
}

function validateGovernance(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const preserved = input.binding.result.bindingState !== "INVALID"
    && input.authorityScope.result.scopeState !== "INVALID"
    && input.policyVisibility.result.visibilityState !== "INVALID"
    && input.governanceCertification.result.certificationState !== "FAIL";
  addReason(reasons, preserved ? "GOVERNANCE_INCLUDED" : "GOVERNANCE_CONTEXT_MISSING");
  addReason(reasons, preserved ? "GOVERNANCE_CONTEXT_PRESERVED" : "GOVERNANCE_CORRUPTION_DETECTED");
  return preserved;
}

function validateReplay(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const included = input.replayEvidence.replayReferences.length > 0
    && input.replay.result.replayState !== "INVALID"
    && input.governanceReplay.result.replayState !== "INVALID";
  addReason(reasons, included ? "REPLAY_INCLUDED" : "REPLAY_REFERENCES_MISSING");
  return included;
}

function validateCertification(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const included = input.certification.result.certificationState !== "FAIL"
    && input.observabilityCertification.result.certificationState !== "FAIL"
    && input.governanceCertification.result.certificationState !== "FAIL";
  addReason(reasons, included ? "CERTIFICATION_INCLUDED" : "CERTIFICATION_EVIDENCE_MISSING");
  return included;
}

function validateEvidenceHashes(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateHiddenState(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const valid = input.hiddenStateDetected !== true;
  addReason(reasons, valid ? "HIDDEN_STATE_ABSENT" : "HIDDEN_STATE_DETECTED");
  return valid;
}

function validateBoundary(input: OperatorReviewPacketInput, reasons: OperatorReviewPacketReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.readiness.validation.authorityBounded
    && input.alignment.validation.authorityBounded
    && input.observabilityCertification.validation.authorityBounded
    && input.binding.validation.authorityBounded
    && input.authorityScope.validation.authorityBounded
    && input.policyVisibility.validation.authorityBounded
    && input.governanceReplay.validation.authorityBounded
    && input.governanceCertification.validation.authorityBounded;
  const invalidBoundary = input.packetMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationApprovalRequested === true
    || input.recommendationRankingRequested === true
    || input.recommendationPrioritizationRequested === true
    || input.governanceExecutionRequested === true
    || input.authorityExpansionDetected === true
    || input.hiddenStateDetected === true;
  addReason(reasons, input.packetMutationAttempted === true ? "PACKET_MUTATION_DETECTED" : "PACKET_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationApprovalRequested === true ? "RECOMMENDATION_APPROVAL_DETECTED" : "RECOMMENDATION_APPROVAL_BLOCKED");
  addReason(reasons, input.recommendationRankingRequested === true ? "RECOMMENDATION_RANKING_DETECTED" : "RECOMMENDATION_RANKING_BLOCKED");
  addReason(reasons, input.recommendationPrioritizationRequested === true ? "RECOMMENDATION_PRIORITIZATION_DETECTED" : "RECOMMENDATION_PRIORITIZATION_BLOCKED");
  addReason(reasons, input.governanceExecutionRequested === true ? "GOVERNANCE_EXECUTION_DETECTED" : "GOVERNANCE_EXECUTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "OPERATOR_REVIEW_PACKET_IS_NOT_APPROVAL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(input: OperatorReviewPacketInput, path: OperatorReviewPacketEvidencePath, reasons: OperatorReviewPacketReasonCode[]): boolean {
  const depthValid = input.lineage.ancestryChain.length <= MAX_PACKET_DEPTH;
  const evidenceValid = path.evidenceReferences.length <= MAX_EVIDENCE_REFERENCES;
  const packetValid = path.replayReferences.length + path.lineageReferences.length <= MAX_PACKET_REFERENCES;
  addReason(reasons, depthValid ? "PACKET_DEPTH_VALID" : "PACKET_DEPTH_EXCEEDED");
  addReason(reasons, evidenceValid ? "EVIDENCE_REFERENCE_LIMIT_VALID" : "EVIDENCE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, packetValid ? "PACKET_REFERENCE_LIMIT_VALID" : "PACKET_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && evidenceValid && packetValid;
}

function classifyPacketState(
  valid: boolean,
  readinessIncluded: boolean,
  alignmentIncluded: boolean,
  governanceIncluded: boolean,
  replayIncluded: boolean,
  certificationIncluded: boolean,
  authorityBounded: boolean,
): OperatorReviewPacketResult["packetState"] {
  if (!valid) return "INVALID";
  if (readinessIncluded && alignmentIncluded && governanceIncluded && replayIncluded && certificationIncluded) {
    return "READY_FOR_REVIEW";
  }
  if (!readinessIncluded || !alignmentIncluded) return "OBSERVE";
  if (governanceIncluded && authorityBounded) return "LIMITED";
  return "INVALID";
}

export function buildOperatorReviewPacketRequest(
  input: Omit<OperatorReviewPacketInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    packetScope?: OperatorReviewPacketScope;
    graphVersion?: string;
  },
): OperatorReviewPacketRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    packetScope: input.packetScope ?? "FULL",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  });
}

export function createOperatorReviewPacketEvidencePath(input: OperatorReviewPacketInput): OperatorReviewPacketEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.packetScope,
    evidenceReferences: Object.freeze(evidenceReferencesForScope(request.packetScope, input)),
    replayReferences: Object.freeze(replayReferencesForScope(request.packetScope, input)),
    lineageReferences: Object.freeze(lineageReferencesForScope(request.packetScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
  });
}

export function validateOperatorReviewPacket(input: OperatorReviewPacketInput): OperatorReviewPacketValidation {
  const reasons: OperatorReviewPacketReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createOperatorReviewPacketEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.packetScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const readinessIncluded = validateReadiness(normalizedInput, reasons);
  const alignmentIncluded = validateAlignment(normalizedInput, reasons);
  const governanceIncluded = validateGovernance(normalizedInput, reasons);
  const replayIncluded = validateReplay(normalizedInput, reasons);
  const certificationIncluded = validateCertification(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const hiddenStateValid = validateHiddenState(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(normalizedInput, evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && governanceIncluded
    && evidenceHashesValid
    && hiddenStateValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    packetState: classifyPacketState(
      valid,
      readinessIncluded,
      alignmentIncluded,
      governanceIncluded,
      replayIncluded,
      certificationIncluded,
      boundary.authorityBounded,
    ),
    reasonCodes: normalizeStrings(reasons) as readonly OperatorReviewPacketReasonCode[],
    readinessIncluded,
    alignmentIncluded,
    governanceIncluded,
    replayIncluded,
    certificationIncluded,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    packetReferenceCount: evidencePath.evidenceReferences.length,
  });
}

export function buildOperatorReviewPacketResult(input: OperatorReviewPacketInput): OperatorReviewPacketResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createOperatorReviewPacketEvidencePath(normalizedInput);
  const validation = validateOperatorReviewPacket(normalizedInput);

  const packetHash = hashPacketValue("operator-review-packet", {
    request,
    evidencePath,
    packetState: validation.packetState,
    readinessIncluded: validation.readinessIncluded,
    alignmentIncluded: validation.alignmentIncluded,
    governanceIncluded: validation.governanceIncluded,
    replayIncluded: validation.replayIncluded,
    certificationIncluded: validation.certificationIncluded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    packetState: validation.packetState,
    readinessIncluded: validation.readinessIncluded,
    alignmentIncluded: validation.alignmentIncluded,
    governanceIncluded: validation.governanceIncluded,
    replayIncluded: validation.replayIncluded,
    certificationIncluded: validation.certificationIncluded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    packetHash,
    deterministic: true,
  });
}

export function buildOperatorReviewPacketObservability(result: OperatorReviewPacketResult): OperatorReviewPacketObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    packetState: result.packetState,
    readinessIncluded: result.readinessIncluded,
    alignmentIncluded: result.alignmentIncluded,
    governanceIncluded: result.governanceIncluded,
    replayIncluded: result.replayIncluded,
    certificationIncluded: result.certificationIncluded,
    packetHash: result.packetHash,
  });
}

export function sealOperatorReviewPacket(input: OperatorReviewPacketInput): SealedOperatorReviewPacketRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createOperatorReviewPacketEvidencePath(normalizedInput);
  const validation = validateOperatorReviewPacket(normalizedInput);
  const result = buildOperatorReviewPacketResult(normalizedInput);
  const observability = buildOperatorReviewPacketObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    reviewOnly: true as const,
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

export const OperatorReviewPacketValidator = Object.freeze({
  validate: validateOperatorReviewPacket,
});

export const OperatorReviewPacket = Object.freeze({
  buildRequest: buildOperatorReviewPacketRequest,
  createEvidencePath: createOperatorReviewPacketEvidencePath,
  buildResult: buildOperatorReviewPacketResult,
  seal: sealOperatorReviewPacket,
});

export const OperatorReviewPacketObservabilityService = Object.freeze({
  build: buildOperatorReviewPacketObservability,
});
