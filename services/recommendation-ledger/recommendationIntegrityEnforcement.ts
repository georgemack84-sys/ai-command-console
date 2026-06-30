import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationIntegrityContext,
  RecommendationIntegrityEvidencePath,
  RecommendationIntegrityInput,
  RecommendationIntegrityObservability,
  RecommendationIntegrityReasonCode,
  RecommendationIntegrityRequest,
  RecommendationIntegrityResult,
  RecommendationIntegrityValidation,
  SealedRecommendationIntegrityRecord,
} from "./types";

const MAX_INTEGRITY_DEPTH = 20;
const MAX_HISTORY_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const INTEGRITY_CONTEXTS: readonly RecommendationIntegrityContext[] = Object.freeze([
  "EVIDENCE",
  "FULL",
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

function addReason(reasons: RecommendationIntegrityReasonCode[], reason: RecommendationIntegrityReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashIntegrityValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationIntegrityRequest): RecommendationIntegrityRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    integrityContext: request.integrityContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectHistoryReferences(input: Omit<RecommendationIntegrityInput, "request">): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    ...input.ledger.entry.evidenceIds,
    ...input.lineage.ancestryChain.map((node) => node.lineageReference),
    ...(input.historyReferences ?? []),
  ]);
}

function collectLineage(input: Omit<RecommendationIntegrityInput, "request">): string[] {
  return normalizeStrings([
    ...input.ledger.entry.lineageReferences,
    ...input.lineage.evidencePath.lineageReferences,
    ...input.verification.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.escalation.evidencePath.lineageReferences,
    ...input.graph.contract.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: RecommendationIntegrityInput): string[] {
  return normalizeStrings([
    input.ledger.result.ledgerHash,
    input.ledger.result.evidenceHash,
    input.lineage.result.reconstructionHash,
    input.lineage.result.lineageHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.replay.result.reconstructionHash,
    input.escalation.result.escalationEvidenceHash,
    input.graph.contract.graphHash,
  ]);
}

function collectEvidenceIds(input: RecommendationIntegrityInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    input.graph.contract.graphId,
    ...input.lineage.evidencePath.evidenceIds,
    ...input.verification.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.escalation.evidencePath.evidenceIds,
  ]);
}

function projectEvidenceIds(context: RecommendationIntegrityContext, input: RecommendationIntegrityInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return [input.ledger.entry.ledgerEntryId];
    case "LINEAGE":
      return collectLineage({
        ledger: input.ledger,
        lineage: input.lineage,
        verification: input.verification,
        replay: input.replay,
        escalation: input.escalation,
        graph: input.graph,
        historyReferences: input.historyReferences,
        integrityMutationAttempted: input.integrityMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        recommendationGenerationRequested: input.recommendationGenerationRequested,
        repairRequested: input.repairRequested,
        authorityExpansionDetected: input.authorityExpansionDetected,
      });
    case "REPLAY":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.replay.evidencePath.evidenceIds,
        ...input.verification.evidencePath.evidenceIds,
      ]);
    case "EVIDENCE":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.ledger.entry.evidenceIds,
        ...input.replay.evidencePath.evidenceIds,
      ]);
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function findRecommendationNode(input: RecommendationIntegrityInput) {
  return input.graph.nodes.find((node) => node.nodeId === input.request.recommendationId);
}

function validateSealedArtifacts(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const states = [
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.escalation.sealed, "ESCALATION_REQUIRED", "ESCALATION_UNSEALED"],
    [input.graph.sealed, "GRAPH_REQUIRED", "GRAPH_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: RecommendationIntegrityRequest, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const valid = INTEGRITY_CONTEXTS.includes(request.integrityContext);
  addReason(reasons, valid ? "INTEGRITY_CONTEXT_VALID" : "INTEGRITY_CONTEXT_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationIntegrityRequest, input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const recommendationIdPresent = request.recommendationId.length > 0;
  const node = findRecommendationNode(input);
  const recommendationNodePresent = Boolean(node);
  const recommendationNodeTypeValid = node?.nodeType === "RECOMMENDATION";
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  addReason(reasons, recommendationNodePresent ? "RECOMMENDATION_NODE_PRESENT" : "RECOMMENDATION_NODE_MISSING");
  addReason(reasons, recommendationNodeTypeValid ? "RECOMMENDATION_NODE_TYPE_VALID" : "RECOMMENDATION_NODE_TYPE_INVALID");
  return recommendationIdPresent && recommendationNodePresent && recommendationNodeTypeValid;
}

function validateIdentity(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const graphIdValid = input.ledger.entry.graphId === input.graph.contract.graphId
    && input.lineage.ancestryChain.every((node) => node.graphId === input.graph.contract.graphId)
    && input.escalation.result.graphId === input.graph.contract.graphId;
  const versionValid = input.request.graphVersion === input.graph.contract.graphVersion;
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.escalation.result.tenantIsolationVerified
    && input.graph.validation.tenantScoped
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.ownershipVerified
    && input.verification.result.ownershipVerified
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateHistoryIntegrity(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const historyReferences = collectHistoryReferences({
    ledger: input.ledger,
    lineage: input.lineage,
    verification: input.verification,
    replay: input.replay,
    escalation: input.escalation,
    graph: input.graph,
    historyReferences: input.historyReferences,
    integrityMutationAttempted: input.integrityMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationGenerationRequested: input.recommendationGenerationRequested,
    repairRequested: input.repairRequested,
    authorityExpansionDetected: input.authorityExpansionDetected,
  });
  const explicitHistoryReferences = normalizeStrings(input.historyReferences ?? []);
  const referencesPresent = explicitHistoryReferences.length > 0;
  const valid = referencesPresent
    && input.ledger.entry.evidenceIds.length > 0
    && input.ledger.entry.evidenceHashes.length > 0
    && input.lineage.ancestryChain.length > 0
    && explicitHistoryReferences.every((reference) => historyReferences.includes(reference))
    && input.verification.result.historyIntegrity;
  addReason(reasons, referencesPresent ? "HISTORY_REFERENCES_PRESENT" : "HISTORY_REFERENCES_MISSING");
  addReason(reasons, valid ? "HISTORY_INTEGRITY_VALID" : "HISTORY_CORRUPTION_DETECTED");
  return valid;
}

function validateLineage(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    ledger: input.ledger,
    lineage: input.lineage,
    verification: input.verification,
    replay: input.replay,
    escalation: input.escalation,
    graph: input.graph,
    historyReferences: input.historyReferences,
    integrityMutationAttempted: input.integrityMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationGenerationRequested: input.recommendationGenerationRequested,
    repairRequested: input.repairRequested,
    authorityExpansionDetected: input.authorityExpansionDetected,
  });
  const valid = lineageReferences.length > 0
    && input.ledger.result.lineageIntegrity
    && input.lineage.result.lineageIntegrity
    && input.verification.result.lineageIntegrity
    && input.replay.result.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplayIntegrity(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const valid = input.ledger.result.replayable
    && input.lineage.result.replayable
    && input.verification.result.replayConsistency
    && input.replay.result.replayIntegrity;
  addReason(reasons, valid ? "REPLAY_INTEGRITY_VALID" : "REPLAY_HASH_MISMATCH");
  return valid;
}

function validateEvidenceChain(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const valid = input.ledger.entry.evidenceIds.length > 0
    && input.lineage.evidencePath.evidenceIds.length > 0
    && input.verification.evidencePath.evidenceIds.length > 0
    && input.replay.evidencePath.evidenceIds.length > 0
    && input.escalation.evidencePath.evidenceIds.length > 0;
  addReason(reasons, valid ? "EVIDENCE_CHAIN_VALID" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateEvidenceHashes(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationIntegrityInput, reasons: RecommendationIntegrityReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.ledger.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.escalation.validation.authorityBounded;
  const invalidBoundary = input.integrityMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.repairRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.integrityMutationAttempted === true ? "INTEGRITY_MUTATION_DETECTED" : "INTEGRITY_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.repairRequested === true ? "REPAIR_DETECTED" : "REPAIR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_INTEGRITY_IS_NOT_ENGINE");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: RecommendationIntegrityEvidencePath, historyReferenceCount: number, reasons: RecommendationIntegrityReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_INTEGRITY_DEPTH;
  const historyValid = historyReferenceCount <= MAX_HISTORY_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "INTEGRITY_DEPTH_VALID" : "INTEGRITY_DEPTH_EXCEEDED");
  addReason(reasons, historyValid ? "HISTORY_REFERENCE_LIMIT_VALID" : "HISTORY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && historyValid && lineageValid;
}

function classifyIntegrityState(
  valid: boolean,
  replayIntegrity: boolean,
  degraded: boolean,
  limited: boolean,
): RecommendationIntegrityResult["integrityState"] {
  if (!valid) return "INVALID";
  if (!replayIntegrity || limited) return "LIMITED";
  if (degraded) return "DEGRADED";
  return "HEALTHY";
}

export function buildRecommendationIntegrityRequest(
  input: Omit<RecommendationIntegrityInput, "request"> & {
    integrityContext?: RecommendationIntegrityContext;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
  },
): RecommendationIntegrityRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    integrityContext: input.integrityContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? input.graph.contract.graphVersion,
  } as RecommendationIntegrityRequest);
}

export function createRecommendationIntegrityEvidencePath(input: RecommendationIntegrityInput): RecommendationIntegrityEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.integrityContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.integrityContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.integrityContext === "OWNERSHIP"
        ? request.lineageReferences.slice(0, MAX_INTEGRITY_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateRecommendationIntegrity(input: RecommendationIntegrityInput): RecommendationIntegrityValidation {
  const reasons: RecommendationIntegrityReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationIntegrityEvidencePath(normalizedInput);
  const historyReferenceCount = collectHistoryReferences(normalizedInput).length;

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const recommendationValid = validateRecommendation(request, normalizedInput, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipIntegrity = validateOwnership(normalizedInput, reasons);
  const historyIntegrity = validateHistoryIntegrity(normalizedInput, reasons);
  const lineageIntegrity = validateLineage(normalizedInput, reasons);
  const replayIntegrity = validateReplayIntegrity(normalizedInput, reasons);
  const evidenceChainValid = validateEvidenceChain(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, historyReferenceCount, reasons);

  const degraded = normalizedInput.ledger.result.ledgerState === "LIMITED";
  const limited = normalizedInput.replay.result.replayState === "LIMITED"
    || normalizedInput.verification.result.verificationState === "LIMITED"
    || normalizedInput.lineage.result.reconstructionState === "LIMITED";

  const valid = sealedArtifacts
    && contextValid
    && recommendationValid
    && identityValid
    && tenantIsolationVerified
    && ownershipIntegrity
    && historyIntegrity
    && lineageIntegrity
    && evidenceChainValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    integrityState: classifyIntegrityState(valid, replayIntegrity, degraded, limited),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationIntegrityReasonCode[],
    historyIntegrity,
    lineageIntegrity,
    replayIntegrity,
    ownershipIntegrity,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    historyReferenceCount,
  });
}

export function buildRecommendationIntegrityResult(input: RecommendationIntegrityInput): RecommendationIntegrityResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationIntegrityEvidencePath(normalizedInput);
  const validation = validateRecommendationIntegrity(normalizedInput);

  const integrityHash = hashIntegrityValue("recommendation-integrity-enforcement", {
    request,
    evidencePath,
    integrityState: validation.integrityState,
    historyIntegrity: validation.historyIntegrity,
    lineageIntegrity: validation.lineageIntegrity,
    replayIntegrity: validation.replayIntegrity,
    ownershipIntegrity: validation.ownershipIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    integrityState: validation.integrityState,
    historyIntegrity: validation.historyIntegrity,
    lineageIntegrity: validation.lineageIntegrity,
    replayIntegrity: validation.replayIntegrity,
    ownershipIntegrity: validation.ownershipIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    integrityHash,
    deterministic: true,
  });
}

export function buildRecommendationIntegrityObservability(result: RecommendationIntegrityResult): RecommendationIntegrityObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    integrityState: result.integrityState,
    historyIntegrity: result.historyIntegrity,
    lineageIntegrity: result.lineageIntegrity,
    replayIntegrity: result.replayIntegrity,
    integrityHash: result.integrityHash,
  });
}

export function sealRecommendationIntegrity(input: RecommendationIntegrityInput): SealedRecommendationIntegrityRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationIntegrityEvidencePath(normalizedInput);
  const validation = validateRecommendationIntegrity(normalizedInput);
  const result = buildRecommendationIntegrityResult(normalizedInput);
  const observability = buildRecommendationIntegrityObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    integrityOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    recommendationGenerationAllowed: false as const,
    repairAuthorized: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationIntegrityValidator = Object.freeze({
  validate: validateRecommendationIntegrity,
});

export const RecommendationIntegrityEnforcement = Object.freeze({
  buildRequest: buildRecommendationIntegrityRequest,
  createEvidencePath: createRecommendationIntegrityEvidencePath,
  buildResult: buildRecommendationIntegrityResult,
  seal: sealRecommendationIntegrity,
});

export const RecommendationIntegrityObservabilityService = Object.freeze({
  build: buildRecommendationIntegrityObservability,
});
