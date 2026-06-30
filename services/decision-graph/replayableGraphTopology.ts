import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  ReplayableGraphTopologyInput,
  ReplayableGraphTopologyObservability,
  ReplayableGraphTopologyReasonCode,
  ReplayableGraphTopologyRequest,
  ReplayableGraphTopologyResult,
  ReplayableGraphTopologyValidation,
  ReplayableTopologyEdge,
  ReplayableTopologyNode,
  SealedReplayableGraphTopologyRecord,
} from "./types";

export const MAX_TOPOLOGY_NODES = 1000;
export const MAX_TOPOLOGY_EDGES = 5000;
export const MAX_TOPOLOGY_DEPTH = 20;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: ReplayableGraphTopologyReasonCode[], reason: ReplayableGraphTopologyReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashTopologyValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: ReplayableGraphTopologyRequest): ReplayableGraphTopologyRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    nodeHashes: normalizeStrings(request.nodeHashes),
    edgeHashes: normalizeStrings(request.edgeHashes),
    lineageReferences: normalizeStrings(request.lineageReferences),
    topologyVersion: request.topologyVersion,
  });
}

function collectExpectedNodeHashes(input: ReplayableGraphTopologyInput): string[] {
  return normalizeStrings([
    ...input.graph.nodes.map((node) => node.immutableHash),
    ...input.proposalGraph.proposalNodes.map((node) => node.immutableHash),
    ...input.governanceGraph.governanceNodes.map((node) => node.immutableHash),
    ...input.escalationGraph.escalationNodes.map((node) => node.immutableHash),
  ]);
}

function collectExpectedEdgeHashes(input: ReplayableGraphTopologyInput): string[] {
  return normalizeStrings([
    ...input.graph.edges.map((edge) => edge.immutableHash),
    ...input.dependencyGraph.edges.map((edge) => edge.immutableHash),
    ...input.proposalGraph.edges.map((edge) => edge.immutableHash),
    ...input.governanceGraph.edges.map((edge) => edge.immutableHash),
    ...input.escalationGraph.edges.map((edge) => edge.immutableHash),
  ]);
}

function collectLineage(input: ReplayableGraphTopologyInput): string[] {
  return normalizeStrings([
    ...input.graph.contract.lineageReferences,
    ...input.proposalGraph.proposalNodes.map((node) => node.lineageReference),
    ...input.governanceGraph.governanceNodes.map((node) => node.lineageReference),
    ...input.escalationGraph.escalationNodes.map((node) => node.lineageReference),
    ...input.graph.nodes.map((node) => node.lineageReference),
  ]);
}

export function buildReplayableGraphTopologyRequest(
  input: Omit<ReplayableGraphTopologyInput, "request">,
): ReplayableGraphTopologyRequest {
  return Object.freeze({
    graphId: input.graph.contract.graphId,
    tenantId: input.graph.contract.tenantId,
    nodeHashes: collectExpectedNodeHashes({
      ...input,
      request: {} as ReplayableGraphTopologyRequest,
    }),
    edgeHashes: collectExpectedEdgeHashes({
      ...input,
      request: {} as ReplayableGraphTopologyRequest,
    }),
    lineageReferences: collectLineage({
      ...input,
      request: {} as ReplayableGraphTopologyRequest,
    }),
    topologyVersion: "replayable-graph-topology/v1",
  });
}

function validateSealedArtifacts(input: ReplayableGraphTopologyInput, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const valid = input.graph.sealed
    && input.graph.contract.sealed
    && input.dependencyGraph.sealed
    && input.dependencyGraph.result.sealed
    && input.proposalGraph.sealed
    && input.proposalGraph.result.sealed
    && input.governanceGraph.sealed
    && input.governanceGraph.result.sealed
    && input.escalationGraph.sealed
    && input.escalationGraph.result.sealed;
  addReason(reasons, valid ? "SEALED_GRAPH_REQUIRED" : "GRAPH_UNSEALED");
  addReason(reasons, input.dependencyGraph.sealed && input.dependencyGraph.result.sealed ? "DEPENDENCY_GRAPH_REQUIRED" : "DEPENDENCY_GRAPH_UNSEALED");
  addReason(reasons, input.proposalGraph.sealed && input.proposalGraph.result.sealed ? "PROPOSAL_GRAPH_REQUIRED" : "PROPOSAL_GRAPH_UNSEALED");
  addReason(reasons, input.governanceGraph.sealed && input.governanceGraph.result.sealed ? "GOVERNANCE_GRAPH_REQUIRED" : "GOVERNANCE_GRAPH_UNSEALED");
  addReason(reasons, input.escalationGraph.sealed && input.escalationGraph.result.sealed ? "ESCALATION_GRAPH_REQUIRED" : "ESCALATION_GRAPH_UNSEALED");
  return valid;
}

function validateIdentity(input: ReplayableGraphTopologyInput, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const valid = input.request.graphId === input.graph.contract.graphId
    && input.dependencyGraph.result.graphId === input.request.graphId
    && input.proposalGraph.result.graphId === input.request.graphId
    && input.governanceGraph.result.graphId === input.request.graphId
    && input.escalationGraph.result.graphId === input.request.graphId;
  addReason(reasons, valid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  return valid;
}

function validateTenantScope(input: ReplayableGraphTopologyInput, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const valid = input.request.tenantId === input.graph.contract.tenantId
    && input.graph.nodes.every((node) => node.tenantId === input.request.tenantId)
    && input.proposalGraph.proposalNodes.every((node) => node.tenantId === input.request.tenantId)
    && input.governanceGraph.governanceNodes.every((node) => node.tenantId === input.request.tenantId)
    && input.escalationGraph.escalationNodes.every((node) => node.tenantId === input.request.tenantId);
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_NODES_BLOCKED");
  return valid;
}

function validatePresence(request: ReplayableGraphTopologyRequest, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const nodesPresent = normalizeStrings(request.nodeHashes).length > 0;
  const edgesPresent = normalizeStrings(request.edgeHashes).length > 0;
  addReason(reasons, nodesPresent ? "NODE_HASHES_PRESENT" : "NODE_HASHES_MISSING");
  addReason(reasons, edgesPresent ? "EDGE_HASHES_PRESENT" : "EDGE_HASHES_MISSING");
  return nodesPresent && edgesPresent;
}

function validateUniqueness(request: ReplayableGraphTopologyRequest, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const nodeHashes = request.nodeHashes.filter((hash) => hash.length > 0);
  const edgeHashes = request.edgeHashes.filter((hash) => hash.length > 0);
  const uniqueNodes = new Set(nodeHashes).size === nodeHashes.length;
  const uniqueEdges = new Set(edgeHashes).size === edgeHashes.length;
  addReason(reasons, uniqueNodes ? "NODE_HASHES_UNIQUE" : "DUPLICATE_NODE_HASHES");
  addReason(reasons, uniqueEdges ? "EDGE_HASHES_UNIQUE" : "DUPLICATE_EDGE_HASHES");
  return uniqueNodes && uniqueEdges;
}

function validateCompleteness(input: ReplayableGraphTopologyInput, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const expectedNodes = collectExpectedNodeHashes(input);
  const expectedEdges = collectExpectedEdgeHashes(input);
  const actualNodes = normalizeStrings(input.request.nodeHashes);
  const actualEdges = normalizeStrings(input.request.edgeHashes);
  const complete = expectedNodes.length === actualNodes.length
    && expectedEdges.length === actualEdges.length
    && expectedNodes.every((hash, index) => hash === actualNodes[index])
    && expectedEdges.every((hash, index) => hash === actualEdges[index]);
  addReason(reasons, complete ? "RECONSTRUCTION_INPUTS_COMPLETE" : "RECONSTRUCTION_INPUTS_INCOMPLETE");
  return complete;
}

function validateOrdering(request: ReplayableGraphTopologyRequest, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const nodeOrderingValid = JSON.stringify(request.nodeHashes) === JSON.stringify(normalizeStrings(request.nodeHashes));
  const edgeOrderingValid = JSON.stringify(request.edgeHashes) === JSON.stringify(normalizeStrings(request.edgeHashes));
  const valid = nodeOrderingValid && edgeOrderingValid;
  addReason(reasons, valid ? "TOPOLOGY_ORDERING_CONSISTENT" : "TOPOLOGY_ORDERING_INCONSISTENT");
  return valid;
}

function validateMutation(input: ReplayableGraphTopologyInput, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const valid = input.topologyMutationDetected !== true;
  addReason(reasons, valid ? "TOPOLOGY_MUTATION_BLOCKED" : "TOPOLOGY_MUTATION_DETECTED");
  return valid;
}

function validateLineage(input: ReplayableGraphTopologyInput, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = collectLineage(input);
  const valid = lineageReferences.length > 0
    && input.graph.validation.lineagePreserved
    && input.dependencyGraph.validation.lineageIntegrity
    && input.proposalGraph.validation.lineageIntegrity
    && input.governanceGraph.validation.lineageIntegrity
    && input.escalationGraph.validation.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateLimits(input: ReplayableGraphTopologyInput, reasons: ReplayableGraphTopologyReasonCode[]): boolean {
  const nodeCountValid = input.request.nodeHashes.length <= MAX_TOPOLOGY_NODES;
  const edgeCountValid = input.request.edgeHashes.length <= MAX_TOPOLOGY_EDGES;
  const depthValid = input.request.edgeHashes.length <= MAX_TOPOLOGY_DEPTH;
  addReason(reasons, nodeCountValid ? "NODE_LIMIT_VALID" : "TOPOLOGY_NODE_LIMIT_EXCEEDED");
  addReason(reasons, edgeCountValid ? "EDGE_LIMIT_VALID" : "TOPOLOGY_EDGE_LIMIT_EXCEEDED");
  addReason(reasons, depthValid ? "DEPTH_VALID" : "TOPOLOGY_DEPTH_EXCEEDED");
  return nodeCountValid && edgeCountValid && depthValid;
}

function validateBoundary(input: ReplayableGraphTopologyInput, reasons: ReplayableGraphTopologyReasonCode[]): { executionImpossible: boolean; authorityBounded: boolean } {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true;
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  if (input.workflowRoutingRequested === true) addReason(reasons, "WORKFLOW_ROUTING_DETECTED");
  addReason(reasons, "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "REPLAYABLE_TOPOLOGY_IS_NOT_EXECUTION");
  return { executionImpossible, authorityBounded };
}

export function createReplayableTopologyNodes(
  input: ReplayableGraphTopologyInput,
): readonly Readonly<ReplayableTopologyNode>[] {
  const nodeTypeByHash = new Map<string, string>();
  for (const node of input.graph.nodes) nodeTypeByHash.set(node.immutableHash, node.nodeType);
  for (const node of input.proposalGraph.proposalNodes) nodeTypeByHash.set(node.immutableHash, node.proposalType);
  for (const node of input.governanceGraph.governanceNodes) nodeTypeByHash.set(node.immutableHash, node.governanceType);
  for (const node of input.escalationGraph.escalationNodes) nodeTypeByHash.set(node.immutableHash, node.escalationType);

  const request = requestCore(input.request);
  return Object.freeze(request.nodeHashes.map((nodeHash, index) => Object.freeze({
    nodeHash,
    nodeType: nodeTypeByHash.get(nodeHash) ?? "UNKNOWN",
    graphId: request.graphId,
    tenantId: request.tenantId,
    topologyOrder: index,
  })));
}

export function createReplayableTopologyEdges(
  input: ReplayableGraphTopologyInput,
): readonly Readonly<ReplayableTopologyEdge>[] {
  const request = requestCore(input.request);
  const nodeHashes = request.nodeHashes;
  return Object.freeze(request.edgeHashes.map((edgeHash, index) => Object.freeze({
    edgeHash,
    sourceHash: nodeHashes[index % Math.max(nodeHashes.length, 1)] ?? "",
    targetHash: nodeHashes[(index + 1) % Math.max(nodeHashes.length, 1)] ?? "",
    graphId: request.graphId,
    topologyOrder: index,
  })));
}

export function validateReplayableGraphTopology(input: ReplayableGraphTopologyInput): ReplayableGraphTopologyValidation {
  const reasons: ReplayableGraphTopologyReasonCode[] = [];
  const sealedArtifacts = validateSealedArtifacts(input, reasons);
  const identityValid = validateIdentity(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, reasons);
  const presenceValid = validatePresence(input.request, reasons);
  const uniquenessValid = validateUniqueness(input.request, reasons);
  const completenessValid = validateCompleteness(input, reasons);
  const orderingValid = validateOrdering(input.request, reasons);
  const mutationValid = validateMutation(input, reasons);
  const lineageIntegrity = validateLineage(input, reasons);
  const limitsValid = validateLimits(input, reasons);
  const boundary = validateBoundary(input, reasons);
  addReason(reasons, "RECONSTRUCTION_HASH_GENERATED");
  addReason(reasons, "TOPOLOGY_HASH_GENERATED");

  const valid = sealedArtifacts
    && identityValid
    && tenantIsolationVerified
    && presenceValid
    && uniquenessValid
    && completenessValid
    && orderingValid
    && mutationValid
    && lineageIntegrity
    && limitsValid
    && boundary.executionImpossible
    && boundary.authorityBounded;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly ReplayableGraphTopologyReasonCode[],
    lineageIntegrity,
    tenantIsolationVerified,
    topologyDeterministic: orderingValid && uniquenessValid && completenessValid,
    reconstructionComplete: completenessValid,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
  });
}

export function buildReplayableGraphTopologyResult(input: ReplayableGraphTopologyInput): ReplayableGraphTopologyResult {
  const request = requestCore(input.request);
  const validation = validateReplayableGraphTopology({
    ...input,
    request,
  });
  const nodes = createReplayableTopologyNodes({
    ...input,
    request,
  });
  const edges = createReplayableTopologyEdges({
    ...input,
    request,
  });
  const reconstructionHash = hashTopologyValue("replayable-graph-topology-reconstruction", {
    graphId: request.graphId,
    nodeHashes: request.nodeHashes,
    edgeHashes: request.edgeHashes,
    topologyVersion: request.topologyVersion,
  });
  const topologyHash = hashTopologyValue("replayable-graph-topology", {
    request,
    nodes,
    edges,
    reconstructionHash,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
  });

  return Object.freeze({
    graphId: request.graphId,
    topologyHash,
    reconstructionHash,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    topologyDeterministic: validation.topologyDeterministic,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
    sealed: validation.valid,
  });
}

export function buildReplayableGraphTopologyObservability(
  result: ReplayableGraphTopologyResult,
): ReplayableGraphTopologyObservability {
  return Object.freeze({
    graphId: result.graphId,
    topologyHash: result.topologyHash,
    reconstructionHash: result.reconstructionHash,
    topologyDeterministic: result.topologyDeterministic,
    lineageIntegrity: result.lineageIntegrity,
  });
}

export function sealReplayableGraphTopology(input: ReplayableGraphTopologyInput): SealedReplayableGraphTopologyRecord {
  const validation = validateReplayableGraphTopology(input);
  const result = buildReplayableGraphTopologyResult(input);
  const nodes = createReplayableTopologyNodes(input);
  const edges = createReplayableTopologyEdges(input);
  const observability = buildReplayableGraphTopologyObservability(result);

  return Object.freeze({
    result,
    nodes,
    edges,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    topologyOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    topologyMutationAllowed: false as const,
    authorityMutationAllowed: false as const,
    graphOptimizationAllowed: false as const,
    selfExpansionAllowed: false as const,
  });
}

export const ReplayableGraphTopologyValidator = Object.freeze({
  validate: validateReplayableGraphTopology,
});

export const ReplayableGraphTopology = Object.freeze({
  buildRequest: buildReplayableGraphTopologyRequest,
  createNodes: createReplayableTopologyNodes,
  createEdges: createReplayableTopologyEdges,
  buildResult: buildReplayableGraphTopologyResult,
  seal: sealReplayableGraphTopology,
});

export const ReplayableGraphTopologyObservabilityService = Object.freeze({
  build: buildReplayableGraphTopologyObservability,
});
