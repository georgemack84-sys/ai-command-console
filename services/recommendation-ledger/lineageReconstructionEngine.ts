import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  LineageReconstructionContext,
  LineageReconstructionEvidencePath,
  LineageReconstructionInput,
  LineageReconstructionObservability,
  LineageReconstructionReasonCode,
  LineageReconstructionRequest,
  LineageReconstructionResult,
  LineageReconstructionValidation,
  ReconstructedLineageNode,
  SealedLineageReconstructionRecord,
} from "./types";

export const MAX_RECONSTRUCTION_DEPTH = 20;
export const MAX_RECONSTRUCTION_LINEAGE_REFERENCES = 1000;
export const MAX_ANCESTRY_CHAIN = 5000;

const RECONSTRUCTION_CONTEXTS: readonly LineageReconstructionContext[] = Object.freeze([
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

function addReason(reasons: LineageReconstructionReasonCode[], reason: LineageReconstructionReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashLineageValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: LineageReconstructionRequest): LineageReconstructionRequest {
  return Object.freeze({
    recommendationId: request.recommendationId,
    tenantId: request.tenantId,
    reconstructionContext: request.reconstructionContext,
    lineageReferences: normalizeStrings(request.lineageReferences),
    graphVersion: request.graphVersion,
  });
}

function collectLineage(input: Omit<LineageReconstructionInput, "request">): string[] {
  return normalizeStrings([
    ...input.ledger.entry.lineageReferences,
    ...input.graph.contract.lineageReferences,
    ...input.verification.verificationPath.lineageReferences,
    ...input.certification.evidenceChain.lineageReferences,
  ]);
}

function collectEvidenceHashes(input: LineageReconstructionInput): string[] {
  return normalizeStrings([
    input.ledger.result.ledgerHash,
    input.ledger.result.evidenceHash,
    input.graph.contract.graphHash,
    input.verification.result.verificationHash,
    input.certification.result.certificationHash,
    input.escalationCertification.result.certificationHash,
  ]);
}

function collectEvidenceIds(input: LineageReconstructionInput): string[] {
  return normalizeStrings([
    input.ledger.entry.ledgerEntryId,
    input.graph.contract.graphId,
    ...input.verification.verificationPath.artifactIds,
    ...input.certification.evidenceChain.evidenceIds,
  ]);
}

function projectEvidenceIds(context: LineageReconstructionContext, input: LineageReconstructionInput): string[] {
  switch (context) {
    case "OWNERSHIP":
      return [input.ledger.entry.ledgerEntryId];
    case "LINEAGE":
      return collectLineage({
        ledger: input.ledger,
        graph: input.graph,
        verification: input.verification,
        certification: input.certification,
        escalationCertification: input.escalationCertification,
        lineageMutationDetected: input.lineageMutationDetected,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        recommendationGenerationRequested: input.recommendationGenerationRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
      });
    case "GRAPH":
      return normalizeStrings([
        input.graph.contract.graphId,
        ...input.certification.evidenceChain.evidenceIds,
      ]);
    case "ESCALATION":
      return normalizeStrings([
        input.escalationCertification.result.graphId,
        ...input.ledger.evidencePath.evidenceIds,
      ]);
    case "FULL":
      return collectEvidenceIds(input);
  }
}

function findRecommendationNode(input: LineageReconstructionInput) {
  return input.graph.nodes.find((node) => node.nodeId === input.request.recommendationId);
}

function buildAncestryChain(
  input: LineageReconstructionInput,
  evidencePath: LineageReconstructionEvidencePath,
): readonly ReconstructedLineageNode[] {
  const lineageReferences = evidencePath.lineageReferences.slice(0, MAX_ANCESTRY_CHAIN);
  return Object.freeze(
    lineageReferences.map((lineageReference, index) =>
      Object.freeze({
        recommendationId: input.request.recommendationId,
        graphId: input.graph.contract.graphId,
        tenantId: input.request.tenantId,
        lineageReference,
        ancestryOrder: index + 1,
        immutableHash: hashLineageValue("lineage-reconstruction-node", {
          recommendationId: input.request.recommendationId,
          graphId: input.graph.contract.graphId,
          tenantId: input.request.tenantId,
          lineageReference,
          ancestryOrder: index + 1,
        }),
      })),
  );
}

function validateSealedArtifacts(input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): boolean {
  const states = [
    [input.ledger.sealed, "LEDGER_REQUIRED", "LEDGER_UNSEALED"],
    [input.graph.sealed, "GRAPH_REQUIRED", "GRAPH_UNSEALED"],
    [input.verification.sealed, "VERIFICATION_REQUIRED", "VERIFICATION_UNSEALED"],
    [input.certification.sealed, "CERTIFICATION_REQUIRED", "CERTIFICATION_UNSEALED"],
    [input.escalationCertification.sealed, "ESCALATION_CERTIFICATION_REQUIRED", "ESCALATION_CERTIFICATION_UNSEALED"],
  ] as const;
  for (const [sealed, ok, fail] of states) addReason(reasons, sealed ? ok : fail);
  return states.every(([sealed]) => sealed);
}

function validateContext(request: LineageReconstructionRequest, reasons: LineageReconstructionReasonCode[]): boolean {
  const valid = RECONSTRUCTION_CONTEXTS.includes(request.reconstructionContext);
  addReason(reasons, valid ? "RECONSTRUCTION_CONTEXT_VALID" : "RECONSTRUCTION_CONTEXT_INVALID");
  return valid;
}

function validateRecommendation(request: LineageReconstructionRequest, input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): boolean {
  const recommendationIdPresent = request.recommendationId.length > 0;
  const node = findRecommendationNode(input);
  const recommendationNodePresent = Boolean(node);
  const recommendationNodeTypeValid = node?.nodeType === "RECOMMENDATION";
  addReason(reasons, recommendationIdPresent ? "RECOMMENDATION_ID_PRESENT" : "RECOMMENDATION_ID_MISSING");
  addReason(reasons, recommendationNodePresent ? "RECOMMENDATION_NODE_PRESENT" : "RECOMMENDATION_NODE_MISSING");
  addReason(reasons, recommendationNodeTypeValid ? "RECOMMENDATION_NODE_TYPE_VALID" : "RECOMMENDATION_NODE_TYPE_INVALID");
  return recommendationIdPresent && recommendationNodePresent && recommendationNodeTypeValid;
}

function validateIdentity(input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): boolean {
  const graphIdValid = input.ledger.entry.graphId === input.graph.contract.graphId
    && input.verification.result.graphId === input.graph.contract.graphId
    && input.certification.result.graphId === input.graph.contract.graphId
    && input.escalationCertification.result.graphId === input.graph.contract.graphId;
  const versionValid = input.request.graphVersion === input.graph.contract.graphVersion;
  addReason(reasons, graphIdValid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  addReason(reasons, versionValid ? "GRAPH_VERSION_MATCHED" : "GRAPH_VERSION_MISMATCH");
  return graphIdValid && versionValid;
}

function validateTenantScope(input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.tenantIsolationVerified
    && input.graph.validation.tenantScoped
    && input.verification.result.tenantIsolationVerified
    && input.certification.result.tenantIsolationVerified
    && input.escalationCertification.result.tenantIsolationVerified
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): boolean {
  const node = findRecommendationNode(input);
  const valid = input.ledger.result.ownershipVerified
    && input.certification.result.ownershipCertified
    && input.verification.result.ownershipIntegrity
    && node?.tenantId === input.request.tenantId;
  addReason(reasons, valid ? "OWNERSHIP_VALID" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage({
    ledger: input.ledger,
    graph: input.graph,
    verification: input.verification,
    certification: input.certification,
    escalationCertification: input.escalationCertification,
    lineageMutationDetected: input.lineageMutationDetected,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationGenerationRequested: input.recommendationGenerationRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
  });
  const valid = lineageReferences.length > 0
    && input.ledger.entry.lineageReferences.length > 0
    && input.ledger.result.lineageIntegrity
    && input.graph.validation.lineagePreserved
    && input.verification.result.lineageIntegrity
    && input.certification.result.lineageCertified
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateAncestryChain(
  input: LineageReconstructionInput,
  ancestryChain: readonly ReconstructedLineageNode[],
  reasons: LineageReconstructionReasonCode[],
): boolean {
  const valid = ancestryChain.length > 0
    && input.ledger.entry.lineageReferences.length > 0
    && input.ledger.entry.lineageReferences.every((reference, index) =>
      ancestryChain[index]?.lineageReference === reference
    )
    && ancestryChain.every((node, index) => node.ancestryOrder === index + 1);
  addReason(reasons, valid ? "ANCESTRY_CHAIN_VALID" : "ANCESTRY_BROKEN");
  return valid;
}

function validateReplayable(input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): boolean {
  const replayable = input.ledger.result.replayable
    && input.verification.result.deterministicReplayVerified
    && input.certification.result.replayDeterministic
    && input.escalationCertification.result.replayCertified;
  addReason(reasons, replayable ? "REPLAY_REFERENCES_PRESENT" : "REPLAY_REFERENCES_MISSING");
  return replayable;
}

function validateEvidenceHashes(input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): boolean {
  const valid = collectEvidenceHashes(input).every((hash) => hash.length === 64);
  addReason(reasons, valid ? "EVIDENCE_HASH_VERIFIED" : "EVIDENCE_HASH_MISMATCH");
  return valid;
}

function validateBoundary(input: LineageReconstructionInput, reasons: LineageReconstructionReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.ledger.validation.authorityBounded
    && input.graph.validation.authorityBounded
    && input.certification.result.authorityBounded
    && input.escalationCertification.result.authorityBounded;
  const invalidBoundary = input.lineageMutationDetected === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.recommendationGenerationRequested === true
    || input.authorityExpansionRequested === true;
  addReason(reasons, input.lineageMutationDetected === true ? "LINEAGE_MUTATION_DETECTED" : "LINEAGE_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationGenerationRequested === true ? "RECOMMENDATION_GENERATION_DETECTED" : "RECOMMENDATION_GENERATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "LINEAGE_RECONSTRUCTION_IS_NOT_ENGINE");
  return Object.freeze({ executionImpossible, authorityBounded, invalidBoundary });
}

function validateLimits(
  evidencePath: LineageReconstructionEvidencePath,
  ancestryChain: readonly ReconstructedLineageNode[],
  reasons: LineageReconstructionReasonCode[],
): boolean {
  const depthValid = evidencePath.lineageReferences.length <= MAX_RECONSTRUCTION_DEPTH;
  const lineageValid = evidencePath.lineageReferences.length <= MAX_RECONSTRUCTION_LINEAGE_REFERENCES;
  const chainValid = ancestryChain.length <= MAX_ANCESTRY_CHAIN;
  addReason(reasons, depthValid ? "RECONSTRUCTION_DEPTH_VALID" : "RECONSTRUCTION_DEPTH_EXCEEDED");
  addReason(reasons, lineageValid ? "LINEAGE_REFERENCE_LIMIT_VALID" : "LINEAGE_REFERENCE_LIMIT_EXCEEDED");
  addReason(reasons, chainValid ? "ANCESTRY_CHAIN_LIMIT_VALID" : "ANCESTRY_CHAIN_LIMIT_EXCEEDED");
  return depthValid && lineageValid && chainValid;
}

function classifyReconstructionState(
  valid: boolean,
  replayable: boolean,
): LineageReconstructionResult["reconstructionState"] {
  if (!valid) return "INVALID";
  if (!replayable) return "LIMITED";
  return "RECONSTRUCTED";
}

export function buildLineageReconstructionRequest(
  input: Omit<LineageReconstructionInput, "request"> & {
    reconstructionContext?: LineageReconstructionContext;
    recommendationId?: string;
    tenantId?: string;
    graphVersion?: string;
  },
): LineageReconstructionRequest {
  return Object.freeze({
    recommendationId: input.recommendationId ?? input.ledger.entry.recommendationId,
    tenantId: input.tenantId ?? input.ledger.entry.tenantId,
    reconstructionContext: input.reconstructionContext ?? "FULL",
    lineageReferences: collectLineage(input),
    graphVersion: input.graphVersion ?? input.graph.contract.graphVersion,
  } as LineageReconstructionRequest);
}

export function createLineageReconstructionEvidencePath(
  input: LineageReconstructionInput,
): LineageReconstructionEvidencePath {
  const request = requestCore(input.request);
  return Object.freeze({
    context: request.reconstructionContext,
    evidenceIds: Object.freeze(projectEvidenceIds(request.reconstructionContext, input)),
    evidenceHashes: Object.freeze(collectEvidenceHashes(input)),
    lineageReferences: Object.freeze(
      request.reconstructionContext === "OWNERSHIP"
        ? request.lineageReferences.slice(0, MAX_RECONSTRUCTION_DEPTH)
        : request.lineageReferences,
    ),
  });
}

export function validateLineageReconstruction(input: LineageReconstructionInput): LineageReconstructionValidation {
  const reasons: LineageReconstructionReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createLineageReconstructionEvidencePath(normalizedInput);
  const ancestryChain = buildAncestryChain(normalizedInput, evidencePath);

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const contextValid = validateContext(request, reasons);
  const recommendationValid = validateRecommendation(request, normalizedInput, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageIntegrity = validateLineage(normalizedInput, reasons);
  const ancestryRebuilt = validateAncestryChain(normalizedInput, ancestryChain, reasons);
  const replayable = validateReplayable(normalizedInput, reasons);
  const evidenceHashesValid = validateEvidenceHashes(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const limitsValid = validateLimits(evidencePath, ancestryChain, reasons);

  const valid = sealedArtifacts
    && contextValid
    && recommendationValid
    && identityValid
    && tenantIsolationVerified
    && ownershipValid
    && lineageIntegrity
    && ancestryRebuilt
    && evidenceHashesValid
    && limitsValid
    && !boundary.invalidBoundary;

  return Object.freeze({
    valid,
    reconstructionState: classifyReconstructionState(valid, replayable),
    reasonCodes: normalizeStrings(reasons) as readonly LineageReconstructionReasonCode[],
    lineageIntegrity,
    ancestryRebuilt,
    replayable,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
    ancestryNodeCount: ancestryChain.length,
  });
}

export function buildLineageReconstructionResult(input: LineageReconstructionInput): LineageReconstructionResult {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createLineageReconstructionEvidencePath(normalizedInput);
  const ancestryChain = buildAncestryChain(normalizedInput, evidencePath);
  const validation = validateLineageReconstruction(normalizedInput);

  const lineageHash = hashLineageValue("lineage-reconstruction-lineage", ancestryChain);
  const reconstructionHash = hashLineageValue("lineage-reconstruction-result", {
    recommendationId: request.recommendationId,
    reconstructionState: validation.reconstructionState,
    lineageIntegrity: validation.lineageIntegrity,
    ancestryRebuilt: validation.ancestryRebuilt,
    replayable: validation.replayable,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    lineageHash,
  });

  return Object.freeze({
    recommendationId: request.recommendationId,
    reconstructionState: validation.reconstructionState,
    lineageIntegrity: validation.lineageIntegrity,
    ancestryRebuilt: validation.ancestryRebuilt,
    replayable: validation.replayable,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    reconstructionHash,
    lineageHash,
    deterministic: true,
  });
}

export function buildLineageReconstructionObservability(
  result: LineageReconstructionResult,
): LineageReconstructionObservability {
  return Object.freeze({
    recommendationId: result.recommendationId,
    reconstructionState: result.reconstructionState,
    lineageIntegrity: result.lineageIntegrity,
    ancestryRebuilt: result.ancestryRebuilt,
    reconstructionHash: result.reconstructionHash,
    lineageHash: result.lineageHash,
  });
}

export function sealLineageReconstruction(input: LineageReconstructionInput): SealedLineageReconstructionRecord {
  const request = requestCore(input.request);
  const normalizedInput = { ...input, request };
  const evidencePath = createLineageReconstructionEvidencePath(normalizedInput);
  const ancestryChain = buildAncestryChain(normalizedInput, evidencePath);
  const validation = validateLineageReconstruction(normalizedInput);
  const result = buildLineageReconstructionResult(normalizedInput);
  const observability = buildLineageReconstructionObservability(result);

  return Object.freeze({
    result,
    ancestryChain,
    evidencePath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    reconstructionOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    recommendationGenerationAllowed: false as const,
    authorityMutationAllowed: false as const,
    lineageMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const LineageReconstructionValidator = Object.freeze({
  validate: validateLineageReconstruction,
});

export const LineageReconstructionEngine = Object.freeze({
  buildRequest: buildLineageReconstructionRequest,
  createEvidencePath: createLineageReconstructionEvidencePath,
  buildResult: buildLineageReconstructionResult,
  seal: sealLineageReconstruction,
});

export const LineageReconstructionObservabilityService = Object.freeze({
  build: buildLineageReconstructionObservability,
});
