import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationHistoryVerificationContext,
  RecommendationHistoryVerificationEvidencePath,
  RecommendationHistoryVerificationInput,
  RecommendationHistoryVerificationObservability,
  RecommendationHistoryVerificationReasonCode,
  RecommendationHistoryVerificationRequest,
  RecommendationHistoryVerificationResult,
  RecommendationHistoryVerificationValidation,
  SealedRecommendationHistoryVerificationRecord,
} from "./types";

const MAX_VERIFICATION_DEPTH = 20;
const MAX_HISTORY_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const VERIFICATION_CONTEXTS: readonly RecommendationHistoryVerificationContext[] = Object.freeze([
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

function addReason(reasons: RecommendationHistoryVerificationReasonCode[], reason: RecommendationHistoryVerificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashVerificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationHistoryVerificationRequest): RecommendationHistoryVerificationRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    verificationContext: request.verificationContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectHistoryReferences(input: Omit<RecommendationHistoryVerificationInput, "request">): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    ...input.ledger.entry.evidenceIds,
    ...input.lineage.ancestryChain.map((node) => node.lineageReference),
    ...(input.historyReferences ?? []),
  ]);
}

function collectEvidenceHashes(input: RecommendationHistoryVerificationInput): string[] {
  return normalizeStrings([
    input.ledger.result.ledgerHash,
    input.ledger.result.evidenceHash,
    input.lineage.result.reconstructionHash,
    input.lineage.result.lineageHash,
    input.escalation.result.escalationEvidenceHash,
    input.graph.contract.graphHash,
    input.verification.result.verificationHash,
    input.certification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: RecommendationHistoryVerificationInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    input.graph.contract.graphId,
    ...input.lineage.evidencePath.evidenceIds,
    ...input.escalation.evidencePath.evidenceIds,
    ...input.verification.verificationPath.artifactIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function collectLineage(input: Omit<RecommendationHistoryVerificationInput, "request">): string[] {
  return normalizeStrings([
    ...input.ledger.entry.lineageReferences,
    ...input.lineage.evidencePath.lineageReferences,
    ...input.escalation.evidencePath.lineageReferences,
    ...input.graph.contract.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
  ]);
}

function projectEvidenceIds(context: RecommendationHistoryVerificationContext, input: RecommendationHistoryVerificationInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return [input.ledger.entry.ledgerEntryId];
    case "LINEAGE":
      return collectLineage({
        ledger: input.ledger,
        lineage: input.lineage,
        escalation: input.escalation,
        graph: input.graph,
        verification: input.verification,
        certification: input.certification,
        historyReferences: input.historyReferences,
        verificationMutationAttempted: input.verificationMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        recommendationGenerationRequested: input.recommendationGenerationRequested,
        repairRequested: input.repairRequested,
        authorityExpansionDetected: input.authorityExpansionDetected,
      });
    case "REPLAY":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.verification.verificationPath.artifactIds,
        ...input.certification.evidenceChain.evidenceIds,
      ]);
    case "LEDGER":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.ledger.entry.evidenceIds,
      ]);
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function findRecommendationNode(input: RecommendationHistoryVerificationInput) {
  return input.graph.nodes.find((node) => node.nodeId === input.request.recommendationId);
}

function validateSealedArtifacts(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const states = [
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.graph.sealed, "GRAPH_REQUIRED", "GRAPH_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
    [input.escalation.sealed, "ESCALATION_REQUIRED", "ESCALATION_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: RecommendationHistoryVerificationRequest, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const valid = VERIFICATION_CONTEXTS.includes(request.verificationContext);
  addReason(reasons, valid ? "VERIFICATION_CONTEXT_VALID" : "VERIFICATION_CONTEXT_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationHistoryVerificationRequest, input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const recommendationIdPresent = request.recommendationId.length > 0;
  const node = findRecommendationNode(input);
  const recommendationNodePresent = Boolean(node);
  const recommendationNodeTypeValid = node?.nodeType === "RECOMMENDATION";
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  addReason(reasons, recommendationNodePresent ? "RECOMMENDATION_NODE_PRESENT" : "RECOMMENDATION_NODE_MISSING");
  addReason(reasons, recommendationNodeTypeValid ? "RECOMMENDATION_NODE_TYPE_VALID" : "RECOMMENDATION_NODE_TYPE_INVALID");
  return recommendationIdPresent && recommendationNodePresent && recommendationNodeTypeValid;
}

function validateIdentity(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const graphIdValid = input.ledger.entry.graphId === input.graph.contract.graphId
    && input.lineage.ancestryChain.every((node) => node.graphId === input.graph.contract.graphId)
    && input.escalation.result.graphId === input.graph.contract.graphId
    && input.verification.result.graphId === input.graph.contract.graphId
    && input.certification.result.graphId === input.graph.contract.graphId;
  const versionValid = input.request.graphVersion === input.graph.contract.graphVersion;
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.escalation.result.tenantIsolationVerified
    && input.graph.validation.tenantScoped
    && input.verification.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.ownershipVerified
    && input.certification.result.ownershipCertified
    && input.verification.result.ownershipIntegrity
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    ledger: input.ledger,
    lineage: input.lineage,
    escalation: input.escalation,
    graph: input.graph,
    verification: input.verification,
    certification: input.certification,
    historyReferences: input.historyReferences,
    verificationMutationAttempted: input.verificationMutationAttempted,
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
    && input.certification.result.lineageCertified
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_CONTINUITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateHistoryIntegrity(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const historyReferences = collectHistoryReferences({
    ledger: input.ledger,
    lineage: input.lineage,
    escalation: input.escalation,
    graph: input.graph,
    verification: input.verification,
    certification: input.certification,
    historyReferences: input.historyReferences,
    verificationMutationAttempted: input.verificationMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationGenerationRequested: input.recommendationGenerationRequested,
    repairRequested: input.repairRequested,
    authorityExpansionDetected: input.authorityExpansionDetected,
  });
  const explicitHistoryReferences = normalizeStrings(input.historyReferences ?? []);
  const referencesPresent = explicitHistoryReferences.length > 0;
  const complete = referencesPresent
    && input.ledger.entry.evidenceIds.length > 0
    && input.ledger.entry.evidenceHashes.length > 0
    && input.lineage.ancestryChain.length > 0
    && explicitHistoryReferences.every((reference) => historyReferences.includes(reference))
    && input.lineage.result.ancestryRebuilt;
  addReason(reasons, referencesPresent ? "HISTORY_REFERENCES_PRESENT" : "HISTORY_REFERENCES_MISSING");
  addReason(reasons, complete ? "HISTORY_COMPLETENESS_VALID" : "HISTORY_COMPLETENESS_FAILED");
  addReason(reasons, complete ? "LEDGER_INTEGRITY_VALID" : "LEDGER_CORRUPTION_DETECTED");
  return complete;
}

function validateReplayConsistency(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const consistent = input.ledger.result.replayable
    && input.lineage.result.replayable
    && input.verification.result.deterministicReplayVerified
    && input.certification.result.replayDeterministic;
  addReason(reasons, consistent ? "REPLAY_CONSISTENCY_VALID" : "REPLAY_MISMATCH_DETECTED");
  return consistent;
}

function validateEvidenceHashes(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationHistoryVerificationInput, reasons: RecommendationHistoryVerificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.ledger.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.escalation.validation.authorityBounded
    && input.certification.result.authorityBounded;
  const invalidBoundary = input.verificationMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.repairRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.verificationMutationAttempted === true ? "VERIFICATION_MUTATION_DETECTED" : "VERIFICATION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.repairRequested === true ? "REPAIR_DETECTED" : "REPAIR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_HISTORY_VERIFICATION_IS_NOT_ENGINE");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(
  path: RecommendationHistoryVerificationEvidencePath,
  historyReferenceCount: number,
  reasons: RecommendationHistoryVerificationReasonCode[],
): boolean {
  const depthValid = path.lineageReferences.length <= MAX_VERIFICATION_DEPTH;
  const historyValid = historyReferenceCount <= MAX_HISTORY_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "VERIFICATION_DEPTH_VALID" : "VERIFICATION_DEPTH_EXCEEDED");
  addReason(reasons, historyValid ? "HISTORY_REFERENCE_LIMIT_VALID" : "HISTORY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && historyValid && lineageValid;
}

function classifyVerificationState(valid: boolean, replayConsistency: boolean): RecommendationHistoryVerificationResult["verificationState"] {
  if (!valid) return "INVALID";
  if (!replayConsistency) return "LIMITED";
  return "VERIFIED";
}

export function buildRecommendationHistoryVerificationRequest(
  input: Omit<RecommendationHistoryVerificationInput, "request"> & {
    verificationContext?: RecommendationHistoryVerificationContext;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
  },
): RecommendationHistoryVerificationRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    verificationContext: input.verificationContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? input.graph.contract.graphVersion,
  } as RecommendationHistoryVerificationRequest);
}

export function createRecommendationHistoryVerificationEvidencePath(
  input: RecommendationHistoryVerificationInput,
): RecommendationHistoryVerificationEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.verificationContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.verificationContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.verificationContext === "OWNERSHIP"
        ? request.lineageReferences.slice(0, MAX_VERIFICATION_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateRecommendationHistoryVerification(
  input: RecommendationHistoryVerificationInput,
): RecommendationHistoryVerificationValidation {
  const reasons: RecommendationHistoryVerificationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationHistoryVerificationEvidencePath(normalizedInput);
  const historyReferenceCount = collectHistoryReferences(normalizedInput).length;

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const recommendationValid = validateRecommendation(request, normalizedInput, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipVerified = validateOwnership(normalizedInput, reasons);
  const lineageIntegrity = validateLineage(normalizedInput, reasons);
  const historyIntegrity = validateHistoryIntegrity(normalizedInput, reasons);
  const replayConsistency = validateReplayConsistency(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, historyReferenceCount, reasons);

  const valid = sealedArtifacts
    && contextValid
    && recommendationValid
    && identityValid
    && tenantIsolationVerified
    && ownershipVerified
    && lineageIntegrity
    && historyIntegrity
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    verificationState: classifyVerificationState(valid, replayConsistency),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationHistoryVerificationReasonCode[],
    historyIntegrity,
    lineageIntegrity,
    replayConsistency,
    ownershipVerified,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    historyReferenceCount,
  });
}

export function buildRecommendationHistoryVerificationResult(
  input: RecommendationHistoryVerificationInput,
): RecommendationHistoryVerificationResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationHistoryVerificationEvidencePath(normalizedInput);
  const validation = validateRecommendationHistoryVerification(normalizedInput);

  const verificationHash = hashVerificationValue("recommendation-history-verification-result", {
    request,
    evidencePath,
    historyIntegrity: validation.historyIntegrity,
    lineageIntegrity: validation.lineageIntegrity,
    replayConsistency: validation.replayConsistency,
    ownershipVerified: validation.ownershipVerified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    verificationState: validation.verificationState,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    verificationState: validation.verificationState,
    historyIntegrity: validation.historyIntegrity,
    lineageIntegrity: validation.lineageIntegrity,
    replayConsistency: validation.replayConsistency,
    ownershipVerified: validation.ownershipVerified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    verificationHash,
    deterministic: true,
  });
}

export function buildRecommendationHistoryVerificationObservability(
  result: RecommendationHistoryVerificationResult,
): RecommendationHistoryVerificationObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    verificationState: result.verificationState,
    historyIntegrity: result.historyIntegrity,
    lineageIntegrity: result.lineageIntegrity,
    replayConsistency: result.replayConsistency,
    verificationHash: result.verificationHash,
  });
}

export function sealRecommendationHistoryVerification(
  input: RecommendationHistoryVerificationInput,
): SealedRecommendationHistoryVerificationRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationHistoryVerificationEvidencePath(normalizedInput);
  const validation = validateRecommendationHistoryVerification(normalizedInput);
  const result = buildRecommendationHistoryVerificationResult(normalizedInput);
  const observability = buildRecommendationHistoryVerificationObservability(result);

  return Object.freeze({
    result,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    verificationOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    recommendationGenerationAllowed: false as const,
    repairAuthorized: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationHistoryVerificationValidator = Object.freeze({
  validate: validateRecommendationHistoryVerification,
});

export const RecommendationHistoryVerificationEngine = Object.freeze({
  buildRequest: buildRecommendationHistoryVerificationRequest,
  createEvidencePath: createRecommendationHistoryVerificationEvidencePath,
  buildResult: buildRecommendationHistoryVerificationResult,
  seal: sealRecommendationHistoryVerification,
});

export const RecommendationHistoryVerificationObservabilityService = Object.freeze({
  build: buildRecommendationHistoryVerificationObservability,
});
