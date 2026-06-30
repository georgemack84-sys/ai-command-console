import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DecisionGraphNode,
  GovernanceInfluenceEdge,
  GovernanceInfluenceGraphInput,
  GovernanceInfluenceGraphObservability,
  GovernanceInfluenceGraphResult,
  GovernanceInfluenceGraphValidation,
  GovernanceInfluenceReasonCode,
  GovernanceInfluenceRequest,
  GovernanceInfluenceType,
  GovernanceNode,
  GovernanceNodeInput,
  SealedGovernanceInfluenceGraphRecord,
} from "./types";

export const MAX_INFLUENCE_EDGES_PER_NODE = 50;
export const MAX_GOVERNANCE_DEPTH = 10;

const GOVERNANCE_TYPES = new Set<GovernanceNode["governanceType"]>([
  "POLICY",
  "CONSTRAINT",
  "APPROVAL_REFERENCE",
  "ESCALATION_RULE",
  "BOUNDARY",
]);

const DEFAULT_INFLUENCE_TYPE: GovernanceInfluenceType = "CONSTRAINS";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: GovernanceInfluenceReasonCode[], reason: GovernanceInfluenceReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashInfluenceValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function sortInfluenceEdges(edges: readonly GovernanceInfluenceEdge[]): GovernanceInfluenceEdge[] {
  return [...edges].sort((a, b) => a.edgeId.localeCompare(b.edgeId));
}

function sortGovernanceNodeInputs(nodes: readonly GovernanceNodeInput[]): GovernanceNodeInput[] {
  return [...nodes].sort((a, b) => a.governanceId.localeCompare(b.governanceId));
}

function graphNodeMap(nodes: readonly Readonly<DecisionGraphNode>[]): Map<string, Readonly<DecisionGraphNode>> {
  return new Map(nodes.map((node) => [node.nodeId, node]));
}

function governanceNodeMap(nodes: readonly Readonly<GovernanceNode>[]): Map<string, Readonly<GovernanceNode>> {
  return new Map(nodes.map((node) => [node.governanceId, node]));
}

function requestCore(request: GovernanceInfluenceRequest): GovernanceInfluenceRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    governanceNodeIds: normalizeStrings(request.governanceNodeIds),
    influencedNodeIds: normalizeStrings(request.influencedNodeIds),
    lineageReferences: normalizeStrings(request.lineageReferences),
  });
}

function normalizeGovernanceNodeInput(node: GovernanceNodeInput): GovernanceNodeInput {
  return Object.freeze({
    governanceId: node.governanceId,
    graphId: node.graphId,
    tenantId: node.tenantId,
    governanceType: node.governanceType,
    lineageReference: node.lineageReference,
  });
}

function buildGovernanceNode(node: GovernanceNodeInput): GovernanceNode {
  const normalized = normalizeGovernanceNodeInput(node);
  return Object.freeze({
    ...normalized,
    immutableHash: hashInfluenceValue("governance-influence-node", normalized),
  });
}

export function createGovernanceNodes(
  nodes: readonly GovernanceNodeInput[],
): readonly Readonly<GovernanceNode>[] {
  return Object.freeze(sortGovernanceNodeInputs(nodes).map(buildGovernanceNode));
}

export function buildGovernanceInfluenceRequest(
  input: Omit<GovernanceInfluenceGraphInput, "request">,
): GovernanceInfluenceRequest {
  return Object.freeze({
    graphId: input.graph.contract.graphId,
    tenantId: input.graph.contract.tenantId,
    governanceNodeIds: normalizeStrings(input.governanceNodes.map((node) => node.governanceId)),
    influencedNodeIds: normalizeStrings(input.graph.nodes.map((node) => node.nodeId)),
    lineageReferences: normalizeStrings([
      ...input.graph.contract.lineageReferences,
      ...input.governanceNodes.map((node) => node.lineageReference),
    ]),
  });
}

function validateGraphSealed(
  input: GovernanceInfluenceGraphInput,
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const valid = input.graph.sealed && input.graph.contract.sealed && input.graph.contract.graphState === "SEALED";
  addReason(reasons, valid ? "SEALED_GRAPH_REQUIRED" : "GRAPH_UNSEALED");
  return valid;
}

function validateDependencyGraphSealed(
  input: GovernanceInfluenceGraphInput,
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const valid = input.dependencyGraph.sealed && input.dependencyGraph.result.sealed;
  addReason(reasons, valid ? "DEPENDENCY_GRAPH_REQUIRED" : "DEPENDENCY_GRAPH_UNSEALED");
  return valid;
}

function validateProposalGraphSealed(
  input: GovernanceInfluenceGraphInput,
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const valid = input.proposalGraph.sealed && input.proposalGraph.result.sealed;
  addReason(reasons, valid ? "PROPOSAL_GRAPH_REQUIRED" : "PROPOSAL_GRAPH_UNSEALED");
  return valid;
}

function validateGraphIdentity(
  input: GovernanceInfluenceGraphInput,
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const valid = input.request.graphId === input.graph.contract.graphId
    && input.dependencyGraph.result.graphId === input.request.graphId
    && input.proposalGraph.result.graphId === input.request.graphId;
  addReason(reasons, valid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  return valid;
}

function validatePresence(
  request: GovernanceInfluenceRequest,
  reasons: GovernanceInfluenceReasonCode[],
): { governancePresent: boolean; influencedPresent: boolean } {
  const governancePresent = normalizeStrings(request.governanceNodeIds).length > 0;
  const influencedPresent = normalizeStrings(request.influencedNodeIds).length > 0;
  addReason(reasons, governancePresent ? "GOVERNANCE_NODE_IDS_PRESENT" : "GOVERNANCE_NODE_IDS_MISSING");
  addReason(reasons, influencedPresent ? "INFLUENCED_NODE_IDS_PRESENT" : "INFLUENCED_NODE_IDS_MISSING");
  return { governancePresent, influencedPresent };
}

function validateGovernanceNodeInputs(
  input: GovernanceInfluenceGraphInput,
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const governanceNodes = createGovernanceNodes(input.governanceNodes);
  const valid = governanceNodes.every((node) => (
    node.graphId === input.request.graphId
    && node.tenantId === input.request.tenantId
    && node.lineageReference.length > 0
    && GOVERNANCE_TYPES.has(node.governanceType)
  ));
  addReason(reasons, valid ? "GOVERNANCE_TYPE_VALID" : "GOVERNANCE_TYPE_INVALID");
  return valid;
}

function validateTenantScope(
  input: GovernanceInfluenceGraphInput,
  influencedNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  governanceNodes: readonly Readonly<GovernanceNode>[],
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const crossTenantGovernance = governanceNodes.some((node) => node.tenantId !== input.request.tenantId);
  const crossTenantInfluence = normalizeStrings(input.request.influencedNodeIds)
    .map((nodeId) => influencedNodeMap.get(nodeId))
    .filter((node): node is Readonly<DecisionGraphNode> => Boolean(node))
    .some((node) => node.tenantId !== input.request.tenantId);
  const valid = input.request.tenantId === input.graph.contract.tenantId
    && !crossTenantGovernance
    && !crossTenantInfluence;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : crossTenantInfluence ? "CROSS_TENANT_INFLUENCE_BLOCKED" : "CROSS_TENANT_NODES_BLOCKED");
  return valid;
}

function validateGovernanceReferences(
  input: GovernanceInfluenceGraphInput,
  governanceNodes: readonly Readonly<GovernanceNode>[],
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const governanceMap = governanceNodeMap(governanceNodes);
  const missing = normalizeStrings(input.request.governanceNodeIds).some((governanceId) => !governanceMap.has(governanceId));
  addReason(reasons, missing ? "GOVERNANCE_ARTIFACT_MISSING" : "GOVERNANCE_NODES_VALID");
  return !missing;
}

function validateInfluencedReferences(
  input: GovernanceInfluenceGraphInput,
  influencedNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const unknown = normalizeStrings(input.request.influencedNodeIds)
    .some((nodeId) => !influencedNodeMap.has(nodeId));
  addReason(reasons, unknown ? "INFLUENCED_NODE_MISSING" : "INFLUENCED_NODES_VALID");
  if (unknown) addReason(reasons, "INFLUENCE_TARGET_UNKNOWN_NODE");
  return !unknown;
}

function validateLineage(
  input: GovernanceInfluenceGraphInput,
  governanceNodes: readonly Readonly<GovernanceNode>[],
  influencedNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: GovernanceInfluenceReasonCode[],
): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = normalizeStrings([
    ...governanceNodes.map((node) => node.lineageReference),
    ...normalizeStrings(input.request.influencedNodeIds).flatMap((nodeId) => {
      const node = influencedNodeMap.get(nodeId);
      return node ? [node.lineageReference] : [];
    }),
  ]);
  const valid = lineageReferences.length > 0
    && input.graph.validation.lineagePreserved
    && input.dependencyGraph.validation.lineageIntegrity
    && input.proposalGraph.validation.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateInfluenceConstraints(
  input: GovernanceInfluenceGraphInput,
  reasons: GovernanceInfluenceReasonCode[],
): { valid: boolean; governanceDepth: number } {
  const governanceIds = normalizeStrings(input.request.governanceNodeIds);
  const influencedIds = normalizeStrings(input.request.influencedNodeIds);
  const selfInfluence = governanceIds.some((governanceId) => influencedIds.includes(governanceId));
  const influenceCountExceeded = influencedIds.length > MAX_INFLUENCE_EDGES_PER_NODE
    || governanceIds.some(() => influencedIds.length > MAX_INFLUENCE_EDGES_PER_NODE);
  const governanceDepth = influencedIds.length;
  const governanceDepthExceeded = governanceDepth > MAX_GOVERNANCE_DEPTH;

  addReason(reasons, selfInfluence ? "SELF_INFLUENCE_DETECTED" : "INFLUENCE_REFERENCE_VALID");
  addReason(reasons, influenceCountExceeded ? "INFLUENCE_COUNT_EXCEEDED" : "INFLUENCE_LIMIT_VALID");
  addReason(reasons, governanceDepthExceeded ? "GOVERNANCE_DEPTH_EXCEEDED" : "GOVERNANCE_DEPTH_VALID");

  return {
    valid: !selfInfluence && !influenceCountExceeded && !governanceDepthExceeded,
    governanceDepth,
  };
}

function validateBoundary(
  input: GovernanceInfluenceGraphInput,
  reasons: GovernanceInfluenceReasonCode[],
): { executionImpossible: boolean; authorityBounded: boolean; governanceBounded: boolean } {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true;
  const governanceBounded = input.governanceCreatesAuthority !== true && input.policyMutationRequested !== true;
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  if (input.workflowRoutingRequested === true) addReason(reasons, "WORKFLOW_ROUTING_DETECTED");
  addReason(reasons, "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.governanceCreatesAuthority === true ? "GOVERNANCE_CREATES_AUTHORITY" : "GOVERNANCE_BOUNDED");
  addReason(reasons, input.policyMutationRequested === true ? "GOVERNANCE_MUTATES_POLICY" : "GOVERNANCE_POLICY_IMMUTABLE");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "GOVERNANCE_INFLUENCE_IS_NOT_EXECUTION");

  return {
    executionImpossible,
    authorityBounded,
    governanceBounded,
  };
}

export function createGovernanceInfluenceEdges(
  input: GovernanceInfluenceGraphInput,
): readonly Readonly<GovernanceInfluenceEdge>[] {
  const request = requestCore(input.request);
  const influenceType = input.influenceType ?? DEFAULT_INFLUENCE_TYPE;
  const edges: GovernanceInfluenceEdge[] = [];

  for (const governanceId of request.governanceNodeIds) {
    for (const influencedNodeId of request.influencedNodeIds) {
      const core = Object.freeze({
        edgeId: hashInfluenceValue("governance-influence-edge-id", {
          graphId: request.graphId,
          governanceNodeId: governanceId,
          influencedNodeId,
          influenceType,
          tenantId: request.tenantId,
        }),
        graphId: request.graphId,
        governanceNodeId: governanceId,
        influencedNodeId,
        influenceType,
        tenantId: request.tenantId,
      });
      edges.push(Object.freeze({
        ...core,
        immutableHash: hashInfluenceValue("governance-influence-edge", core),
      }));
    }
  }

  return Object.freeze(sortInfluenceEdges(edges));
}

export function validateGovernanceInfluenceGraph(
  input: GovernanceInfluenceGraphInput,
): GovernanceInfluenceGraphValidation {
  const reasons: GovernanceInfluenceReasonCode[] = [];
  const influencedNodeMap = graphNodeMap(input.graph.nodes);
  const governanceNodes = createGovernanceNodes(input.governanceNodes);
  const graphSealed = validateGraphSealed(input, reasons);
  const dependencyGraphSealed = validateDependencyGraphSealed(input, reasons);
  const proposalGraphSealed = validateProposalGraphSealed(input, reasons);
  const graphIdentity = validateGraphIdentity(input, reasons);
  const presence = validatePresence(input.request, reasons);
  const governanceNodeInputsValid = validateGovernanceNodeInputs(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, influencedNodeMap, governanceNodes, reasons);
  const governanceReferencesValid = validateGovernanceReferences(input, governanceNodes, reasons);
  const influencedReferencesValid = validateInfluencedReferences(input, influencedNodeMap, reasons);
  const lineageIntegrity = validateLineage(input, governanceNodes, influencedNodeMap, reasons);
  const constraints = validateInfluenceConstraints(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const influenceCount = normalizeStrings(input.request.governanceNodeIds).length
    * normalizeStrings(input.request.influencedNodeIds).length;
  addReason(reasons, "INFLUENCE_HASH_GENERATED");

  const valid = graphSealed
    && dependencyGraphSealed
    && proposalGraphSealed
    && graphIdentity
    && presence.governancePresent
    && presence.influencedPresent
    && governanceNodeInputsValid
    && tenantIsolationVerified
    && governanceReferencesValid
    && influencedReferencesValid
    && lineageIntegrity
    && constraints.valid
    && boundary.executionImpossible
    && boundary.authorityBounded
    && boundary.governanceBounded;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly GovernanceInfluenceReasonCode[],
    influenceCount,
    lineageIntegrity,
    tenantIsolationVerified,
    governanceBounded: boundary.governanceBounded,
    governanceDepth: constraints.governanceDepth,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
  });
}

export function buildGovernanceInfluenceGraphResult(
  input: GovernanceInfluenceGraphInput,
): GovernanceInfluenceGraphResult {
  const request = requestCore(input.request);
  const validation = validateGovernanceInfluenceGraph({
    ...input,
    request,
  });
  const governanceNodes = createGovernanceNodes(input.governanceNodes);
  const edges = createGovernanceInfluenceEdges({
    ...input,
    request,
  });
  const influenceHash = hashInfluenceValue("governance-influence-graph", {
    request,
    governanceNodes,
    influenceType: input.influenceType ?? DEFAULT_INFLUENCE_TYPE,
    edges,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
  });

  return Object.freeze({
    graphId: request.graphId,
    influenceCount: validation.influenceCount,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    governanceBounded: validation.governanceBounded,
    influenceHash,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
    sealed: validation.valid,
  });
}

export function buildGovernanceInfluenceGraphObservability(
  result: GovernanceInfluenceGraphResult,
): GovernanceInfluenceGraphObservability {
  return Object.freeze({
    graphId: result.graphId,
    influenceCount: result.influenceCount,
    lineageIntegrity: result.lineageIntegrity,
    governanceBounded: result.governanceBounded,
    influenceHash: result.influenceHash,
    graphState: result.graphState,
  });
}

export function sealGovernanceInfluenceGraph(
  input: GovernanceInfluenceGraphInput,
): SealedGovernanceInfluenceGraphRecord {
  const validation = validateGovernanceInfluenceGraph(input);
  const result = buildGovernanceInfluenceGraphResult(input);
  const governanceNodes = createGovernanceNodes(input.governanceNodes);
  const edges = createGovernanceInfluenceEdges(input);
  const observability = buildGovernanceInfluenceGraphObservability(result);

  return Object.freeze({
    result,
    governanceNodes,
    edges,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    influenceOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    policyMutationAllowed: false as const,
    governanceExecutionAllowed: false as const,
    authorityMutationAllowed: false as const,
    influenceMutationAllowed: false as const,
    selfExpansionAllowed: false as const,
  });
}

export const GovernanceInfluenceGraphValidator = Object.freeze({
  validate: validateGovernanceInfluenceGraph,
});

export const GovernanceInfluenceGraph = Object.freeze({
  buildRequest: buildGovernanceInfluenceRequest,
  createGovernanceNodes,
  createEdges: createGovernanceInfluenceEdges,
  buildResult: buildGovernanceInfluenceGraphResult,
  seal: sealGovernanceInfluenceGraph,
});

export const GovernanceInfluenceGraphObservabilityService = Object.freeze({
  build: buildGovernanceInfluenceGraphObservability,
});
