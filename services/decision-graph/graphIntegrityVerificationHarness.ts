import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  GraphIntegrityVerificationInput,
  GraphIntegrityVerificationObservability,
  GraphIntegrityVerificationPath,
  GraphIntegrityVerificationReasonCode,
  GraphIntegrityVerificationRequest,
  GraphIntegrityVerificationResult,
  GraphIntegrityVerificationScope,
  GraphIntegrityVerificationValidation,
  SealedGraphIntegrityVerificationRecord,
} from "./types";

export const MAX_VERIFICATION_DEPTH = 20;
export const MAX_VERIFIED_ARTIFACTS = 5000;

const VERIFICATION_SCOPES: readonly GraphIntegrityVerificationScope[] = Object.freeze([
  "AUTHORITY",
  "FULL",
  "LINEAGE",
  "OWNERSHIP",
  "TOPOLOGY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  failBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: GraphIntegrityVerificationReasonCode[], reason: GraphIntegrityVerificationReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashVerificationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: GraphIntegrityVerificationRequest): GraphIntegrityVerificationRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    verificationScope: request.verificationScope,
    lineageReferences: normalizeStrings(request.lineageReferences),
  });
}

function collectLineage(input: Omit<GraphIntegrityVerificationInput, "request">): string[] {
  return normalizeStrings([
    ...input.graph.contract.lineageReferences,
    ...input.graph.nodes.map((node) => node.lineageReference),
    ...input.proposalGraph.proposalNodes.map((node) => node.lineageReference),
    ...input.governanceGraph.governanceNodes.map((node) => node.lineageReference),
    ...input.escalationGraph.escalationNodes.map((node) => node.lineageReference),
    ...input.inspection.projection.lineageReferences,
  ]);
}

function collectAllArtifactIds(input: GraphIntegrityVerificationInput): string[] {
  return normalizeStrings([
    ...input.graph.nodes.map((node) => node.nodeId),
    ...input.graph.edges.map((edge) => edge.edgeId),
    ...input.dependencyGraph.edges.map((edge) => edge.edgeId),
    ...input.proposalGraph.proposalNodes.map((node) => node.proposalId),
    ...input.proposalGraph.edges.map((edge) => edge.edgeId),
    ...input.governanceGraph.governanceNodes.map((node) => node.governanceId),
    ...input.governanceGraph.edges.map((edge) => edge.edgeId),
    ...input.escalationGraph.escalationNodes.map((node) => node.escalationId),
    ...input.escalationGraph.edges.map((edge) => edge.edgeId),
    ...input.topology.nodes.map((node) => node.nodeHash),
    ...input.topology.edges.map((edge) => edge.edgeHash),
  ]);
}

function collectOwnershipArtifacts(input: GraphIntegrityVerificationInput): string[] {
  return normalizeStrings([
    ...input.graph.nodes.map((node) => node.nodeId),
    ...input.proposalGraph.proposalNodes.map((node) => node.proposalId),
    ...input.governanceGraph.governanceNodes.map((node) => node.governanceId),
    ...input.escalationGraph.escalationNodes.map((node) => node.escalationId),
  ]);
}

function collectAuthorityArtifacts(input: GraphIntegrityVerificationInput): string[] {
  return normalizeStrings([
    ...input.governanceGraph.governanceNodes.map((node) => node.governanceId),
    ...input.escalationGraph.escalationNodes.map((node) => node.escalationId),
    ...input.governanceGraph.edges.map((edge) => edge.edgeId),
    ...input.escalationGraph.edges.map((edge) => edge.edgeId),
  ]);
}

function collectTopologyArtifacts(input: GraphIntegrityVerificationInput): string[] {
  return normalizeStrings([
    ...input.topology.nodes.map((node) => node.nodeHash),
    ...input.topology.edges.map((edge) => edge.edgeHash),
  ]);
}

function projectArtifacts(scope: GraphIntegrityVerificationScope, input: GraphIntegrityVerificationInput): string[] {
  switch (scope) {
    case "OWNERSHIP":
      return collectOwnershipArtifacts(input);
    case "LINEAGE":
      return collectLineage({
        graph: input.graph,
        dependencyGraph: input.dependencyGraph,
        proposalGraph: input.proposalGraph,
        governanceGraph: input.governanceGraph,
        escalationGraph: input.escalationGraph,
        topology: input.topology,
        inspection: input.inspection,
        verificationMutationAttempted: input.verificationMutationAttempted,
        executionRequested: input.executionRequested,
        workflowRoutingRequested: input.workflowRoutingRequested,
        graphOptimizationRequested: input.graphOptimizationRequested,
        authorityExpansionRequested: input.authorityExpansionRequested,
        ownershipMutationRequested: input.ownershipMutationRequested,
      });
    case "TOPOLOGY":
      return collectTopologyArtifacts(input);
    case "AUTHORITY":
      return collectAuthorityArtifacts(input);
    case "FULL":
      return collectAllArtifactIds(input);
  }
}

function collectTopologyNodeHashes(scope: GraphIntegrityVerificationScope, input: GraphIntegrityVerificationInput): string[] {
  return scope === "TOPOLOGY" || scope === "FULL"
    ? normalizeStrings(input.topology.nodes.map((node) => node.nodeHash))
    : [];
}

function collectTopologyEdgeHashes(scope: GraphIntegrityVerificationScope, input: GraphIntegrityVerificationInput): string[] {
  return scope === "TOPOLOGY" || scope === "FULL"
    ? normalizeStrings(input.topology.edges.map((edge) => edge.edgeHash))
    : [];
}

function duplicateFree(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function verifyNoDuplicates(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const candidateSets: readonly string[][] = [
    input.graph.nodes.map((node) => node.nodeId),
    input.graph.edges.map((edge) => edge.edgeId),
    input.dependencyGraph.edges.map((edge) => edge.edgeId),
    input.proposalGraph.proposalNodes.map((node) => node.proposalId),
    input.proposalGraph.edges.map((edge) => edge.edgeId),
    input.governanceGraph.governanceNodes.map((node) => node.governanceId),
    input.governanceGraph.edges.map((edge) => edge.edgeId),
    input.escalationGraph.escalationNodes.map((node) => node.escalationId),
    input.escalationGraph.edges.map((edge) => edge.edgeId),
    input.topology.nodes.map((node) => node.nodeHash),
    input.topology.edges.map((edge) => edge.edgeHash),
  ];
  const valid = candidateSets.every((values) => duplicateFree(values));
  addReason(reasons, valid ? "DUPLICATE_ARTIFACTS_ABSENT" : "DUPLICATE_ARTIFACTS_DETECTED");
  return valid;
}

function validateSealedArtifacts(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const graphSealed = input.graph.sealed && input.graph.contract.sealed;
  const dependencySealed = input.dependencyGraph.sealed && input.dependencyGraph.result.sealed;
  const proposalSealed = input.proposalGraph.sealed && input.proposalGraph.result.sealed;
  const governanceSealed = input.governanceGraph.sealed && input.governanceGraph.result.sealed;
  const escalationSealed = input.escalationGraph.sealed && input.escalationGraph.result.sealed;
  const topologySealed = input.topology.sealed && input.topology.result.sealed;
  const inspectionSealed = input.inspection.sealed;

  addReason(reasons, graphSealed ? "SEALED_GRAPH_REQUIRED" : "GRAPH_UNSEALED");
  addReason(reasons, dependencySealed ? "DEPENDENCY_GRAPH_REQUIRED" : "DEPENDENCY_GRAPH_UNSEALED");
  addReason(reasons, proposalSealed ? "PROPOSAL_GRAPH_REQUIRED" : "PROPOSAL_GRAPH_UNSEALED");
  addReason(reasons, governanceSealed ? "GOVERNANCE_GRAPH_REQUIRED" : "GOVERNANCE_GRAPH_UNSEALED");
  addReason(reasons, escalationSealed ? "ESCALATION_GRAPH_REQUIRED" : "ESCALATION_GRAPH_UNSEALED");
  addReason(reasons, topologySealed ? "TOPOLOGY_REQUIRED" : "TOPOLOGY_UNSEALED");
  addReason(reasons, inspectionSealed ? "INSPECTION_REQUIRED" : "INSPECTION_UNSEALED");

  return graphSealed && dependencySealed && proposalSealed && governanceSealed && escalationSealed && topologySealed && inspectionSealed;
}

function validateScope(request: GraphIntegrityVerificationRequest, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const valid = VERIFICATION_SCOPES.includes(request.verificationScope);
  addReason(reasons, valid ? "VERIFICATION_SCOPE_VALID" : "VERIFICATION_SCOPE_INVALID");
  return valid;
}

function validateIdentity(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const valid = input.request.graphId === input.graph.contract.graphId
    && input.dependencyGraph.result.graphId === input.request.graphId
    && input.proposalGraph.result.graphId === input.request.graphId
    && input.governanceGraph.result.graphId === input.request.graphId
    && input.escalationGraph.result.graphId === input.request.graphId
    && input.topology.result.graphId === input.request.graphId
    && input.inspection.result.graphId === input.request.graphId;
  addReason(reasons, valid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  return valid;
}

function validateTenantScope(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const tenantId = input.request.tenantId;
  const valid = input.graph.contract.tenantId === tenantId
    && input.graph.nodes.every((node) => node.tenantId === tenantId)
    && input.graph.edges.every((edge) => edge.tenantId === tenantId)
    && input.dependencyGraph.edges.every((edge) => edge.tenantId === tenantId)
    && input.proposalGraph.proposalNodes.every((node) => node.tenantId === tenantId)
    && input.proposalGraph.edges.every((edge) => edge.tenantId === tenantId)
    && input.governanceGraph.governanceNodes.every((node) => node.tenantId === tenantId)
    && input.governanceGraph.edges.every((edge) => edge.tenantId === tenantId)
    && input.escalationGraph.escalationNodes.every((node) => node.tenantId === tenantId)
    && input.escalationGraph.edges.every((edge) => edge.tenantId === tenantId)
    && input.topology.nodes.every((node) => node.tenantId === tenantId)
    && input.inspection.result.tenantIsolationVerified;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const graphId = input.request.graphId;
  const tenantId = input.request.tenantId;
  const valid = input.graph.nodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.graph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.dependencyGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.proposalGraph.proposalNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.proposalGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.governanceGraph.governanceNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.governanceGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.escalationGraph.escalationNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.escalationGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.topology.nodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.topology.edges.every((edge) => edge.graphId === graphId)
    && input.inspection.validation.tenantIsolationVerified;
  addReason(reasons, valid ? "OWNERSHIP_EXPLICIT" : "OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const requiredLineage = collectLineage({
    graph: input.graph,
    dependencyGraph: input.dependencyGraph,
    proposalGraph: input.proposalGraph,
    governanceGraph: input.governanceGraph,
    escalationGraph: input.escalationGraph,
    topology: input.topology,
    inspection: input.inspection,
    verificationMutationAttempted: input.verificationMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    graphOptimizationRequested: input.graphOptimizationRequested,
    authorityExpansionRequested: input.authorityExpansionRequested,
    ownershipMutationRequested: input.ownershipMutationRequested,
  });
  const valid = lineageReferences.length > 0
    && input.graph.validation.lineagePreserved
    && input.dependencyGraph.validation.lineageIntegrity
    && input.proposalGraph.validation.lineageIntegrity
    && input.governanceGraph.validation.lineageIntegrity
    && input.escalationGraph.validation.lineageIntegrity
    && input.topology.validation.lineageIntegrity
    && input.inspection.result.lineageIntegrity
    && requiredLineage.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_CORRUPTION_DETECTED");
  return valid;
}

function validateTopology(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const valid = input.topology.validation.valid
    && input.topology.validation.reconstructionComplete
    && input.topology.validation.topologyDeterministic
    && input.topology.result.topologyDeterministic;
  addReason(reasons, valid ? "TOPOLOGY_INTEGRITY_VALID" : "TOPOLOGY_CORRUPTION_DETECTED");
  return valid;
}

function validateReplayDeterminism(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const valid = input.topology.result.topologyDeterministic
    && input.topology.validation.topologyDeterministic
    && input.inspection.result.topologyDeterministic
    && input.inspection.validation.topologyDeterministic;
  addReason(reasons, valid ? "REPLAY_DETERMINISM_VERIFIED" : "REPLAY_DETERMINISM_FAILURE");
  return valid;
}

function validateBoundary(input: GraphIntegrityVerificationInput, reasons: GraphIntegrityVerificationReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true
    && input.graph.validation.authorityBounded
    && input.dependencyGraph.validation.authorityBounded
    && input.proposalGraph.validation.authorityBounded
    && input.governanceGraph.validation.authorityBounded
    && input.escalationGraph.validation.authorityBounded
    && input.topology.validation.authorityBounded
    && input.inspection.validation.authorityBounded;
  const failBoundary = input.verificationMutationAttempted === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.graphOptimizationRequested === true
    || input.authorityExpansionRequested === true
    || input.ownershipMutationRequested === true;

  addReason(reasons, input.verificationMutationAttempted === true ? "VERIFICATION_ATTEMPTS_MUTATION" : "VERIFICATION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.graphOptimizationRequested === true ? "GRAPH_OPTIMIZATION_DETECTED" : "GRAPH_OPTIMIZATION_BLOCKED");
  addReason(reasons, input.ownershipMutationRequested === true ? "OWNERSHIP_MUTATION_DETECTED" : "OWNERSHIP_MUTATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "GRAPH_VERIFICATION_IS_NOT_REPAIR");

  return Object.freeze({
    executionImpossible,
    authorityBounded,
    failBoundary,
  });
}

function validateLimits(path: GraphIntegrityVerificationPath, reasons: GraphIntegrityVerificationReasonCode[]): boolean {
  const depthValid = path.lineageReferences.length <= MAX_VERIFICATION_DEPTH;
  const artifactCount = path.artifactIds.length + path.topologyNodeHashes.length + path.topologyEdgeHashes.length;
  const artifactValid = artifactCount <= MAX_VERIFIED_ARTIFACTS;
  addReason(reasons, depthValid ? "VERIFICATION_DEPTH_VALID" : "VERIFICATION_DEPTH_EXCEEDED");
  addReason(reasons, artifactValid ? "VERIFIED_ARTIFACT_LIMIT_VALID" : "VERIFIED_ARTIFACT_LIMIT_EXCEEDED");
  return depthValid && artifactValid;
}

export function buildGraphIntegrityVerificationRequest(
  input: Omit<GraphIntegrityVerificationInput, "request"> & { verificationScope?: GraphIntegrityVerificationScope },
): GraphIntegrityVerificationRequest {
  return Object.freeze({
    graphId: input.graph.contract.graphId,
    tenantId: input.graph.contract.tenantId,
    verificationScope: input.verificationScope ?? "FULL",
    lineageReferences: collectLineage(input),
  });
}

export function createGraphIntegrityVerificationPath(input: GraphIntegrityVerificationInput): GraphIntegrityVerificationPath {
  const request = requestCore(input.request);
  return Object.freeze({
    scope: request.verificationScope,
    artifactIds: Object.freeze(projectArtifacts(request.verificationScope, input)),
    lineageReferences: Object.freeze(
      request.verificationScope === "OWNERSHIP" || request.verificationScope === "AUTHORITY"
        ? request.lineageReferences.slice(0, MAX_VERIFICATION_DEPTH)
        : request.lineageReferences,
    ),
    topologyNodeHashes: Object.freeze(collectTopologyNodeHashes(request.verificationScope, input)),
    topologyEdgeHashes: Object.freeze(collectTopologyEdgeHashes(request.verificationScope, input)),
  });
}

export function validateGraphIntegrityVerification(
  input: GraphIntegrityVerificationInput,
): GraphIntegrityVerificationValidation {
  const reasons: GraphIntegrityVerificationReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipIntegrity = validateOwnership(normalizedInput, reasons);
  const lineageIntegrity = validateLineage(normalizedInput, reasons);
  const topologyIntegrity = validateTopology(normalizedInput, reasons);
  const duplicateFree = verifyNoDuplicates(normalizedInput, reasons);
  const deterministicReplayVerified = validateReplayDeterminism(normalizedInput, reasons);
  const boundary = validateBoundary(normalizedInput, reasons);
  const verificationPath = createGraphIntegrityVerificationPath(normalizedInput);
  const limitsValid = validateLimits(verificationPath, reasons);

  const fail = !sealedArtifacts
    || !scopeValid
    || !identityValid
    || !tenantIsolationVerified
    || !ownershipIntegrity
    || !lineageIntegrity
    || !topologyIntegrity
    || !duplicateFree
    || !limitsValid
    || !boundary.authorityBounded
    || boundary.failBoundary;
  const escalated = !fail && !deterministicReplayVerified;
  const validationState: GraphIntegrityVerificationValidation["validationState"] = fail
    ? "FAIL"
    : escalated
      ? "ESCALATED"
      : request.verificationScope === "FULL"
        ? "PASS"
        : "LIMITED";

  return Object.freeze({
    valid: validationState === "PASS" || validationState === "LIMITED",
    validationState,
    reasonCodes: normalizeStrings(reasons) as readonly GraphIntegrityVerificationReasonCode[],
    ownershipIntegrity,
    lineageIntegrity,
    topologyIntegrity,
    authorityBounded: boundary.authorityBounded,
    tenantIsolationVerified,
    deterministicReplayVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    controlSurfaceAbsent: true as const,
    verifiedArtifactCount:
      verificationPath.artifactIds.length
      + verificationPath.topologyNodeHashes.length
      + verificationPath.topologyEdgeHashes.length,
  });
}

export function buildGraphIntegrityVerificationResult(
  input: GraphIntegrityVerificationInput,
): GraphIntegrityVerificationResult {
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };
  const validation = validateGraphIntegrityVerification(normalizedInput);
  const verificationPath = createGraphIntegrityVerificationPath(normalizedInput);
  const verificationHash = hashVerificationValue("graph-integrity-verification-harness", {
    request,
    verificationPath,
    verificationStatus: validation.validationState,
    ownershipIntegrity: validation.ownershipIntegrity,
    lineageIntegrity: validation.lineageIntegrity,
    topologyIntegrity: validation.topologyIntegrity,
    authorityBounded: validation.authorityBounded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    deterministicReplayVerified: validation.deterministicReplayVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    verificationStatus: validation.validationState,
    ownershipIntegrity: validation.ownershipIntegrity,
    lineageIntegrity: validation.lineageIntegrity,
    topologyIntegrity: validation.topologyIntegrity,
    authorityBounded: validation.authorityBounded,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    deterministicReplayVerified: validation.deterministicReplayVerified,
    verificationHash,
  });
}

export function buildGraphIntegrityVerificationObservability(
  result: GraphIntegrityVerificationResult,
): GraphIntegrityVerificationObservability {
  return Object.freeze({
    graphId: result.graphId,
    verificationStatus: result.verificationStatus,
    ownershipIntegrity: result.ownershipIntegrity,
    lineageIntegrity: result.lineageIntegrity,
    topologyIntegrity: result.topologyIntegrity,
    verificationHash: result.verificationHash,
  });
}

export function sealGraphIntegrityVerification(
  input: GraphIntegrityVerificationInput,
): SealedGraphIntegrityVerificationRecord {
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };
  const verificationPath = createGraphIntegrityVerificationPath(normalizedInput);
  const validation = validateGraphIntegrityVerification(normalizedInput);
  const result = buildGraphIntegrityVerificationResult(normalizedInput);
  const observability = buildGraphIntegrityVerificationObservability(result);

  return Object.freeze({
    result,
    verificationPath,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    verificationOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    graphMutationAllowed: false as const,
    graphOptimizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    ownershipMutationAllowed: false as const,
    repairAuthorized: false as const,
    controlSurfacePresent: false as const,
  });
}

export const GraphIntegrityVerificationValidator = Object.freeze({
  validate: validateGraphIntegrityVerification,
});

export const GraphIntegrityVerificationHarness = Object.freeze({
  buildRequest: buildGraphIntegrityVerificationRequest,
  createPath: createGraphIntegrityVerificationPath,
  buildResult: buildGraphIntegrityVerificationResult,
  seal: sealGraphIntegrityVerification,
});

export const GraphIntegrityVerificationObservabilityService = Object.freeze({
  build: buildGraphIntegrityVerificationObservability,
});
