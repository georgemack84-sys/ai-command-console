import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationAuditExportEvidencePath,
  RecommendationAuditExportFormat,
  RecommendationAuditExportInput,
  RecommendationAuditExportObservability,
  RecommendationAuditExportReasonCode,
  RecommendationAuditExportRequest,
  RecommendationAuditExportResult,
  RecommendationAuditExportScope,
  RecommendationAuditExportValidation,
  SealedRecommendationAuditExportRecord,
} from "./types";

const MAX_EXPORT_DEPTH = 20;
const MAX_EXPORTED_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const EXPORT_SCOPES: readonly RecommendationAuditExportScope[] = Object.freeze([
  "CERTIFICATION",
  "FULL",
  "INTEGRITY",
  "LINEAGE",
  "REPLAY",
  "SUMMARY",
]);

const EXPORT_FORMATS: readonly RecommendationAuditExportFormat[] = Object.freeze([
  "BUNDLE",
  "JSON",
  "NDJSON",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: RecommendationAuditExportReasonCode[], reason: RecommendationAuditExportReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashExportValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationAuditExportRequest): RecommendationAuditExportRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    exportScope: request.exportScope,
    exportFormat: request.exportFormat,
    graphVersion: request.graphVersion,
  });
}

function collectEvidenceHashes(input: RecommendationAuditExportInput): string[] {
  return normalizeStrings([
    input.observability.result.observabilityHash,
    input.inspection.result.inspectionHash,
    input.visibility.result.visibilityHash,
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

function collectLineage(input: RecommendationAuditExportInput): string[] {
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
  ]);
}

function summaryEvidenceIds(input: RecommendationAuditExportInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    input.ledger.entry.recommendationId,
  ]);
}

function scopeEvidenceIds(scope: RecommendationAuditExportScope, input: RecommendationAuditExportInput): string[] {
  switch (scope) {
    case "SUMMARY":
      return summaryEvidenceIds(input);
    case "LINEAGE":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.lineage.evidencePath.evidenceIds,
        ...input.verification.evidencePath.evidenceIds,
      ]);
    case "REPLAY":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.replay.evidencePath.evidenceIds,
      ]);
    case "INTEGRITY":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.integrity.evidencePath.evidenceIds,
      ]);
    case "CERTIFICATION":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.certification.evidencePath.evidenceIds,
      ]);
    case "FULL":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.inspection.evidencePath.evidenceIds,
        ...input.visibility.evidencePath.evidenceIds,
      ]);
  }
}

function scopeVisibilitySatisfied(input: RecommendationAuditExportInput): boolean {
  const { exportScope } = input.request;
  const permitted = input.visibility.result.permittedScopes.includes(exportScope);
  const inspection = input.inspection.result.visibilityScope;

  if (exportScope === "SUMMARY") return permitted;
  if (exportScope === "LINEAGE") return permitted && inspection.includes("lineage");
  if (exportScope === "REPLAY") return permitted && inspection.includes("replay");
  if (exportScope === "INTEGRITY") return permitted && inspection.includes("integrity");
  if (exportScope === "CERTIFICATION") return permitted && inspection.includes("certification");
  return permitted
    && inspection.includes("summary")
    && inspection.includes("lineage")
    && inspection.includes("replay")
    && inspection.includes("integrity")
    && inspection.includes("certification");
}

function replayIncludedForScope(scope: RecommendationAuditExportScope): boolean {
  return scope === "REPLAY" || scope === "FULL";
}

function lineageIncludedForScope(scope: RecommendationAuditExportScope): boolean {
  return scope === "LINEAGE" || scope === "FULL";
}

function certificationIncludedForScope(scope: RecommendationAuditExportScope): boolean {
  return scope === "CERTIFICATION" || scope === "FULL";
}

function buildArtifactPayload(
  scope: RecommendationAuditExportScope,
  format: RecommendationAuditExportFormat,
  evidenceIds: readonly string[],
  evidenceHashes: readonly string[],
  lineageReferences: readonly string[],
): readonly string[] {
  const manifest = Object.freeze({
    scope,
    format,
    evidenceCount: evidenceIds.length,
    hashCount: evidenceHashes.length,
    lineageCount: lineageReferences.length,
    evidenceIds: [...evidenceIds],
    evidenceHashes: [...evidenceHashes],
    lineageReferences: [...lineageReferences],
  });
  const manifestHash = hashExportValue("recommendation-audit-export-manifest", manifest);

  if (format === "JSON") {
    return Object.freeze([
      `json:${scope.toLowerCase()}:${manifestHash}`,
    ]);
  }

  if (format === "NDJSON") {
    return Object.freeze([
      `ndjson:${scope.toLowerCase()}:manifest:${manifestHash}`,
      ...evidenceIds.map((id) => `ndjson:${scope.toLowerCase()}:evidence:${id}`),
    ]);
  }

  return Object.freeze([
    `bundle:${scope.toLowerCase()}:manifest:${manifestHash}`,
    `bundle:${scope.toLowerCase()}:hashes:${hashExportValue("recommendation-audit-export-hashes", evidenceHashes)}`,
    `bundle:${scope.toLowerCase()}:lineage:${hashExportValue("recommendation-audit-export-lineage", lineageReferences)}`,
  ]);
}

function validateSealedArtifacts(input: RecommendationAuditExportInput, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const states = [
    [input.observability.sealed, "OBSERVABILITY_REQUIRED", "OBSERVABILITY_UNSEALED"],
    [input.inspection.sealed, "INSPECTION_REQUIRED", "INSPECTION_UNSEALED"],
    [input.visibility.sealed, "VISIBILITY_REQUIRED", "VISIBILITY_UNSEALED"],
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

function validateScope(scope: RecommendationAuditExportScope, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const valid = EXPORT_SCOPES.includes(scope);
  addReason(reasons, valid ? "EXPORT_SCOPE_VALID" : "EXPORT_SCOPE_INVALID");
  return valid;
}

function validateFormat(format: RecommendationAuditExportFormat, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const valid = EXPORT_FORMATS.includes(format);
  addReason(reasons, valid ? "EXPORT_FORMAT_VALID" : "EXPORT_FORMAT_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationAuditExportRequest, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const present = request.recommendationId.length > 0;
  addReason(reasons, present ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  return present;
}

function validateTenantScope(input: RecommendationAuditExportInput, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const valid = input.observability.result.tenantIsolationVerified
    && input.inspection.result.tenantIsolationVerified
    && input.visibility.result.tenantIsolationVerified
    && input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_EXPORT_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationAuditExportInput, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const valid = input.ledger.result.ownershipVerified
    && input.verification.result.ownershipVerified
    && input.integrity.result.ownershipIntegrity
    && input.certification.result.ownershipCertified;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateScopeExport(input: RecommendationAuditExportInput, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const valid = scopeVisibilitySatisfied(input);
  if (input.request.exportScope === "SUMMARY" && valid) addReason(reasons, "SCOPE_SUMMARY_EXPORTED");
  if (input.request.exportScope === "LINEAGE" && valid) addReason(reasons, "SCOPE_LINEAGE_EXPORTED");
  if (input.request.exportScope === "REPLAY" && valid) addReason(reasons, "SCOPE_REPLAY_EXPORTED");
  if (input.request.exportScope === "INTEGRITY" && valid) addReason(reasons, "SCOPE_INTEGRITY_EXPORTED");
  if (input.request.exportScope === "CERTIFICATION" && valid) addReason(reasons, "SCOPE_CERTIFICATION_EXPORTED");
  if (input.request.exportScope === "FULL" && valid) addReason(reasons, "SCOPE_FULL_EXPORTED");
  if (!valid) addReason(reasons, "EXPORT_SCOPE_ESCALATED");
  return valid;
}

function validateAvailability(input: RecommendationAuditExportInput, reasons: RecommendationAuditExportReasonCode[]) {
  const replayIncluded = replayIncludedForScope(input.request.exportScope) && input.observability.result.replayVisible && input.inspection.result.replayVisible;
  const lineageIncluded = lineageIncludedForScope(input.request.exportScope) && input.observability.result.lineageVisible && input.inspection.result.lineageVisible;
  const certificationIncluded = certificationIncludedForScope(input.request.exportScope)
    && input.observability.result.certificationVisible
    && input.inspection.result.certificationVisible;

  addReason(reasons, replayIncluded || !replayIncludedForScope(input.request.exportScope) ? "REPLAY_INCLUDED" : "REPLAY_UNAVAILABLE_LIMITED");
  addReason(reasons, lineageIncluded || !lineageIncludedForScope(input.request.exportScope) ? "LINEAGE_INCLUDED" : "LINEAGE_UNAVAILABLE_LIMITED");
  addReason(
    reasons,
    certificationIncluded || !certificationIncludedForScope(input.request.exportScope)
      ? "CERTIFICATION_INCLUDED"
      : "CERTIFICATION_UNAVAILABLE_LIMITED",
  );

  return Object.freeze({
    replayIncluded,
    lineageIncluded,
    certificationIncluded,
  });
}

function validateEvidenceHashes(input: RecommendationAuditExportInput, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationAuditExportInput, reasons: RecommendationAuditExportReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.observability.validation.authorityBounded
    && input.inspection.validation.authorityBounded
    && input.visibility.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded;
  const invalidBoundary = input.exportMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.approvalCreationRequested === true
    || input.repairRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.exportMutationAttempted === true ? "EXPORT_MUTATION_DETECTED" : "EXPORT_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, input.repairRequested === true ? "REPAIR_DETECTED" : "REPAIR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_AUDIT_EXPORT_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: RecommendationAuditExportEvidencePath, reasons: RecommendationAuditExportReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_EXPORT_DEPTH;
  const exportedValid = path.evidenceIds.length <= MAX_EXPORTED_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "EXPORT_DEPTH_VALID" : "EXPORT_DEPTH_EXCEEDED");
  addReason(reasons, exportedValid ? "EXPORTED_REFERENCE_LIMIT_VALID" : "EXPORTED_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && exportedValid && lineageValid;
}

function classifyExportState(
  valid: boolean,
  scopeSatisfied: boolean,
  replayIncluded: boolean,
  lineageIncluded: boolean,
  certificationIncluded: boolean,
  request: RecommendationAuditExportRequest,
): RecommendationAuditExportResult["exportState"] {
  if (!valid) return "INVALID";
  if (!scopeSatisfied) return "ESCALATED";
  if (replayIncludedForScope(request.exportScope) && !replayIncluded) return "LIMITED";
  if (lineageIncludedForScope(request.exportScope) && !lineageIncluded) return "LIMITED";
  if (certificationIncludedForScope(request.exportScope) && !certificationIncluded) return "LIMITED";
  return "EXPORTED";
}

export function buildRecommendationAuditExportRequest(
  input: Omit<RecommendationAuditExportInput, "request"> & {
    recommendationId?: string;
    tenantId?: string;
    exportScope?: RecommendationAuditExportScope;
    exportFormat?: RecommendationAuditExportFormat;
    graphVersion?: string;
  },
): RecommendationAuditExportRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    exportScope: input.exportScope ?? "FULL",
    exportFormat: input.exportFormat ?? "JSON",
    graphVersion: input.graphVersion ?? "decision-graph/v1",
  } as RecommendationAuditExportRequest);
}

export function createRecommendationAuditExportEvidencePath(input: RecommendationAuditExportInput): RecommendationAuditExportEvidencePath {
  const request = requestCore(input.request);
  const evidenceIds = scopeEvidenceIds(request.exportScope, input);
  const evidenceHashes = collectEvidenceHashes(input);
  const lineageReferences = request.exportScope === "SUMMARY"
    ? []
    : collectLineage(input);

  return Object.freeze({
    scope: request.exportScope,
    format: request.exportFormat,
    exportedArtifacts: Object.freeze(buildArtifactPayload(request.exportScope, request.exportFormat, evidenceIds, evidenceHashes, lineageReferences)),
    evidenceIds: Object.freeze(evidenceIds),
    evidenceHashes: Object.freeze(evidenceHashes),
    lineageReferences: Object.freeze(lineageReferences),
  });
}

export function validateRecommendationAuditExport(input: RecommendationAuditExportInput): RecommendationAuditExportValidation {
  const reasons: RecommendationAuditExportReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationAuditExportEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request.exportScope, reasons);
  const formatValid = validateFormat(request.exportFormat, reasons);
  const recommendationValid = validateRecommendation(request, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const scopeSatisfied = validateScopeExport(normalizedInput, reasons);
  const availability = validateAvailability(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && formatValid
    && recommendationValid
    && tenantIsolationVerified
    && ownershipValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    exportState: classifyExportState(
      valid,
      scopeSatisfied,
      availability.replayIncluded,
      availability.lineageIncluded,
      availability.certificationIncluded,
      request,
    ),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationAuditExportReasonCode[],
    exportedArtifacts: Object.freeze([...evidencePath.exportedArtifacts]),
    replayIncluded: availability.replayIncluded,
    lineageIncluded: availability.lineageIncluded,
    certificationIncluded: availability.certificationIncluded,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    exportedReferenceCount: evidencePath.evidenceIds.length,
  });
}

export function buildRecommendationAuditExportResult(input: RecommendationAuditExportInput): RecommendationAuditExportResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationAuditExportEvidencePath(normalizedInput);
  const validation = validateRecommendationAuditExport(normalizedInput);

  const exportHash = hashExportValue("recommendation-audit-export", {
    request,
    evidencePath,
    exportState: validation.exportState,
    replayIncluded: validation.replayIncluded,
    lineageIncluded: validation.lineageIncluded,
    certificationIncluded: validation.certificationIncluded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    exportState: validation.exportState,
    exportedArtifacts: [...validation.exportedArtifacts],
    replayIncluded: validation.replayIncluded,
    lineageIncluded: validation.lineageIncluded,
    certificationIncluded: validation.certificationIncluded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    exportHash,
    deterministic: true,
  });
}

export function buildRecommendationAuditExportObservability(
  result: RecommendationAuditExportResult,
): RecommendationAuditExportObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    exportState: result.exportState,
    exportedArtifacts: Object.freeze([...result.exportedArtifacts]),
    replayIncluded: result.replayIncluded,
    lineageIncluded: result.lineageIncluded,
    certificationIncluded: result.certificationIncluded,
    exportHash: result.exportHash,
  });
}

export function sealRecommendationAuditExport(input: RecommendationAuditExportInput): SealedRecommendationAuditExportRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationAuditExportEvidencePath(normalizedInput);
  const validation = validateRecommendationAuditExport(normalizedInput);
  const result = buildRecommendationAuditExportResult(normalizedInput);
  const observability = buildRecommendationAuditExportObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    exportOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    approvalCreationAllowed: false as const,
    repairAuthorized: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationAuditExportValidator = Object.freeze({
  validate: validateRecommendationAuditExport,
});

export const RecommendationAuditExportLayer = Object.freeze({
  buildRequest: buildRecommendationAuditExportRequest,
  createEvidencePath: createRecommendationAuditExportEvidencePath,
  buildResult: buildRecommendationAuditExportResult,
  seal: sealRecommendationAuditExport,
});

export const RecommendationAuditExportObservabilityService = Object.freeze({
  build: buildRecommendationAuditExportObservability,
});
