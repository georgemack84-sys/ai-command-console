import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationObservabilityContext,
  RecommendationObservabilityEvidencePath,
  RecommendationObservabilityInput,
  RecommendationObservabilityObservability,
  RecommendationObservabilityReasonCode,
  RecommendationObservabilityRequest,
  RecommendationObservabilityResult,
  RecommendationObservabilityValidation,
  SealedRecommendationObservabilityRecord,
} from "./types";

const MAX_OBSERVABILITY_DEPTH = 20;
const MAX_VISIBLE_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const OBSERVABILITY_CONTEXTS: readonly RecommendationObservabilityContext[] = Object.freeze([
  "CERTIFICATION",
  "FULL",
  "INTEGRITY",
  "LINEAGE",
  "OWNERSHIP",
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

function addReason(reasons: RecommendationObservabilityReasonCode[], reason: RecommendationObservabilityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashObservabilityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationObservabilityRequest): RecommendationObservabilityRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    observabilityContext: request.observabilityContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<RecommendationObservabilityInput, "request">): string[] {
  return normalizeStrings([
    ...input.ledger.entry.lineageReferences,
    ...input.lineage.evidencePath.lineageReferences,
    ...input.verification.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.integrity.evidencePath.lineageReferences,
    ...input.certification.evidencePath.lineageReferences,
    ...input.escalation.evidencePath.lineageReferences,
    ...input.graph.contract.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: RecommendationObservabilityInput): string[] {
  return normalizeStrings([
    input.ledger.result.ledgerHash,
    input.ledger.result.evidenceHash,
    input.lineage.result.reconstructionHash,
    input.lineage.result.lineageHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.integrity.result.integrityHash,
    input.certification.result.certificationHash,
    input.escalation.result.escalationEvidenceHash,
    input.graph.contract.graphHash,
  ]);
}

function collectEvidenceIds(input: RecommendationObservabilityInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    input.graph.contract.graphId,
    ...input.lineage.evidencePath.evidenceIds,
    ...input.verification.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.integrity.evidencePath.evidenceIds,
    ...input.certification.evidencePath.evidenceIds,
    ...input.escalation.evidencePath.evidenceIds,
  ]);
}

function projectEvidenceIds(context: RecommendationObservabilityContext, input: RecommendationObservabilityInput): string[] {
  switch (context) {
    case "OWNERSHIP":
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

function findRecommendationNode(input: RecommendationObservabilityInput) {
  return input.graph.nodes.find((node) => node.nodeId === input.request.recommendationId);
}

function validateSealedArtifacts(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const states = [
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.integrity.sealed, "INTEGRITY_REQUIRED", "INTEGRITY_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
    [input.escalation.sealed, "ESCALATION_REQUIRED", "ESCALATION_UNSEALED"],
    [input.graph.sealed, "GRAPH_REQUIRED", "GRAPH_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: RecommendationObservabilityRequest, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const valid = OBSERVABILITY_CONTEXTS.includes(request.observabilityContext);
  addReason(reasons, valid ? "OBSERVABILITY_CONTEXT_VALID" : "OBSERVABILITY_CONTEXT_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationObservabilityRequest, input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const recommendationIdPresent = request.recommendationId.length > 0;
  const node = findRecommendationNode(input);
  const recommendationNodePresent = Boolean(node);
  const recommendationNodeTypeValid = node?.nodeType === "RECOMMENDATION";
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  addReason(reasons, recommendationNodePresent ? "RECOMMENDATION_NODE_PRESENT" : "RECOMMENDATION_NODE_MISSING");
  addReason(reasons, recommendationNodeTypeValid ? "RECOMMENDATION_NODE_TYPE_VALID" : "RECOMMENDATION_NODE_TYPE_INVALID");
  return recommendationIdPresent && recommendationNodePresent && recommendationNodeTypeValid;
}

function validateIdentity(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const graphIdValid = input.ledger.entry.graphId === input.graph.contract.graphId
    && input.lineage.ancestryChain.every((node) => node.graphId === input.graph.contract.graphId)
    && input.escalation.result.graphId === input.graph.contract.graphId;
  const versionValid = input.request.graphVersion === input.graph.contract.graphVersion;
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && input.escalation.result.tenantIsolationVerified
    && input.graph.validation.tenantScoped
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.ownershipVerified
    && input.verification.result.ownershipVerified
    && input.integrity.result.ownershipIntegrity
    && input.certification.result.ownershipCertified
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineageVisibility(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage(input);
  const visible = lineageReferences.length > 0 && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, visible ? "LINEAGE_VISIBLE" : "LINEAGE_VISIBILITY_ESCALATED");
  return visible;
}

function validateReplayVisibility(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const visible = input.replay.result.replayState === "REPLAYABLE" && input.replay.result.replayIntegrity;
  addReason(reasons, visible ? "REPLAY_VISIBLE" : "REPLAY_VISIBILITY_LIMITED");
  return visible;
}

function validateIntegrityVisibility(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const visible = input.integrity.result.integrityState === "HEALTHY" || input.integrity.result.integrityState === "DEGRADED";
  addReason(reasons, visible ? "INTEGRITY_VISIBLE" : "INTEGRITY_VISIBILITY_LIMITED");
  return visible;
}

function validateCertificationVisibility(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const visible = input.certification.result.certificationState === "PASS" || input.certification.result.certificationState === "CONDITIONAL_PASS";
  addReason(reasons, visible ? "CERTIFICATION_VISIBLE" : "CERTIFICATION_VISIBILITY_LIMITED");
  return visible;
}

function validateHistoryVisibility(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const visible = input.verification.result.historyIntegrity && input.integrity.result.historyIntegrity;
  addReason(reasons, visible ? "HISTORY_VISIBLE" : "HISTORY_VISIBILITY_LIMITED");
  return visible;
}

function validateEvidenceHashes(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationObservabilityInput, reasons: RecommendationObservabilityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.ledger.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.certification.validation.authorityBounded
    && input.escalation.validation.authorityBounded;
  const invalidBoundary = input.observabilityMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.approvalCreationRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.observabilityMutationAttempted === true ? "OBSERVABILITY_MUTATION_DETECTED" : "OBSERVABILITY_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.approvalCreationRequested === true ? "APPROVAL_CREATION_DETECTED" : "APPROVAL_CREATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_OBSERVABILITY_IS_NOT_ENGINE");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: RecommendationObservabilityEvidencePath, visibleReferenceCount: number, reasons: RecommendationObservabilityReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_OBSERVABILITY_DEPTH;
  const visibleValid = visibleReferenceCount <= MAX_VISIBLE_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "OBSERVABILITY_DEPTH_VALID" : "OBSERVABILITY_DEPTH_EXCEEDED");
  addReason(reasons, visibleValid ? "VISIBLE_REFERENCE_LIMIT_VALID" : "VISIBLE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && visibleValid && lineageValid;
}

function classifyObservabilityState(
  valid: boolean,
  lineageVisible: boolean,
  replayVisible: boolean,
  integrityVisible: boolean,
  certificationVisible: boolean,
): RecommendationObservabilityResult["observabilityState"] {
  if (!valid) return "INVALID";
  if (!lineageVisible) return "ESCALATED";
  if (!replayVisible || !integrityVisible || !certificationVisible) return "LIMITED";
  return "VISIBLE";
}

export function buildRecommendationObservabilityRequest(
  input: Omit<RecommendationObservabilityInput, "request"> & {
    observabilityContext?: RecommendationObservabilityContext;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
  },
): RecommendationObservabilityRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    observabilityContext: input.observabilityContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? input.graph.contract.graphVersion,
  } as RecommendationObservabilityRequest);
}

export function createRecommendationObservabilityEvidencePath(input: RecommendationObservabilityInput): RecommendationObservabilityEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.observabilityContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.observabilityContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.observabilityContext === "OWNERSHIP"
        ? request.lineageReferences.slice(0, MAX_OBSERVABILITY_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateRecommendationObservability(input: RecommendationObservabilityInput): RecommendationObservabilityValidation {
  const reasons: RecommendationObservabilityReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationObservabilityEvidencePath(normalizedInput);
  const visibleReferenceCount = evidencePath.evidenceIds.length;

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const recommendationValid = validateRecommendation(request, normalizedInput, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageVisible = validateLineageVisibility(normalizedInput, reasons);
  const replayVisible = validateReplayVisibility(normalizedInput, reasons);
  const integrityVisible = validateIntegrityVisibility(normalizedInput, reasons);
  const certificationVisible = validateCertificationVisibility(normalizedInput, reasons);
  const historyVisible = validateHistoryVisibility(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, visibleReferenceCount, reasons);

  const valid = sealedArtifacts
    && contextValid
    && recommendationValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    observabilityState: classifyObservabilityState(valid, lineageVisible, replayVisible, integrityVisible, certificationVisible),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationObservabilityReasonCode[],
    historyVisible,
    lineageVisible,
    replayVisible,
    integrityVisible,
    certificationVisible,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    visibleReferenceCount,
  });
}

export function buildRecommendationObservabilityResult(input: RecommendationObservabilityInput): RecommendationObservabilityResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationObservabilityEvidencePath(normalizedInput);
  const validation = validateRecommendationObservability(normalizedInput);

  const observabilityHash = hashObservabilityValue("recommendation-observability-layer", {
    request,
    evidencePath,
    observabilityState: validation.observabilityState,
    historyVisible: validation.historyVisible,
    lineageVisible: validation.lineageVisible,
    replayVisible: validation.replayVisible,
    integrityVisible: validation.integrityVisible,
    certificationVisible: validation.certificationVisible,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    observabilityState: validation.observabilityState,
    historyVisible: validation.historyVisible,
    lineageVisible: validation.lineageVisible,
    replayVisible: validation.replayVisible,
    integrityVisible: validation.integrityVisible,
    certificationVisible: validation.certificationVisible,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    observabilityHash,
    deterministic: true,
  });
}

export function buildRecommendationObservabilityObservability(
  result: RecommendationObservabilityResult,
): RecommendationObservabilityObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    observabilityState: result.observabilityState,
    historyVisible: result.historyVisible,
    lineageVisible: result.lineageVisible,
    replayVisible: result.replayVisible,
    integrityVisible: result.integrityVisible,
    certificationVisible: result.certificationVisible,
    observabilityHash: result.observabilityHash,
  });
}

export function sealRecommendationObservability(input: RecommendationObservabilityInput): SealedRecommendationObservabilityRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationObservabilityEvidencePath(normalizedInput);
  const validation = validateRecommendationObservability(normalizedInput);
  const result = buildRecommendationObservabilityResult(normalizedInput);
  const observability = buildRecommendationObservabilityObservability(result);

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
    approvalCreationAllowed: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationObservabilityValidator = Object.freeze({
  validate: validateRecommendationObservability,
});

export const RecommendationObservabilityLayer = Object.freeze({
  buildRequest: buildRecommendationObservabilityRequest,
  createEvidencePath: createRecommendationObservabilityEvidencePath,
  buildResult: buildRecommendationObservabilityResult,
  seal: sealRecommendationObservability,
});

export const RecommendationObservabilityService = Object.freeze({
  build: buildRecommendationObservabilityObservability,
});
