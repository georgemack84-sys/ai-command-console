import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DecisionGraphNode,
  RecommendationDependencyEdge,
  RecommendationDependencyGraphInput,
  RecommendationDependencyGraphObservability,
  RecommendationDependencyGraphResult,
  RecommendationDependencyGraphValidation,
  RecommendationDependencyReasonCode,
  RecommendationDependencyRequest,
  RecommendationDependencyType,
  SealedRecommendationDependencyGraphRecord,
} from "./types";

export const MAX_DEPENDENCIES_PER_NODE = 50;
export const MAX_GRAPH_DEPTH = 10;

const DEFAULT_DEPENDENCY_TYPE: RecommendationDependencyType = "REQUIRES";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: RecommendationDependencyReasonCode[], reason: RecommendationDependencyReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashDependencyValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function sortEdges(edges: readonly RecommendationDependencyEdge[]): RecommendationDependencyEdge[] {
  return [...edges].sort((a, b) => a.edgeId.localeCompare(b.edgeId));
}

function graphNodeMap(nodes: readonly Readonly<DecisionGraphNode>[]): Map<string, Readonly<DecisionGraphNode>> {
  return new Map(nodes.map((node) => [node.nodeId, node]));
}

function requestCore(
  request: RecommendationDependencyRequest,
): RecommendationDependencyRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    recommendationNodeIds: normalizeStrings(request.recommendationNodeIds),
    dependencyNodeIds: normalizeStrings(request.dependencyNodeIds),
    lineageReferences: normalizeStrings(request.lineageReferences),
  });
}

export function buildRecommendationDependencyRequest(
  input: Omit<RecommendationDependencyGraphInput, "request">,
): RecommendationDependencyRequest {
  return Object.freeze({
    graphId: input.graph.contract.graphId,
    tenantId: input.graph.contract.tenantId,
    recommendationNodeIds: normalizeStrings(
      input.graph.nodes
        .filter((node) => node.nodeType === "RECOMMENDATION")
        .map((node) => node.nodeId),
    ),
    dependencyNodeIds: normalizeStrings(
      input.graph.nodes
        .filter((node) => node.nodeType !== "RECOMMENDATION")
        .map((node) => node.nodeId),
    ),
    lineageReferences: normalizeStrings(input.graph.contract.lineageReferences),
  });
}

function validateGraphSealed(
  input: RecommendationDependencyGraphInput,
  reasons: RecommendationDependencyReasonCode[],
): boolean {
  const valid = input.graph.sealed && input.graph.contract.sealed && input.graph.contract.graphState === "SEALED";
  addReason(reasons, valid ? "SEALED_GRAPH_REQUIRED" : "GRAPH_UNSEALED");
  return valid;
}

function validateGraphIdentity(
  input: RecommendationDependencyGraphInput,
  reasons: RecommendationDependencyReasonCode[],
): boolean {
  const valid = input.request.graphId === input.graph.contract.graphId;
  addReason(reasons, valid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  return valid;
}

function validateNodePresence(
  request: RecommendationDependencyRequest,
  reasons: RecommendationDependencyReasonCode[],
): { recommendationIdsPresent: boolean; dependencyIdsPresent: boolean } {
  const recommendationIdsPresent = normalizeStrings(request.recommendationNodeIds).length > 0;
  const dependencyIdsPresent = normalizeStrings(request.dependencyNodeIds).length > 0;
  addReason(reasons, recommendationIdsPresent ? "RECOMMENDATION_NODE_IDS_PRESENT" : "RECOMMENDATION_NODE_IDS_MISSING");
  addReason(reasons, dependencyIdsPresent ? "DEPENDENCY_NODE_IDS_PRESENT" : "DEPENDENCY_NODE_IDS_MISSING");
  return { recommendationIdsPresent, dependencyIdsPresent };
}

function validateTenantScope(
  input: RecommendationDependencyGraphInput,
  nodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: RecommendationDependencyReasonCode[],
): boolean {
  const recommendationNodes = normalizeStrings(input.request.recommendationNodeIds).map((nodeId) => nodeMap.get(nodeId));
  const dependencyNodes = normalizeStrings(input.request.dependencyNodeIds).map((nodeId) => nodeMap.get(nodeId));
  const crossTenantNodes = [...recommendationNodes, ...dependencyNodes]
    .filter((node): node is Readonly<DecisionGraphNode> => Boolean(node))
    .some((node) => node.tenantId !== input.request.tenantId);
  const valid = input.request.tenantId === input.graph.contract.tenantId && !crossTenantNodes;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_NODES_BLOCKED");
  return valid;
}

function validateRecommendationNodes(
  input: RecommendationDependencyGraphInput,
  nodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: RecommendationDependencyReasonCode[],
): boolean {
  const nodes = normalizeStrings(input.request.recommendationNodeIds).map((nodeId) => nodeMap.get(nodeId));
  const missing = nodes.some((node) => !node);
  const invalidType = nodes
    .filter((node): node is Readonly<DecisionGraphNode> => Boolean(node))
    .some((node) => node.nodeType !== "RECOMMENDATION");
  addReason(reasons, missing ? "RECOMMENDATION_NODE_MISSING" : "RECOMMENDATION_NODES_VALID");
  addReason(reasons, invalidType ? "RECOMMENDATION_NODE_TYPE_INVALID" : "RECOMMENDATION_NODE_TYPE_VALID");
  return !missing && !invalidType;
}

function validateDependencyNodes(
  input: RecommendationDependencyGraphInput,
  nodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: RecommendationDependencyReasonCode[],
): boolean {
  const nodes = normalizeStrings(input.request.dependencyNodeIds).map((nodeId) => nodeMap.get(nodeId));
  const missing = nodes.some((node) => !node);
  const crossTenant = nodes
    .filter((node): node is Readonly<DecisionGraphNode> => Boolean(node))
    .some((node) => node.tenantId !== input.request.tenantId);
  addReason(reasons, missing ? "DEPENDENCY_NODE_MISSING" : "DEPENDENCY_NODES_VALID");
  if (crossTenant) addReason(reasons, "CROSS_TENANT_DEPENDENCIES_BLOCKED");
  return !missing && !crossTenant;
}

function validateLineage(
  input: RecommendationDependencyGraphInput,
  nodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: RecommendationDependencyReasonCode[],
): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const nodeReferences = normalizeStrings([
    ...normalizeStrings(input.request.recommendationNodeIds),
    ...normalizeStrings(input.request.dependencyNodeIds),
  ].flatMap((nodeId) => {
    const node = nodeMap.get(nodeId);
    return node ? [node.lineageReference] : [];
  }));
  const valid = lineageReferences.length > 0
    && input.graph.validation.lineagePreserved
    && nodeReferences.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateDependencyConstraints(
  input: RecommendationDependencyGraphInput,
  reasons: RecommendationDependencyReasonCode[],
): { valid: boolean; graphDepth: number } {
  const recommendationIds = normalizeStrings(input.request.recommendationNodeIds);
  const dependencyIds = normalizeStrings(input.request.dependencyNodeIds);
  const selfDependency = recommendationIds.some((nodeId) => dependencyIds.includes(nodeId));
  const dependencyCountExceeded = dependencyIds.length > MAX_DEPENDENCIES_PER_NODE
    || recommendationIds.some(() => dependencyIds.length > MAX_DEPENDENCIES_PER_NODE);
  const graphDepth = dependencyIds.length;
  const graphDepthExceeded = graphDepth > MAX_GRAPH_DEPTH;
  const dependencyLoopDetected = recommendationIds.length > 1 && dependencyIds.some((dependencyId) => recommendationIds.includes(dependencyId));

  addReason(reasons, selfDependency ? "SELF_DEPENDENCY_DETECTED" : "DEPENDENCY_REFERENCE_VALID");
  if (dependencyLoopDetected) addReason(reasons, "DEPENDENCY_LOOP_DETECTED");
  addReason(reasons, dependencyCountExceeded ? "DEPENDENCY_COUNT_EXCEEDED" : "DEPENDENCY_LIMIT_VALID");
  addReason(reasons, graphDepthExceeded ? "GRAPH_DEPTH_EXCEEDED" : "GRAPH_DEPTH_VALID");

  return {
    valid: !selfDependency && !dependencyLoopDetected && !dependencyCountExceeded && !graphDepthExceeded,
    graphDepth,
  };
}

function validateBoundary(
  input: RecommendationDependencyGraphInput,
  reasons: RecommendationDependencyReasonCode[],
): { executionImpossible: boolean; authorityBounded: boolean } {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.prioritizationRequested !== true && input.authorityExpansionRequested !== true;
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  if (input.workflowRoutingRequested === true) addReason(reasons, "WORKFLOW_ROUTING_DETECTED");
  addReason(reasons, "WORKFLOW_ROUTING_BLOCKED");
  if (input.prioritizationRequested === true) addReason(reasons, "PRIORITIZATION_DETECTED");
  addReason(reasons, "PRIORITIZATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "DEPENDENCY_GRAPH_IS_NOT_RECOMMENDATION_ENGINE");
  return {
    executionImpossible,
    authorityBounded,
  };
}

export function createRecommendationDependencyEdges(
  input: RecommendationDependencyGraphInput,
): readonly Readonly<RecommendationDependencyEdge>[] {
  const request = requestCore(input.request);
  const dependencyType = input.dependencyType ?? DEFAULT_DEPENDENCY_TYPE;
  const edges: RecommendationDependencyEdge[] = [];

  for (const recommendationNodeId of request.recommendationNodeIds) {
    for (const dependencyNodeId of request.dependencyNodeIds) {
      const core = Object.freeze({
        edgeId: hashDependencyValue("recommendation-dependency-edge-id", {
          graphId: request.graphId,
          sourceRecommendationId: recommendationNodeId,
          targetDependencyId: dependencyNodeId,
          dependencyType,
          tenantId: request.tenantId,
        }),
        graphId: request.graphId,
        sourceRecommendationId: recommendationNodeId,
        targetDependencyId: dependencyNodeId,
        dependencyType,
        tenantId: request.tenantId,
      });
      edges.push(Object.freeze({
        ...core,
        immutableHash: hashDependencyValue("recommendation-dependency-edge", core),
      }));
    }
  }

  return Object.freeze(sortEdges(edges));
}

export function validateRecommendationDependencyGraph(
  input: RecommendationDependencyGraphInput,
): RecommendationDependencyGraphValidation {
  const reasons: RecommendationDependencyReasonCode[] = [];
  const nodeMap = graphNodeMap(input.graph.nodes);
  const graphSealed = validateGraphSealed(input, reasons);
  const graphIdentity = validateGraphIdentity(input, reasons);
  const presence = validateNodePresence(input.request, reasons);
  const tenantIsolationVerified = validateTenantScope(input, nodeMap, reasons);
  const recommendationNodesValid = validateRecommendationNodes(input, nodeMap, reasons);
  const dependencyNodesValid = validateDependencyNodes(input, nodeMap, reasons);
  const lineageIntegrity = validateLineage(input, nodeMap, reasons);
  const dependencyConstraints = validateDependencyConstraints(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const dependencyCount = normalizeStrings(input.request.recommendationNodeIds).length
    * normalizeStrings(input.request.dependencyNodeIds).length;
  addReason(reasons, "DEPENDENCY_HASH_GENERATED");

  const valid = graphSealed
    && graphIdentity
    && presence.recommendationIdsPresent
    && presence.dependencyIdsPresent
    && tenantIsolationVerified
    && recommendationNodesValid
    && dependencyNodesValid
    && lineageIntegrity
    && dependencyConstraints.valid
    && boundary.executionImpossible
    && boundary.authorityBounded;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly RecommendationDependencyReasonCode[],
    dependencyCount,
    lineageIntegrity,
    tenantIsolationVerified,
    graphDepth: dependencyConstraints.graphDepth,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
  });
}

export function buildRecommendationDependencyGraphResult(
  input: RecommendationDependencyGraphInput,
): RecommendationDependencyGraphResult {
  const request = requestCore(input.request);
  const validation = validateRecommendationDependencyGraph({
    ...input,
    request,
  });
  const edges = createRecommendationDependencyEdges({
    ...input,
    request,
  });
  const dependencyHash = hashDependencyValue("recommendation-dependency-graph", {
    request,
    dependencyType: input.dependencyType ?? DEFAULT_DEPENDENCY_TYPE,
    edges,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
  });

  return Object.freeze({
    graphId: request.graphId,
    dependencyCount: validation.dependencyCount,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    dependencyHash,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
    sealed: validation.valid,
  });
}

export function buildRecommendationDependencyGraphObservability(
  result: RecommendationDependencyGraphResult,
): RecommendationDependencyGraphObservability {
  return Object.freeze({
    graphId: result.graphId,
    dependencyCount: result.dependencyCount,
    lineageIntegrity: result.lineageIntegrity,
    tenantIsolationVerified: result.tenantIsolationVerified,
    dependencyHash: result.dependencyHash,
    graphState: result.graphState,
  });
}

export function sealRecommendationDependencyGraph(
  input: RecommendationDependencyGraphInput,
): SealedRecommendationDependencyGraphRecord {
  const validation = validateRecommendationDependencyGraph(input);
  const result = buildRecommendationDependencyGraphResult(input);
  const edges = createRecommendationDependencyEdges(input);
  const observability = buildRecommendationDependencyGraphObservability(result);

  return Object.freeze({
    result,
    edges,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    dependencyOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    prioritizationAllowed: false as const,
    recommendationCreationAllowed: false as const,
    authorityMutationAllowed: false as const,
    dependencyMutationAllowed: false as const,
    selfExpansionAllowed: false as const,
  });
}

export const RecommendationDependencyGraphValidator = Object.freeze({
  validate: validateRecommendationDependencyGraph,
});

export const RecommendationDependencyGraph = Object.freeze({
  buildRequest: buildRecommendationDependencyRequest,
  createEdges: createRecommendationDependencyEdges,
  buildResult: buildRecommendationDependencyGraphResult,
  seal: sealRecommendationDependencyGraph,
});

export const RecommendationDependencyGraphObservabilityService = Object.freeze({
  build: buildRecommendationDependencyGraphObservability,
});
