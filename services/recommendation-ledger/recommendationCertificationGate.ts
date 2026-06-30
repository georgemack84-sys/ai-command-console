import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  RecommendationCertificationContext,
  RecommendationCertificationEvidencePath,
  RecommendationCertificationInput,
  RecommendationCertificationObservability,
  RecommendationCertificationReasonCode,
  RecommendationCertificationRequest,
  RecommendationCertificationResult,
  RecommendationCertificationValidation,
  SealedRecommendationCertificationRecord,
} from "./types";

const MAX_CERTIFICATION_DEPTH = 20;
const MAX_HISTORY_REFERENCES = 5000;
const MAX_LINEAGE_REFERENCES = 1000;

const CERTIFICATION_CONTEXTS: readonly RecommendationCertificationContext[] = Object.freeze([
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

function addReason(reasons: RecommendationCertificationReasonCode[], reason: RecommendationCertificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashCertificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: RecommendationCertificationRequest): RecommendationCertificationRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    certificationContext: request.certificationContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectHistoryReferences(input: Omit<RecommendationCertificationInput, "request">): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    ...input.ledger.entry.evidenceIds,
    ...input.lineage.ancestryChain.map((node) => node.lineageReference),
    ...(input.historyReferences ?? []),
  ]);
}

function collectLineage(input: Omit<RecommendationCertificationInput, "request">): string[] {
  return normalizeStrings([
    ...input.ledger.entry.lineageReferences,
    ...input.lineage.evidencePath.lineageReferences,
    ...input.verification.evidencePath.lineageReferences,
    ...input.replay.evidencePath.lineageReferences,
    ...input.integrity.evidencePath.lineageReferences,
    ...input.escalation.evidencePath.lineageReferences,
    ...input.graph.contract.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: RecommendationCertificationInput): string[] {
  return normalizeStrings([
    input.ledger.result.ledgerHash,
    input.ledger.result.evidenceHash,
    input.lineage.result.reconstructionHash,
    input.lineage.result.lineageHash,
    input.verification.result.verificationHash,
    input.replay.result.replayHash,
    input.replay.result.reconstructionHash,
    input.integrity.result.integrityHash,
    input.escalation.result.escalationEvidenceHash,
    input.graph.contract.graphHash,
  ]);
}

function collectEvidenceIds(input: RecommendationCertificationInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    input.graph.contract.graphId,
    ...input.lineage.evidencePath.evidenceIds,
    ...input.verification.evidencePath.evidenceIds,
    ...input.replay.evidencePath.evidenceIds,
    ...input.integrity.evidencePath.evidenceIds,
    ...input.escalation.evidencePath.evidenceIds,
  ]);
}

function projectEvidenceIds(context: RecommendationCertificationContext, input: RecommendationCertificationInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return [input.ledger.entry.ledgerEntryId];
    case "LINEAGE":
      return collectLineage({
        ledger: input.ledger,
        lineage: input.lineage,
        verification: input.verification,
        replay: input.replay,
        integrity: input.integrity,
        escalation: input.escalation,
        graph: input.graph,
        historyReferences: input.historyReferences,
        certificationMutationAttempted: input.certificationMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        recommendationGenerationRequested: input.recommendationGenerationRequested,
        prioritizationRequested: input.prioritizationRequested,
        repairRequested: input.repairRequested,
        authorityExpansionDetected: input.authorityExpansionDetected,
      });
    case "REPLAY":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.replay.evidencePath.evidenceIds,
        ...input.integrity.evidencePath.evidenceIds,
      ]);
    case "EVIDENCE":
      return normalizeStrings([
        input.ledger.entry.ledgerEntryId,
        ...input.ledger.entry.evidenceIds,
        ...input.integrity.evidencePath.evidenceIds,
      ]);
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function findRecommendationNode(input: RecommendationCertificationInput) {
  return input.graph.nodes.find((node) => node.nodeId === input.request.recommendationId);
}

function validateSealedArtifacts(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const states = [
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.lineage.sealed, "LINEAGE_REQUIRED", "LINEAGE_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.replay.sealed, "REPLAY_REQUIRED", "REPLAY_UNSEALED"],
    [input.integrity.sealed, "INTEGRITY_REQUIRED", "INTEGRITY_UNSEALED"],
    [input.escalation.sealed, "ESCALATION_REQUIRED", "ESCALATION_UNSEALED"],
    [input.graph.sealed, "GRAPH_REQUIRED", "GRAPH_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: RecommendationCertificationRequest, reasons: RecommendationCertificationReasonCode[]): boolean {
  const valid = CERTIFICATION_CONTEXTS.includes(request.certificationContext);
  addReason(reasons, valid ? "CERTIFICATION_CONTEXT_VALID" : "CERTIFICATION_CONTEXT_INVALID");
  return valid;
}

function validateRecommendation(request: RecommendationCertificationRequest, input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const recommendationIdPresent = request.recommendationId.length > 0;
  const node = findRecommendationNode(input);
  const recommendationNodePresent = Boolean(node);
  const recommendationNodeTypeValid = node?.nodeType === "RECOMMENDATION";
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  addReason(reasons, recommendationNodePresent ? "RECOMMENDATION_NODE_PRESENT" : "RECOMMENDATION_NODE_MISSING");
  addReason(reasons, recommendationNodeTypeValid ? "RECOMMENDATION_NODE_TYPE_VALID" : "RECOMMENDATION_NODE_TYPE_INVALID");
  return recommendationIdPresent && recommendationNodePresent && recommendationNodeTypeValid;
}

function validateIdentity(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const graphIdValid = input.ledger.entry.graphId === input.graph.contract.graphId
    && input.lineage.ancestryChain.every((node) => node.graphId === input.graph.contract.graphId)
    && input.escalation.result.graphId === input.graph.contract.graphId;
  const versionValid = input.request.graphVersion === input.graph.contract.graphVersion;
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.tenantIsolationVerified
    && input.lineage.result.tenantIsolationVerified
    && input.verification.result.tenantIsolationVerified
    && input.replay.result.tenantIsolationVerified
    && input.integrity.result.tenantIsolationVerified
    && input.escalation.result.tenantIsolationVerified
    && input.graph.validation.tenantScoped
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.ownershipVerified
    && input.verification.result.ownershipVerified
    && input.integrity.result.ownershipIntegrity
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateHistory(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const historyReferences = collectHistoryReferences({
    ledger: input.ledger,
    lineage: input.lineage,
    verification: input.verification,
    replay: input.replay,
    integrity: input.integrity,
    escalation: input.escalation,
    graph: input.graph,
    historyReferences: input.historyReferences,
    certificationMutationAttempted: input.certificationMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationGenerationRequested: input.recommendationGenerationRequested,
    prioritizationRequested: input.prioritizationRequested,
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
    && input.verification.result.historyIntegrity
    && input.integrity.result.historyIntegrity;
  addReason(reasons, referencesPresent ? "HISTORY_REFERENCES_PRESENT" : "HISTORY_REFERENCES_MISSING");
  addReason(reasons, valid ? "HISTORY_CERTIFIED" : "HISTORY_INTEGRITY_FAILED");
  return valid;
}

function validateLineage(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    ledger: input.ledger,
    lineage: input.lineage,
    verification: input.verification,
    replay: input.replay,
    integrity: input.integrity,
    escalation: input.escalation,
    graph: input.graph,
    historyReferences: input.historyReferences,
    certificationMutationAttempted: input.certificationMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationGenerationRequested: input.recommendationGenerationRequested,
    prioritizationRequested: input.prioritizationRequested,
    repairRequested: input.repairRequested,
    authorityExpansionDetected: input.authorityExpansionDetected,
  });
  const valid = lineageReferences.length > 0
    && input.lineage.result.lineageIntegrity
    && input.verification.result.lineageIntegrity
    && input.replay.result.lineageIntegrity
    && input.integrity.result.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_CERTIFIED" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateReplay(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const valid = input.ledger.result.replayable
    && input.lineage.result.replayable
    && input.verification.result.replayConsistency
    && input.replay.result.replayIntegrity
    && input.integrity.result.replayIntegrity;
  addReason(reasons, valid ? "REPLAY_CERTIFIED" : "REPLAY_HASH_MISMATCH");
  return valid;
}

function validateEvidenceChain(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const valid = input.ledger.entry.evidenceIds.length > 0
    && input.lineage.evidencePath.evidenceIds.length > 0
    && input.verification.evidencePath.evidenceIds.length > 0
    && input.replay.evidencePath.evidenceIds.length > 0
    && input.integrity.evidencePath.evidenceIds.length > 0
    && input.escalation.evidencePath.evidenceIds.length > 0;
  addReason(reasons, valid ? "EVIDENCE_CHAIN_VALID" : "EVIDENCE_CHAIN_BROKEN");
  return valid;
}

function validateEvidenceHashes(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: RecommendationCertificationInput, reasons: RecommendationCertificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionDetected !== true
    && input.ledger.validation.authorityBounded
    && input.lineage.validation.authorityBounded
    && input.verification.validation.authorityBounded
    && input.replay.validation.authorityBounded
    && input.integrity.validation.authorityBounded
    && input.escalation.validation.authorityBounded;
  const invalidBoundary = input.certificationMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.prioritizationRequested === true
    || input.repairRequested === true
    || input.authorityExpansionDetected === true;
  addReason(reasons, input.certificationMutationAttempted === true ? "CERTIFICATION_MUTATION_DETECTED" : "CERTIFICATION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, input.prioritizationRequested === true ? "PRIORITIZATION_DETECTED" : "PRIORITIZATION_BLOCKED");
  addReason(reasons, input.repairRequested === true ? "REPAIR_DETECTED" : "REPAIR_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "RECOMMENDATION_CERTIFICATION_IS_NOT_ENGINE");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(path: RecommendationCertificationEvidencePath, historyReferenceCount: number, reasons: RecommendationCertificationReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_CERTIFICATION_DEPTH;
  const historyValid = historyReferenceCount <= MAX_HISTORY_REFERENCES;
  const lineageValid = path.lineageReferences.length <= MAX_LINEAGE_REFERENCES;
  addReason(reasons, depthValid ? "CERTIFICATION_DEPTH_VALID" : "CERTIFICATION_DEPTH_EXCEEDED");
  addReason(reasons, historyValid ? "HISTORY_REFERENCE_LIMIT_VALID" : "HISTORY_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  return depthValid && historyValid && lineageValid;
}

function classifyCertificationState(
  valid: boolean,
  replayCertified: boolean,
  boundedDegradation: boolean,
): RecommendationCertificationResult["certificationState"] {
  if (!valid) return "FAIL";
  if (!replayCertified || boundedDegradation) return "CONDITIONAL_PASS";
  return "PASS";
}

export function buildRecommendationCertificationRequest(
  input: Omit<RecommendationCertificationInput, "request"> & {
    certificationContext?: RecommendationCertificationContext;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
  },
): RecommendationCertificationRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    certificationContext: input.certificationContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? input.graph.contract.graphVersion,
  } as RecommendationCertificationRequest);
}

export function createRecommendationCertificationEvidencePath(input: RecommendationCertificationInput): RecommendationCertificationEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.certificationContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.certificationContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.certificationContext === "OWNERSHIP"
        ? request.lineageReferences.slice(0, MAX_CERTIFICATION_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateRecommendationCertification(input: RecommendationCertificationInput): RecommendationCertificationValidation {
  const reasons: RecommendationCertificationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationCertificationEvidencePath(normalizedInput);
  const historyReferenceCount = collectHistoryReferences(normalizedInput).length;

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const recommendationValid = validateRecommendation(request, normalizedInput, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipCertified = validateOwnership(normalizedInput, reasons);
  const historyCertified = validateHistory(normalizedInput, reasons);
  const lineageCertified = validateLineage(normalizedInput, reasons);
  const replayCertified = validateReplay(normalizedInput, reasons);
  const evidenceChainValid = validateEvidenceChain(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, historyReferenceCount, reasons);

  const boundedDegradation = normalizedInput.replay.result.replayState === "LIMITED"
    || normalizedInput.integrity.result.integrityState === "DEGRADED"
    || normalizedInput.integrity.result.integrityState === "LIMITED"
    || normalizedInput.verification.result.verificationState === "LIMITED"
    || normalizedInput.lineage.result.reconstructionState === "LIMITED"
    || normalizedInput.ledger.result.ledgerState === "LIMITED";

  const valid = sealedArtifacts
    && contextValid
    && recommendationValid
    && identityValid
    && tenantIsolationVerified
    && ownershipCertified
    && historyCertified
    && lineageCertified
    && evidenceChainValid
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    certificationState: classifyCertificationState(valid, replayCertified, boundedDegradation),
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationCertificationReasonCode[],
    historyCertified,
    lineageCertified,
    replayCertified,
    ownershipCertified,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    historyReferenceCount,
  });
}

export function buildRecommendationCertificationResult(input: RecommendationCertificationInput): RecommendationCertificationResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationCertificationEvidencePath(normalizedInput);
  const validation = validateRecommendationCertification(normalizedInput);

  const certificationHash = hashCertificationValue("recommendation-certification-gate", {
    request,
    evidencePath,
    certificationState: validation.certificationState,
    historyCertified: validation.historyCertified,
    lineageCertified: validation.lineageCertified,
    replayCertified: validation.replayCertified,
    ownershipCertified: validation.ownershipCertified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    certificationState: validation.certificationState,
    historyCertified: validation.historyCertified,
    lineageCertified: validation.lineageCertified,
    replayCertified: validation.replayCertified,
    ownershipCertified: validation.ownershipCertified,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    certificationHash,
    deterministic: true,
  });
}

export function buildRecommendationCertificationObservability(result: RecommendationCertificationResult): RecommendationCertificationObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    certificationState: result.certificationState,
    historyCertified: result.historyCertified,
    lineageCertified: result.lineageCertified,
    replayCertified: result.replayCertified,
    certificationHash: result.certificationHash,
  });
}

export function sealRecommendationCertification(input: RecommendationCertificationInput): SealedRecommendationCertificationRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createRecommendationCertificationEvidencePath(normalizedInput);
  const validation = validateRecommendationCertification(normalizedInput);
  const result = buildRecommendationCertificationResult(normalizedInput);
  const observability = buildRecommendationCertificationObservability(result);

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
    prioritizationAllowed: false as const,
    repairAuthorized: false as const,
    authorityMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const RecommendationCertificationValidator = Object.freeze({
  validate: validateRecommendationCertification,
});

export const RecommendationCertificationGate = Object.freeze({
  buildRequest: buildRecommendationCertificationRequest,
  createEvidencePath: createRecommendationCertificationEvidencePath,
  buildResult: buildRecommendationCertificationResult,
  seal: sealRecommendationCertification,
});

export const RecommendationCertificationObservabilityService = Object.freeze({
  build: buildRecommendationCertificationObservability,
});
