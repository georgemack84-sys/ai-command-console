import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationLedgerContext,
  RecommendationLedgerEntry,
  RecommendationLedgerEvidencePath,
  RecommendationLedgerInput,
  RecommendationLedgerObservability,
  RecommendationLedgerReasonCode,
  RecommendationLedgerRequest,
  RecommendationLedgerResult,
  RecommendationLedgerValidation,
  SealedRecommendationLedgerRecord,
} from "./types";

export const MAX_LEDGER_DEPTH = 20;
export const MAX_LEDGER_REFERENCES = 5000;
export const MAX_LINEAGE_REFERENCES = 1000;

const RECOMMENDATION_CONTEXTS: readonly RecommendationLedgerContext[] = Object.freeze([
  "ESCALATION",
  "FULL",
  "GRAPH",
  "LINEAGE",
  "OWNERSHIP",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: RecommendationLedgerReasonCode[], reason: RecommendationLedgerReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashLedgerValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationLedgerRequest): RecommendationLedgerRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    recommendationContext: request.recommendationContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<RecommendationLedgerInput, "request">): string[] {
  return normalizeStrings([
    ...input.graph.contract.lineageReferences,
    ...input.intelligence.evidencePath.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: RecommendationLedgerInput): string[] {
  return normalizeStrings([
    input.graph.contract.graphHash,
    input.intelligence.result.escalationEvidenceHash,
    input.verification.result.verificationHash,
    input.certification.result.certificationHash,
    input.escalationCertification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: RecommendationLedgerInput): string[] {
  return normalizeStrings([
    input.graph.contract.graphId,
    ...input.intelligence.evidencePath.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function projectEvidenceIds(context: RecommendationLedgerContext, input: RecommendationLedgerInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return [input.graph.contract.graphId];
    case "LINEAGE":
      return collectLineage({
        graph: input.graph,
        intelligence: input.intelligence,
        verification: input.verification,
        certification: input.certification,
        escalationCertification: input.escalationCertification,
        existingEntries: input.existingEntries,
        ledgerMutationAttempted: input.ledgerMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        recommendationGenerationRequested: input.recommendationGenerationRequested,
        prioritizationRequested: input.prioritizationRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
      });
    case "GRAPH":
      return normalizeStrings([
        input.graph.contract.graphId,
        ...input.certification.evidenceChain.evidenceIds,
      ]);
    case "ESCALATION":
      return normalizeStrings([
        ...input.intelligence.evidencePath.evidenceIds,
        input.escalationCertification.result.graphId,
      ]);
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function findRecommendationNode(input: RecommendationLedgerInput) {
  return input.graph.nodes.find((node) => node.nodeId === input.request.recommendationId);
}

function validateSealedArtifacts(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const states = [
    [input.graph.sealed, "GRAPH_REQUIRED", "GRAPH_UNSEALED"],
    [input.intelligence.sealed, "INTELLIGENCE_REQUIRED", "INTELLIGENCE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
    [input.escalationCertification.sealed, "ESCALATION_CERTIFICATION_REQUIRED", "ESCALATION_CERTIFICATION_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: RecommendationLedgerRequest, reasons: RecommendationLedgerReasonCode[]): boolean {
  const valid = RECOMMENDATION_CONTEXTS.includes(request.recommendationContext);
  addReason(reasons, valid ? "RECOMMENDATION_CONTEXT_VALID" : "RECOMMENDATION_CONTEXT_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationLedgerRequest, input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const recommendationIdPresent = request.recommendationId.length > 0;
  const node = findRecommendationNode(input);
  const recommendationNodePresent = Boolean(node);
  const recommendationNodeTypeValid = node?.nodeType === "RECOMMENDATION";
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  addReason(reasons, recommendationNodePresent ? "RECOMMENDATION_NODE_PRESENT" : "RECOMMENDATION_NODE_MISSING");
  addReason(reasons, recommendationNodeTypeValid ? "RECOMMENDATION_NODE_TYPE_VALID" : "RECOMMENDATION_NODE_TYPE_INVALID");
  return recommendationIdPresent && recommendationNodePresent && recommendationNodeTypeValid;
}

function validateIdentity(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const graphIdValid = input.graph.contract.graphId === input.intelligence.result.graphId
    && input.verification.result.graphId === input.graph.contract.graphId
    && input.certification.result.graphId === input.graph.contract.graphId
    && input.escalationCertification.result.graphId === input.graph.contract.graphId;
  const versionValid = input.request.graphVersion === input.graph.contract.graphVersion;
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.graph.validation.tenantScoped
    && input.intelligence.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && input.escalationCertification.result.tenantIsolationVerified
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.certification.result.ownershipCertified
    && input.verification.result.ownershipIntegrity
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const required = collectLineage({
    graph: input.graph,
    intelligence: input.intelligence,
    verification: input.verification,
    certification: input.certification,
    escalationCertification: input.escalationCertification,
    existingEntries: input.existingEntries,
    ledgerMutationAttempted: input.ledgerMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationGenerationRequested: input.recommendationGenerationRequested,
    prioritizationRequested: input.prioritizationRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const valid = lineageReferences.length > 0
    && input.graph.validation.lineagePreserved
    && input.verification.result.lineageIntegrity
    && input.certification.result.lineageCertified
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateEvidence(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const valid = input.intelligence.evidencePath.evidenceIds.length > 0
    && input.verification.verificationPath.artifactIds.length > 0
    && input.certification.evidenceChain.evidenceIds.length > 0;
  addReason(reasons, valid ? "EVIDENCE_CHAIN_VALID" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateReplayable(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const replayable = input.verification.result.deterministicReplayVerified
    && input.certification.result.replayDeterministic
    && input.escalationCertification.result.replayCertified;
  addReason(reasons, replayable ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  return replayable;
}

function validateEvidenceHashes(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateAppendOnly(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): boolean {
  const existingEntries = input.existingEntries ?? [];
  const valid = existingEntries.every((entry, index) => entry.recordOrder === index + 1);
  addReason(reasons, valid ? "APPEND_ONLY_VALID" : "APPEND_ONLY_VIOLATION");
  return valid;
}

function validateBoundary(input: RecommendationLedgerInput, reasons: RecommendationLedgerReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.graph.validation.authorityBounded
    && input.intelligence.validation.authorityBounded
    && input.certification.result.authorityBounded
    && input.escalationCertification.result.authorityBounded;
  const invalidBoundary = input.ledgerMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.prioritizationRequested === true
    || input.authorityExpansionRequested === true;
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_BLOCKED");
  addReason(reasons, input.ledgerMutationAttempted === true ? "LEDGER_MUTATION_DETECTED" : "LEDGER_MUTATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_LEDGER_IS_NOT_ENGINE");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: RecommendationLedgerEvidencePath, reasons: RecommendationLedgerReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_LEDGER_DEPTH;
  const referenceValid = path.evidenceIds.length <= MAX_LEDGER_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "LEDGER_DEPTH_VALID" : "LEDGER_DEPTH_EXCEEDED");
  addReason(reasons, referenceValid ? "LEDGER_REFERENCE_LIMIT_VALID" : "LEDGER_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && referenceValid && lineageValid;
}

function classifyLedgerState(
  valid: boolean,
  replayable: boolean,
): RecommendationLedgerResult["ledgerState"] {
  if (!valid) return "INVALID";
  if (!replayable) return "LIMITED";
  return "RECORDED";
}

export function buildRecommendationLedgerRequest(
  input: Omit<RecommendationLedgerInput, "request"> & {
    recommendationContext?: RecommendationLedgerContext;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
  },
): RecommendationLedgerRequest {
  const recommendationNode = input.graph.nodes.find((node) => node.nodeType === "RECOMMENDATION");
  return Object.freeze({
    recommendationId: input.recommendationId ?? recommendationNode?.nodeId ?? "",
    tenantId: input.tenantId ?? input.graph.contract.tenantId,
    recommendationContext: input.recommendationContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? input.graph.contract.graphVersion,
  } as RecommendationLedgerRequest);
}

export function createRecommendationLedgerEvidencePath(input: RecommendationLedgerInput): RecommendationLedgerEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.recommendationContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.recommendationContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.recommendationContext === "OWNERSHIP"
        ? request.lineageReferences.slice(0, MAX_LEDGER_DEPTH)
        : request.lineageReferences,
    ),
  });
}

function buildLedgerEntry(
  input: RecommendationLedgerInput,
  evidencePath: RecommendationLedgerEvidencePath,
): RecommendationLedgerEntry {
  const existingEntries = input.existingEntries ?? [];
  const recordOrder = existingEntries.length + 1;
  const immutableHash = hashLedgerValue("recommendation-ledger-entry", {
    recommendationId: input.request.recommendationId,
    graphId: input.graph.contract.graphId,
    tenantId: input.request.tenantId,
    lineageReferences: evidencePath.lineageReferences,
    evidenceIds: evidencePath.evidenceIds,
    evidenceHashes: evidencePath.evidenceHashes,
    recordOrder,
  });
  return Object.freeze({
    ledgerEntryId: `ledger:${input.request.recommendationId}:${String(recordOrder).padStart(4, "0")}`,
    recommendationId: input.request.recommendationId,
    graphId: input.graph.contract.graphId,
    tenantId: input.request.tenantId,
    lineageReferences: evidencePath.lineageReferences,
    evidenceIds: evidencePath.evidenceIds,
    evidenceHashes: evidencePath.evidenceHashes,
    immutableHash,
    recordOrder,
  });
}

export function validateRecommendationLedger(input: RecommendationLedgerInput): RecommendationLedgerValidation {
  const reasons: RecommendationLedgerReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationLedgerEvidencePath(normalizedInput);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const recommendationValid = validateRecommendation(request, normalizedInput, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipVerified = validateOwnership(normalizedInput, reasons);
  const lineageIntegrity = validateLineage(normalizedInput, reasons);
  const evidenceValid = validateEvidence(normalizedInput, reasons);
  const replayable = validateReplayable(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const appendOnlyValid = validateAppendOnly(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, reasons);

  const valid = sealedArtifacts
    && contextValid
    && recommendationValid
    && identityValid
    && tenantIsolationVerified
    && ownershipVerified
    && lineageIntegrity
    && evidenceValid
    && evidenceHashesValid
    && appendOnlyValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    ledgerState: classifyLedgerState(valid, replayable),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationLedgerReasonCode[],
    ownershipVerified,
    lineageIntegrity,
    replayable,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    ledgerReferenceCount: evidencePath.evidenceIds.length,
  });
}

export function buildRecommendationLedgerResult(input: RecommendationLedgerInput): RecommendationLedgerResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const validation = validateRecommendationLedger(normalizedInput);
  const evidencePath = createRecommendationLedgerEvidencePath(normalizedInput);
  const entry = buildLedgerEntry(normalizedInput, evidencePath);

  const evidenceHash = hashLedgerValue("recommendation-ledger-evidence", {
    request,
    evidencePath,
    entryHash: entry.immutableHash,
  });
  const ledgerHash = hashLedgerValue("recommendation-ledger-result", {
    recommendationId: request.recommendationId,
    ledgerState: validation.ledgerState,
    ownershipVerified: validation.ownershipVerified,
    lineageIntegrity: validation.lineageIntegrity,
    replayable: validation.replayable,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    evidenceHash,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    ledgerState: validation.ledgerState,
    ownershipVerified: validation.ownershipVerified,
    lineageIntegrity: validation.lineageIntegrity,
    replayable: validation.replayable,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    ledgerHash,
    evidenceHash,
    deterministic: true,
  });
}

export function buildRecommendationLedgerObservability(
  result: RecommendationLedgerResult,
): RecommendationLedgerObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    ledgerState: result.ledgerState,
    ownershipVerified: result.ownershipVerified,
    lineageIntegrity: result.lineageIntegrity,
    ledgerHash: result.ledgerHash,
    evidenceHash: result.evidenceHash,
  });
}

export function sealRecommendationLedger(input: RecommendationLedgerInput): SealedRecommendationLedgerRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationLedgerEvidencePath(normalizedInput);
  const entry = buildLedgerEntry(normalizedInput, evidencePath);
  const validation = validateRecommendationLedger(normalizedInput);
  const result = buildRecommendationLedgerResult(normalizedInput);
  const observability = buildRecommendationLedgerObservability(result);

  return Object.freeze({
    result,
    entry,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    ledgerOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    recommendationGenerationAllowed: false as const,
    prioritizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    ledgerMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationLedgerValidator = Object.freeze({
  validate: validateRecommendationLedger,
});

export const RecommendationLedgerFoundation = Object.freeze({
  buildRequest: buildRecommendationLedgerRequest,
  createEvidencePath: createRecommendationLedgerEvidencePath,
  buildResult: buildRecommendationLedgerResult,
  seal: sealRecommendationLedger,
});

export const RecommendationLedgerObservabilityService = Object.freeze({
  build: buildRecommendationLedgerObservability,
});
