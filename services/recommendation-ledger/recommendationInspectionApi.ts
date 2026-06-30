import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationInspectionEvidencePath,
  RecommendationInspectionInput,
  RecommendationInspectionObservability,
  RecommendationInspectionReasonCode,
  RecommendationInspectionRequest,
  RecommendationInspectionResult,
  RecommendationInspectionScope,
  RecommendationInspectionValidation,
  SealedRecommendationInspectionRecord,
} from "./types";

const SUPPORTED_API_VERSION = "recommendation-inspection/v1";
const MAX_INSPECTION_DEPTH = 20;
const MAX_VISIBLE_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const INSPECTION_SCOPES: readonly RecommendationInspectionScope[] = Object.freeze([
  "CERTIFICATION",
  "FULL",
  "INTEGRITY",
  "LINEAGE",
  "REPLAY",
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

function addReason(reasons: RecommendationInspectionReasonCode[], reason: RecommendationInspectionReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashInspectionValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationInspectionRequest): RecommendationInspectionRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    inspectionScope: request.inspectionScope,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
    apiVersion: request.apiVersion,
  });
}

function collectLineage(input: Omit<RecommendationInspectionInput, "request">): string[] {
  return normalizeStrings([
    ...input.ledger.entry.lineageReferences,
    ...input.lineage.evidencePath.lineageReferences,
    ...input.verification.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.integrity.evidencePath.lineageReferences,
    ...input.certification.evidencePath.lineageReferences,
    ...input.observability.evidencePath.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: RecommendationInspectionInput): string[] {
  return normalizeStrings([
    input.observability.result.observabilityHash,
    input.ledger.result.ledgerHash,
    input.ledger.result.evidenceHash,
    input.lineage.result.reconstructionHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.integrity.result.integrityHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: RecommendationInspectionInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    ...input.lineage.evidencePath.evidenceIds,
    ...input.verification.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.integrity.evidencePath.evidenceIds,
    ...input.certification.evidencePath.evidenceIds,
    ...input.observability.evidencePath.evidenceIds,
  ]);
}

function buildVisibilityScope(input: RecommendationInspectionInput): string[] {
  switch (input.request.inspectionScope) {
    case "SUMMARY":
      return ["summary"];
    case "LINEAGE":
      return ["lineage"];
    case "REPLAY":
      return ["replay"];
    case "INTEGRITY":
      return ["integrity"];
    case "CERTIFICATION":
      return ["certification"];
    case "FULL":
      return ["certification", "integrity", "lineage", "replay", "summary"];
  }
}

function projectEvidenceIds(scope: RecommendationInspectionScope, input: RecommendationInspectionInput): string[] {
  switch (scope) {
    case "SUMMARY":
      return [input.ledger.entry.ledgerEntryId];
    case "LINEAGE":
      return collectLineage(input);
    case "REPLAY":
      return normalizeStrings([input.ledger.entry.ledgerEntryId, ...input.replay.evidencePath.evidenceIds]);
    case "INTEGRITY":
      return normalizeStrings([input.ledger.entry.ledgerEntryId, ...input.integrity.evidencePath.evidenceIds]);
    case "CERTIFICATION":
      return normalizeStrings([input.ledger.entry.ledgerEntryId, ...input.certification.evidencePath.evidenceIds]);
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function findRecommendationNode(input: RecommendationInspectionInput) {
  return input.observability.evidencePath.evidenceIds.length > 0
    ? input.lineage.ancestryChain[0]
    : undefined;
}

function validateSealedArtifacts(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const states = [
    [input.observability.sealed, "OBSERVABILITY_REQUIRED", "OBSERVABILITY_UNSEALED"],
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

function validateScope(request: RecommendationInspectionRequest, reasons: RecommendationInspectionReasonCode[]): boolean {
  const valid = INSPECTION_SCOPES.includes(request.inspectionScope);
  addReason(reasons, valid ? "INSPECTION_SCOPE_VALID" : "INSPECTION_SCOPE_INVALID");
  return valid;
}

function validateApiVersion(request: RecommendationInspectionRequest, reasons: RecommendationInspectionReasonCode[]): boolean {
  const valid = request.apiVersion === SUPPORTED_API_VERSION;
  addReason(reasons, valid ? "API_VERSION_VALID" : "API_VERSION_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationInspectionRequest, input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const recommendationIdPresent = request.recommendationId.length > 0;
  const node = findRecommendationNode(input);
  const recommendationNodePresent = Boolean(node);
  const recommendationNodeTypeValid = recommendationNodePresent;
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  addReason(reasons, recommendationNodePresent ? "RECOMMENDATION_NODE_PRESENT" : "RECOMMENDATION_NODE_MISSING");
  addReason(reasons, recommendationNodeTypeValid ? "RECOMMENDATION_NODE_TYPE_VALID" : "RECOMMENDATION_NODE_TYPE_INVALID");
  return recommendationIdPresent && recommendationNodePresent && recommendationNodeTypeValid;
}

function validateIdentity(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const graphIdValid = input.lineage.ancestryChain.every((node) => node.graphId === input.ledger.entry.graphId);
  const versionValid = input.request.graphVersion === "decision-graph/v1";
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const valid = input.observability.result.tenantIsolationVerified
    && input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ACCESS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const valid = input.verification.result.ownershipVerified
    && input.integrity.result.ownershipIntegrity
    && input.certification.result.ownershipCertified;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(request: RecommendationInspectionRequest, input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(request.lineageReferences);
  const required = collectLineage(input);
  const present = lineageReferences.length > 0;
  const visible = present && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, present ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, visible ? "LINEAGE_VISIBLE" : "LINEAGE_VISIBILITY_ESCALATED");
  return visible;
}

function validateScopeVisibility(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const scope = input.request.inspectionScope;
  const lineageScoped = normalizeStrings(input.request.lineageReferences).length > 0;
  const allowed = scope === "SUMMARY"
    || (scope === "LINEAGE" && lineageScoped && input.observability.result.lineageVisible)
    || (scope === "REPLAY" && lineageScoped && input.observability.result.replayVisible)
    || (scope === "INTEGRITY" && lineageScoped && input.observability.result.integrityVisible)
    || (scope === "CERTIFICATION" && lineageScoped && input.observability.result.certificationVisible)
    || (scope === "FULL" && lineageScoped);
  if (scope === "SUMMARY") addReason(reasons, "SCOPE_SUMMARY_ALLOWED");
  if (scope === "LINEAGE" && allowed) addReason(reasons, "SCOPE_LINEAGE_ALLOWED");
  if (scope === "REPLAY" && allowed) addReason(reasons, "SCOPE_REPLAY_ALLOWED");
  if (scope === "INTEGRITY" && allowed) addReason(reasons, "SCOPE_INTEGRITY_ALLOWED");
  if (scope === "CERTIFICATION" && allowed) addReason(reasons, "SCOPE_CERTIFICATION_ALLOWED");
  if (!allowed) addReason(reasons, "SCOPE_VIOLATION_ESCALATED");
  return allowed;
}

function validateReplayVisibility(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const visible = input.observability.result.replayVisible;
  addReason(reasons, visible ? "REPLAY_VISIBLE" : "REPLAY_VISIBILITY_LIMITED");
  return visible;
}

function validateIntegrityVisibility(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const visible = input.observability.result.integrityVisible;
  addReason(reasons, visible ? "INTEGRITY_VISIBLE" : "INTEGRITY_VISIBILITY_LIMITED");
  return visible;
}

function validateCertificationVisibility(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const visible = input.observability.result.certificationVisible;
  addReason(reasons, visible ? "CERTIFICATION_VISIBLE" : "CERTIFICATION_VISIBILITY_LIMITED");
  return visible;
}

function validateEvidenceHashes(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationInspectionInput, reasons: RecommendationInspectionReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.writeRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.observability.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded;
  const invalidBoundary = input.inspectionMutationAttempted === true
    || input.executionRequested === true
    || input.writeRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.inspectionMutationAttempted === true ? "INSPECTION_MUTATION_DETECTED" : "INSPECTION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.writeRequested === true ? "WRITE_BEHAVIOR_DETECTED" : "WRITE_BEHAVIOR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_INSPECTION_IS_NOT_CONTROL");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: RecommendationInspectionEvidencePath, reasons: RecommendationInspectionReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_INSPECTION_DEPTH;
  const visibleValid = path.evidenceIds.length <= MAX_VISIBLE_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "INSPECTION_DEPTH_VALID" : "INSPECTION_DEPTH_EXCEEDED");
  addReason(reasons, visibleValid ? "VISIBLE_REFERENCE_LIMIT_VALID" : "VISIBLE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && visibleValid && lineageValid;
}

function classifyInspectionState(
  valid: boolean,
  scopeVisible: boolean,
  lineageVisible: boolean,
  replayVisible: boolean,
): RecommendationInspectionResult["inspectionState"] {
  if (!valid) return "INVALID";
  if (!scopeVisible || !lineageVisible) return "ESCALATED";
  if (!replayVisible) return "LIMITED";
  return "AVAILABLE";
}

export function buildRecommendationInspectionRequest(
  input: Omit<RecommendationInspectionInput, "request"> & {
    inspectionScope?: RecommendationInspectionScope;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
    apiVersion?: string;
  },
): RecommendationInspectionRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    inspectionScope: input.inspectionScope ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? "decision-graph/v1",
    apiVersion: input.apiVersion ?? SUPPORTED_API_VERSION,
  } as RecommendationInspectionRequest);
}

export function createRecommendationInspectionEvidencePath(input: RecommendationInspectionInput): RecommendationInspectionEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.inspectionScope,
    visibilityScope: Object.freeze(buildVisibilityScope(input)),
    evidenceIds: Object.freeze(projectEvidenceIds(request.inspectionScope, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.inspectionScope === "SUMMARY"
        ? request.lineageReferences.slice(0, MAX_INSPECTION_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateRecommendationInspection(input: RecommendationInspectionInput): RecommendationInspectionValidation {
  const reasons: RecommendationInspectionReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationInspectionEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request, reasons);
  const apiVersionValid = validateApiVersion(request, reasons);
  const recommendationValid = validateRecommendation(request, normalizedInput, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageVisible = validateLineage(request, normalizedInput, reasons);
  const scopeVisible = validateScopeVisibility(normalizedInput, reasons);
  const replayVisible = validateReplayVisibility(normalizedInput, reasons);
  const integrityVisible = validateIntegrityVisibility(normalizedInput, reasons);
  const certificationVisible = validateCertificationVisibility(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && scopeValid
    && apiVersionValid
    && recommendationValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    inspectionState: classifyInspectionState(valid, scopeVisible, lineageVisible, replayVisible),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationInspectionReasonCode[],
    visibilityScope: Object.freeze(evidencePath.visibilityScope),
    replayVisible,
    lineageVisible,
    integrityVisible,
    certificationVisible,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    visibleReferenceCount: evidencePath.evidenceIds.length,
  });
}

export function buildRecommendationInspectionResult(input: RecommendationInspectionInput): RecommendationInspectionResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationInspectionEvidencePath(normalizedInput);
  const validation = validateRecommendationInspection(normalizedInput);

  const inspectionHash = hashInspectionValue("recommendation-inspection-api", {
    request,
    evidencePath,
    inspectionState: validation.inspectionState,
    visibilityScope: validation.visibilityScope,
    replayVisible: validation.replayVisible,
    lineageVisible: validation.lineageVisible,
    integrityVisible: validation.integrityVisible,
    certificationVisible: validation.certificationVisible,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    inspectionState: validation.inspectionState,
    visibilityScope: [...validation.visibilityScope],
    replayVisible: validation.replayVisible,
    lineageVisible: validation.lineageVisible,
    integrityVisible: validation.integrityVisible,
    certificationVisible: validation.certificationVisible,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    inspectionHash,
    deterministic: true,
  });
}

export function buildRecommendationInspectionObservability(result: RecommendationInspectionResult): RecommendationInspectionObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    inspectionState: result.inspectionState,
    visibilityScope: Object.freeze([...result.visibilityScope]),
    replayVisible: result.replayVisible,
    lineageVisible: result.lineageVisible,
    integrityVisible: result.integrityVisible,
    certificationVisible: result.certificationVisible,
    inspectionHash: result.inspectionHash,
  });
}

export function sealRecommendationInspection(input: RecommendationInspectionInput): SealedRecommendationInspectionRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationInspectionEvidencePath(normalizedInput);
  const validation = validateRecommendationInspection(normalizedInput);
  const result = buildRecommendationInspectionResult(normalizedInput);
  const observability = buildRecommendationInspectionObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    inspectionOnly: true as const,
    executionAuthorized: false as const,
    writeAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationInspectionValidator = Object.freeze({
  validate: validateRecommendationInspection,
});

export const RecommendationInspectionApi = Object.freeze({
  buildRequest: buildRecommendationInspectionRequest,
  createEvidencePath: createRecommendationInspectionEvidencePath,
  buildResult: buildRecommendationInspectionResult,
  seal: sealRecommendationInspection,
});

export const RecommendationInspectionObservabilityService = Object.freeze({
  build: buildRecommendationInspectionObservability,
});
