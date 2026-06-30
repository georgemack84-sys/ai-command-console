import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationReplayContext,
  RecommendationReplayEvidencePath,
  RecommendationReplayInput,
  RecommendationReplayObservability,
  RecommendationReplayReasonCode,
  RecommendationReplayRequest,
  RecommendationReplayResult,
  RecommendationReplayValidation,
  SealedRecommendationReplayRecord,
} from "./types";

const MAX_REPLAY_DEPTH = 20;
const MAX_REPLAY_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const REPLAY_CONTEXTS: readonly RecommendationReplayContext[] = Object.freeze([
  "FULL",
  "LEDGER",
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

function addReason(reasons: RecommendationReplayReasonCode[], reason: RecommendationReplayReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashReplayValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationReplayRequest): RecommendationReplayRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    replayContext: request.replayContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<RecommendationReplayInput, "request">): string[] {
  return normalizeStrings([
    ...input.ledger.entry.lineageReferences,
    ...input.lineage.evidencePath.lineageReferences,
    ...input.escalation.evidencePath.lineageReferences,
    ...input.graph.contract.lineageReferences,
    ...input.verification.evidencePath.lineageReferences,
  ]);
}

function collectReplayReferences(input: Omit<RecommendationReplayInput, "request">): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    ...input.ledger.entry.evidenceIds,
    ...input.lineage.evidencePath.evidenceIds,
    ...input.verification.evidencePath.evidenceIds,
    ...(input.replayReferences ?? []),
  ]);
}

function collectEvidenceHashes(input: RecommendationReplayInput): string[] {
  return normalizeStrings([
    input.ledger.result.ledgerHash,
    input.ledger.result.evidenceHash,
    input.lineage.result.reconstructionHash,
    input.lineage.result.lineageHash,
    input.verification.result.verificationHash,
    input.escalation.result.escalationEvidenceHash,
    input.graph.contract.graphHash,
  ]);
}

function collectEvidenceIds(input: RecommendationReplayInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    input.graph.contract.graphId,
    ...input.lineage.evidencePath.evidenceIds,
    ...input.verification.evidencePath.evidenceIds,
    ...input.escalation.evidencePath.evidenceIds,
  ]);
}

function projectEvidenceIds(context: RecommendationReplayContext, input: RecommendationReplayInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return [input.ledger.entry.ledgerEntryId];
    case "LINEAGE":
      return collectLineage({
        ledger: input.ledger,
        lineage: input.lineage,
        verification: input.verification,
        escalation: input.escalation,
        graph: input.graph,
        replayReferences: input.replayReferences,
        replayMutationAttempted: input.replayMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        recommendationGenerationRequested: input.recommendationGenerationRequested,
        repairRequested: input.repairRequested,
        authorityExpansionDetected: input.authorityExpansionDetected,
      });
    case "REPLAY":
      return collectReplayReferences({
        ledger: input.ledger,
        lineage: input.lineage,
        verification: input.verification,
        escalation: input.escalation,
        graph: input.graph,
        replayReferences: input.replayReferences,
        replayMutationAttempted: input.replayMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        recommendationGenerationRequested: input.recommendationGenerationRequested,
        repairRequested: input.repairRequested,
        authorityExpansionDetected: input.authorityExpansionDetected,
      });
    case "LEDGER":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.ledger.entry.evidenceIds,
      ]);
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function findRecommendationNode(input: RecommendationReplayInput) {
  return input.graph.nodes.find((node) => node.nodeId === input.request.recommendationId);
}

function validateSealedArtifacts(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const states = [
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.escalation.sealed, "ESCALATION_REQUIRED", "ESCALATION_UNSEALED"],
    [input.graph.sealed, "GRAPH_REQUIRED", "GRAPH_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: RecommendationReplayRequest, reasons: RecommendationReplayReasonCode[]): boolean {
  const valid = REPLAY_CONTEXTS.includes(request.replayContext);
  addReason(reasons, valid ? "REPLAY_CONTEXT_VALID" : "REPLAY_CONTEXT_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationReplayRequest, input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const recommendationIdPresent = request.recommendationId.length > 0;
  const node = findRecommendationNode(input);
  const recommendationNodePresent = Boolean(node);
  const recommendationNodeTypeValid = node?.nodeType === "RECOMMENDATION";
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  addReason(reasons, recommendationNodePresent ? "RECOMMENDATION_NODE_PRESENT" : "RECOMMENDATION_NODE_MISSING");
  addReason(reasons, recommendationNodeTypeValid ? "RECOMMENDATION_NODE_TYPE_VALID" : "RECOMMENDATION_NODE_TYPE_INVALID");
  return recommendationIdPresent && recommendationNodePresent && recommendationNodeTypeValid;
}

function validateIdentity(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const graphIdValid = input.ledger.entry.graphId === input.graph.contract.graphId
    && input.lineage.ancestryChain.every((node) => node.graphId === input.graph.contract.graphId)
    && input.escalation.result.graphId === input.graph.contract.graphId;
  const versionValid = input.request.graphVersion === input.graph.contract.graphVersion;
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.escalation.result.tenantIsolationVerified
    && input.graph.validation.tenantScoped
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.ownershipVerified
    && input.verification.result.ownershipVerified
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    ledger: input.ledger,
    lineage: input.lineage,
    verification: input.verification,
    escalation: input.escalation,
    graph: input.graph,
    replayReferences: input.replayReferences,
    replayMutationAttempted: input.replayMutationAttempted,
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
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplayChain(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const replayReferences = collectReplayReferences({
    ledger: input.ledger,
    lineage: input.lineage,
    verification: input.verification,
    escalation: input.escalation,
    graph: input.graph,
    replayReferences: input.replayReferences,
    replayMutationAttempted: input.replayMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationGenerationRequested: input.recommendationGenerationRequested,
    repairRequested: input.repairRequested,
    authorityExpansionDetected: input.authorityExpansionDetected,
  });
  const explicitReplayReferences = normalizeStrings(input.replayReferences ?? []);
  const referencesPresent = explicitReplayReferences.length > 0;
  const valid = referencesPresent
    && input.ledger.entry.evidenceIds.length > 0
    && input.lineage.evidencePath.evidenceIds.length > 0
    && input.verification.evidencePath.evidenceIds.length > 0
    && explicitReplayReferences.every((reference) => replayReferences.includes(reference));
  addReason(reasons, referencesPresent ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  addReason(reasons, valid ? "REPLAY_CHAIN_VALID" : "REPLAY_CHAIN_BROKEN");
  return valid;
}

function detectReconstructionMismatch(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const mismatch = !input.lineage.result.ancestryRebuilt
    || input.lineage.result.reconstructionState === "LIMITED"
    || input.verification.result.verificationState === "LIMITED";
  addReason(reasons, mismatch ? "RECONSTRUCTION_MISMATCH" : "RECONSTRUCTION_SUCCESSFUL");
  return mismatch;
}

function detectReplayHashMismatch(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const mismatch = !input.ledger.result.replayable
    || !input.lineage.result.replayable
    || !input.verification.result.replayConsistency;
  addReason(reasons, mismatch ? "REPLAY_HASH_MISMATCH" : "REPLAY_INTEGRITY_VALID");
  return mismatch;
}

function validateEvidenceHashes(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationReplayInput, reasons: RecommendationReplayReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.ledger.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.escalation.validation.authorityBounded;
  const invalidBoundary = input.replayMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.repairRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.replayMutationAttempted === true ? "REPLAY_MUTATION_DETECTED" : "REPLAY_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.repairRequested === true ? "REPAIR_DETECTED" : "REPAIR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_REPLAY_IS_NOT_ENGINE");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: RecommendationReplayEvidencePath, replayReferenceCount: number, reasons: RecommendationReplayReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_REPLAY_DEPTH;
  const replayValid = replayReferenceCount <= MAX_REPLAY_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "REPLAY_DEPTH_VALID" : "REPLAY_DEPTH_EXCEEDED");
  addReason(reasons, replayValid ? "REPLAY_REFERENCE_LIMIT_VALID" : "REPLAY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && replayValid && lineageValid;
}

function classifyReplayState(
  valid: boolean,
  replayHashMismatch: boolean,
  reconstructionMismatch: boolean,
): RecommendationReplayResult["replayState"] {
  if (!valid) return "INVALID";
  if (replayHashMismatch || reconstructionMismatch) return "LIMITED";
  return "REPLAYABLE";
}

export function buildRecommendationReplayRequest(
  input: Omit<RecommendationReplayInput, "request"> & {
    replayContext?: RecommendationReplayContext;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
  },
): RecommendationReplayRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    replayContext: input.replayContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? input.graph.contract.graphVersion,
  } as RecommendationReplayRequest);
}

export function createRecommendationReplayEvidencePath(input: RecommendationReplayInput): RecommendationReplayEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.replayContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.replayContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.replayContext === "OWNERSHIP"
        ? request.lineageReferences.slice(0, MAX_REPLAY_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateRecommendationReplay(input: RecommendationReplayInput): RecommendationReplayValidation {
  const reasons: RecommendationReplayReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationReplayEvidencePath(normalizedInput);
  const replayReferenceCount = collectReplayReferences(normalizedInput).length;

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const recommendationValid = validateRecommendation(request, normalizedInput, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipVerified = validateOwnership(normalizedInput, reasons);
  const lineageIntegrity = validateLineage(normalizedInput, reasons);
  const replayChainValid = validateReplayChain(normalizedInput, reasons);
  const reconstructionMismatch = detectReconstructionMismatch(normalizedInput, reasons);
  const replayHashMismatch = detectReplayHashMismatch(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, replayReferenceCount, reasons);

  const reconstructionSuccessful = replayChainValid && !reconstructionMismatch;
  const replayIntegrity = replayChainValid && !replayHashMismatch;

  const valid = sealedArtifacts
    && contextValid
    && recommendationValid
    && identityValid
    && tenantIsolationVerified
    && ownershipVerified
    && lineageIntegrity
    && replayChainValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    replayState: classifyReplayState(valid, replayHashMismatch, reconstructionMismatch),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationReplayReasonCode[],
    replayIntegrity,
    lineageIntegrity,
    reconstructionSuccessful,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    replayReferenceCount,
  });
}

export function buildRecommendationReplayResult(input: RecommendationReplayInput): RecommendationReplayResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationReplayEvidencePath(normalizedInput);
  const validation = validateRecommendationReplay(normalizedInput);

  const replayHash = hashReplayValue("recommendation-replay-framework", {
    request,
    evidencePath,
    replayState: validation.replayState,
    replayIntegrity: validation.replayIntegrity,
    lineageIntegrity: validation.lineageIntegrity,
    reconstructionSuccessful: validation.reconstructionSuccessful,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  const reconstructionHash = hashReplayValue("recommendation-replay-reconstruction", {
    request,
    evidenceIds: evidencePath.evidenceIds,
    evidenceHashes: evidencePath.evidenceHashes,
    lineageReferences: evidencePath.lineageReferences,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    replayState: validation.replayState,
    replayIntegrity: validation.replayIntegrity,
    lineageIntegrity: validation.lineageIntegrity,
    reconstructionSuccessful: validation.reconstructionSuccessful,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    replayHash,
    reconstructionHash,
    deterministic: true,
  });
}

export function buildRecommendationReplayObservability(result: RecommendationReplayResult): RecommendationReplayObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    replayState: result.replayState,
    replayIntegrity: result.replayIntegrity,
    lineageIntegrity: result.lineageIntegrity,
    replayHash: result.replayHash,
    reconstructionHash: result.reconstructionHash,
  });
}

export function sealRecommendationReplay(input: RecommendationReplayInput): SealedRecommendationReplayRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationReplayEvidencePath(normalizedInput);
  const validation = validateRecommendationReplay(normalizedInput);
  const result = buildRecommendationReplayResult(normalizedInput);
  const observability = buildRecommendationReplayObservability(result);

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
    recommendationGenerationAllowed: false as const,
    repairAuthorized: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationReplayValidator = Object.freeze({
  validate: validateRecommendationReplay,
});

export const RecommendationReplayFramework = Object.freeze({
  buildRequest: buildRecommendationReplayRequest,
  createEvidencePath: createRecommendationReplayEvidencePath,
  buildResult: buildRecommendationReplayResult,
  seal: sealRecommendationReplay,
});

export const RecommendationReplayObservabilityService = Object.freeze({
  build: buildRecommendationReplayObservability,
});
