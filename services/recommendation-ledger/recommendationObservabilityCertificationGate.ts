import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationObservabilityCertificationEvidencePath,
  RecommendationObservabilityCertificationInput,
  RecommendationObservabilityCertificationObservability,
  RecommendationObservabilityCertificationReasonCode,
  RecommendationObservabilityCertificationRequest,
  RecommendationObservabilityCertificationResult,
  RecommendationObservabilityCertificationScope,
  RecommendationObservabilityCertificationValidation,
  SealedRecommendationObservabilityCertificationRecord,
} from "./types";

const MAX_CERTIFICATION_DEPTH = 20;
const MAX_VISIBLE_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const CERTIFICATION_SCOPES: readonly RecommendationObservabilityCertificationScope[] = Object.freeze([
  "AUDIT",
  "FULL",
  "INSPECTION",
  "REPLAY",
  "VISIBILITY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(
  reasons: RecommendationObservabilityCertificationReasonCode[],
  reason: RecommendationObservabilityCertificationReasonCode,
): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(
  request: RecommendationObservabilityCertificationRequest,
): RecommendationObservabilityCertificationRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    certificationScope: request.certificationScope,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: RecommendationObservabilityCertificationInput): string[] {
  return normalizeStrings([
    input.observability.result.observabilityHash,
    input.inspection.result.inspectionHash,
    input.visibility.result.visibilityHash,
    input.audit.result.exportHash,
    input.ledger.result.ledgerHash,
    input.ledger.result.evidenceHash,
    input.lineage.result.reconstructionHash,
    input.lineage.result.lineageHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.integrity.result.integrityHash,
    input.certification.result.certificationHash,
  ]);
}

function collectLineage(input: RecommendationObservabilityCertificationInput): string[] {
  return normalizeStrings([
    ...input.ledger.entry.lineageReferences,
    ...input.lineage.evidencePath.lineageReferences,
    ...input.verification.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.integrity.evidencePath.lineageReferences,
    ...input.certification.evidencePath.lineageReferences,
    ...input.observability.evidencePath.lineageReferences,
    ...input.inspection.evidencePath.lineageReferences,
    ...input.visibility.evidencePath.lineageReferences,
    ...input.audit.evidencePath.lineageReferences,
  ]);
}

function scopeEvidenceIds(
  scope: RecommendationObservabilityCertificationScope,
  input: RecommendationObservabilityCertificationInput,
): string[] {
  switch (scope) {
    case "VISIBILITY":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.visibility.evidencePath.evidenceIds,
        ...input.observability.evidencePath.evidenceIds,
      ]);
    case "INSPECTION":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.inspection.evidencePath.evidenceIds,
      ]);
    case "AUDIT":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.audit.evidencePath.evidenceIds,
      ]);
    case "REPLAY":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.replay.evidencePath.evidenceIds,
        ...input.audit.evidencePath.evidenceIds,
      ]);
    case "FULL":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.visibility.evidencePath.evidenceIds,
        ...input.inspection.evidencePath.evidenceIds,
        ...input.audit.evidencePath.evidenceIds,
      ]);
  }
}

function validateSealedArtifacts(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const states = [
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
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateScope(
  scope: RecommendationObservabilityCertificationScope,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = CERTIFICATION_SCOPES.includes(scope);
  addReason(reasons, valid ? "CERTIFICATION_SCOPE_VALID" : "CERTIFICATION_SCOPE_INVALID");
  return valid;
}

function validateRecommendation(
  request: RecommendationObservabilityCertificationRequest,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = input.observability.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
    && input.visibility.result.tenantIsolationVerified
    && input.audit.result.tenantIsolationVerified
    && input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_CERTIFICATION_BLOCKED");
  return valid;
}

function validateOwnership(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = input.ledger.result.ownershipVerified
    && input.verification.result.ownershipVerified
    && input.integrity.result.ownershipIntegrity
    && input.certification.result.ownershipCertified;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateVisibilityIntegrity(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = input.observability.result.observabilityState !== "INVALID"
    && input.visibility.result.visibilityState !== "INVALID"
    && input.observability.result.lineageVisible
    && input.visibility.validation.valid;
  addReason(reasons, valid ? "VISIBILITY_CERTIFIED" : "VISIBILITY_INTEGRITY_BROKEN");
  return valid;
}

function validateInspectionIntegrity(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = input.inspection.validation.valid
    && input.inspection.result.inspectionState !== "INVALID";
  addReason(reasons, valid ? "INSPECTION_CERTIFIED" : "INSPECTION_INTEGRITY_BROKEN");
  return valid;
}

function validateOperatorBoundary(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = input.visibility.validation.valid
    && input.visibility.validation.authorityBounded
    && input.visibility.validation.controlSurfaceAbsent
    && input.visibility.result.permittedScopes.every((scope, index, values) => index === 0 || values[index - 1] <= scope);
  addReason(reasons, valid ? "OPERATOR_BOUNDARY_CERTIFIED" : "OPERATOR_VISIBILITY_BOUNDARY_BROKEN");
  return valid;
}

function validateAuditIntegrity(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = input.audit.validation.valid
    && input.audit.result.exportState !== "INVALID"
    && input.audit.result.exportedArtifacts.every((artifact, index, values) => index === 0 || values[index - 1] <= artifact);
  addReason(reasons, valid ? "AUDIT_CERTIFIED" : "AUDIT_INTEGRITY_BROKEN");
  return valid;
}

function validateReplayVisibility(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = input.observability.result.replayVisible
    && input.inspection.result.replayVisible
    && input.audit.result.replayIncluded
    && input.replay.result.replayIntegrity;
  addReason(reasons, valid ? "REPLAY_CERTIFIED" : "REPLAY_VISIBILITY_UNAVAILABLE");
  return valid;
}

function validateEvidenceChain(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = input.observability.evidencePath.evidenceIds.length > 0
    && input.inspection.evidencePath.evidenceIds.length > 0
    && input.visibility.evidencePath.evidenceIds.length > 0
    && input.audit.evidencePath.evidenceIds.length > 0
    && input.ledger.entry.evidenceIds.length > 0
    && input.replay.evidencePath.evidenceIds.length > 0;
  addReason(reasons, valid ? "EVIDENCE_CHAIN_VALID" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateEvidenceHashes(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(
  input: RecommendationObservabilityCertificationInput,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.observability.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.visibility.validation.authorityBounded
    && input.audit.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded;
  const invalidBoundary = input.certificationMutationAttempted === true
    || input.visibilityMutationAttempted === true
    || input.auditMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.approvalCreationRequested === true
    || input.repairRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, input.visibilityMutationAttempted === true ? "VISIBILITY_MUTATION_DETECTED" : "VISIBILITY_MUTATION_BLOCKED");
  addReason(reasons, input.auditMutationAttempted === true ? "AUDIT_MUTATION_DETECTED" : "AUDIT_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.repairRequested === true ? "REPAIR_DETECTED" : "REPAIR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "OBSERVABILITY_CERTIFICATION_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(
  path: RecommendationObservabilityCertificationEvidencePath,
  reasons: RecommendationObservabilityCertificationReasonCode[],
): boolean {
  const depthValid = path.lineageReferences.length <= MAX_CERTIFICATION_DEPTH;
  const visibleValid = path.evidenceIds.length <= MAX_VISIBLE_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "CERTIFICATION_DEPTH_VALID" : "CERTIFICATION_DEPTH_EXCEEDED");
  addReason(reasons, visibleValid ? "VISIBLE_REFERENCE_LIMIT_VALID" : "VISIBLE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && visibleValid && lineageValid;
}

function classifyCertificationState(
  valid: boolean,
  replayCertified: boolean,
): RecommendationObservabilityCertificationResult["certificationState"] {
  if (!valid) return "FAIL";
  if (!replayCertified) return "CONDITIONAL_PASS";
  return "PASS";
}

export function buildRecommendationObservabilityCertificationRequest(
  input: Omit<RecommendationObservabilityCertificationInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    certificationScope?: RecommendationObservabilityCertificationScope;
    graphVersion?: string;
  },
): RecommendationObservabilityCertificationRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    certificationScope: input.certificationScope ?? "FULL",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as RecommendationObservabilityCertificationRequest);
}

export function createRecommendationObservabilityCertificationEvidencePath(
  input: RecommendationObservabilityCertificationInput,
): RecommendationObservabilityCertificationEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.certificationScope,
    evidenceIds: Object.freeze(scopeEvidenceIds(request.certificationScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.certificationScope === "VISIBILITY"
        ? collectLineage(input).slice(0, MAX_CERTIFICATION_DEPTH)
        : collectLineage(input),
    ),
  });
}

export function validateRecommendationObservabilityCertification(
  input: RecommendationObservabilityCertificationInput,
): RecommendationObservabilityCertificationValidation {
  const reasons: RecommendationObservabilityCertificationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationObservabilityCertificationEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.certificationScope, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const visibilityCertified = validateVisibilityIntegrity(normalizedInput, reasons);
  const inspectionCertified = validateInspectionIntegrity(normalizedInput, reasons);
  const operatorBoundaryValid = validateOperatorBoundary(normalizedInput, reasons);
  const auditCertified = validateAuditIntegrity(normalizedInput, reasons);
  const replayCertified = validateReplayVisibility(normalizedInput, reasons);
  const evidenceChainValid = validateEvidenceChain(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && visibilityCertified
    && inspectionCertified
    && operatorBoundaryValid
    && auditCertified
    && evidenceChainValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    certificationState: classifyCertificationState(valid, replayCertified),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationObservabilityCertificationReasonCode[],
    visibilityCertified,
    inspectionCertified,
    auditCertified,
    replayCertified,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    visibleReferenceCount: evidencePath.evidenceIds.length,
  });
}

export function buildRecommendationObservabilityCertificationResult(
  input: RecommendationObservabilityCertificationInput,
): RecommendationObservabilityCertificationResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationObservabilityCertificationEvidencePath(normalizedInput);
  const validation = validateRecommendationObservabilityCertification(normalizedInput);

  const certificationHash = hashCertificationValue("recommendation-observability-certification-gate", {
    request,
    evidencePath,
    certificationState: validation.certificationState,
    visibilityCertified: validation.visibilityCertified,
    inspectionCertified: validation.inspectionCertified,
    auditCertified: validation.auditCertified,
    replayCertified: validation.replayCertified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    certificationState: validation.certificationState,
    visibilityCertified: validation.visibilityCertified,
    inspectionCertified: validation.inspectionCertified,
    auditCertified: validation.auditCertified,
    replayCertified: validation.replayCertified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

export function buildRecommendationObservabilityCertificationObservability(
  result: RecommendationObservabilityCertificationResult,
): RecommendationObservabilityCertificationObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    certificationState: result.certificationState,
    visibilityCertified: result.visibilityCertified,
    inspectionCertified: result.inspectionCertified,
    auditCertified: result.auditCertified,
    replayCertified: result.replayCertified,
    certificationHash: result.certificationHash,
  });
}

export function sealRecommendationObservabilityCertification(
  input: RecommendationObservabilityCertificationInput,
): SealedRecommendationObservabilityCertificationRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationObservabilityCertificationEvidencePath(normalizedInput);
  const validation = validateRecommendationObservabilityCertification(normalizedInput);
  const result = buildRecommendationObservabilityCertificationResult(normalizedInput);
  const observability = buildRecommendationObservabilityCertificationObservability(result);

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
    recommendationGenerationAllowed: false as const,
    approvalCreationAllowed: false as const,
    repairAuthorized: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationObservabilityCertificationValidator = Object.freeze({
  validate: validateRecommendationObservabilityCertification,
});

export const RecommendationObservabilityCertificationGate = Object.freeze({
  buildRequest: buildRecommendationObservabilityCertificationRequest,
  createEvidencePath: createRecommendationObservabilityCertificationEvidencePath,
  buildResult: buildRecommendationObservabilityCertificationResult,
  seal: sealRecommendationObservabilityCertification,
});

export const RecommendationObservabilityCertificationObservabilityService = Object.freeze({
  build: buildRecommendationObservabilityCertificationObservability,
});
