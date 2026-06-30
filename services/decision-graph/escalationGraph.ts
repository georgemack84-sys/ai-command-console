import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DecisionGraphNode,
  EscalationEdge,
  EscalationGraphInput,
  EscalationGraphObservability,
  EscalationGraphReasonCode,
  EscalationGraphRequest,
  EscalationGraphResult,
  EscalationGraphValidation,
  EscalationNode,
  EscalationNodeInput,
  EscalationRelationshipType,
  SealedEscalationGraphRecord,
} from "./types";

export const MAX_ESCALATION_EDGES_PER_NODE = 50;
export const MAX_ESCALATION_DEPTH = 10;

const ESCALATION_TYPES = new Set<EscalationNode["escalationType"]>([
  "REVIEW",
  "GOVERNANCE",
  "CONTAINMENT",
  "BOUNDARY",
  "SUPERVISION",
]);

const DEFAULT_ESCALATION_RELATIONSHIP: EscalationRelationshipType = "ESCALATES_TO";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: EscalationGraphReasonCode[], reason: EscalationGraphReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashEscalationValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function sortEscalationEdges(edges: readonly EscalationEdge[]): EscalationEdge[] {
  return [...edges].sort((a, b) => a.edgeId.localeCompare(b.edgeId));
}

function sortEscalationNodeInputs(nodes: readonly EscalationNodeInput[]): EscalationNodeInput[] {
  return [...nodes].sort((a, b) => a.escalationId.localeCompare(b.escalationId));
}

function graphNodeMap(nodes: readonly Readonly<DecisionGraphNode>[]): Map<string, Readonly<DecisionGraphNode>> {
  return new Map(nodes.map((node) => [node.nodeId, node]));
}

function escalationNodeMap(nodes: readonly Readonly<EscalationNode>[]): Map<string, Readonly<EscalationNode>> {
  return new Map(nodes.map((node) => [node.escalationId, node]));
}

function requestCore(request: EscalationGraphRequest): EscalationGraphRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    escalationNodeIds: normalizeStrings(request.escalationNodeIds),
    targetNodeIds: normalizeStrings(request.targetNodeIds),
    lineageReferences: normalizeStrings(request.lineageReferences),
  });
}

function normalizeEscalationNodeInput(node: EscalationNodeInput): EscalationNodeInput {
  return Object.freeze({
    escalationId: node.escalationId,
    graphId: node.graphId,
    tenantId: node.tenantId,
    escalationType: node.escalationType,
    lineageReference: node.lineageReference,
  });
}

function buildEscalationNode(node: EscalationNodeInput): EscalationNode {
  const normalized = normalizeEscalationNodeInput(node);
  return Object.freeze({
    ...normalized,
    immutableHash: hashEscalationValue("escalation-graph-node", normalized),
  });
}

export function createEscalationNodes(
  nodes: readonly EscalationNodeInput[],
): readonly Readonly<EscalationNode>[] {
  return Object.freeze(sortEscalationNodeInputs(nodes).map(buildEscalationNode));
}

export function buildEscalationGraphRequest(
  input: Omit<EscalationGraphInput, "request">,
): EscalationGraphRequest {
  return Object.freeze({
    graphId: input.graph.contract.graphId,
    tenantId: input.graph.contract.tenantId,
    escalationNodeIds: normalizeStrings(input.escalationNodes.map((node) => node.escalationId)),
    targetNodeIds: normalizeStrings(input.graph.nodes.map((node) => node.nodeId)),
    lineageReferences: normalizeStrings([
      ...input.graph.contract.lineageReferences,
      ...input.escalationNodes.map((node) => node.lineageReference),
    ]),
  });
}

function validateGraphSealed(input: EscalationGraphInput, reasons: EscalationGraphReasonCode[]): boolean {
  const valid = input.graph.sealed && input.graph.contract.sealed && input.graph.contract.graphState === "SEALED";
  addReason(reasons, valid ? "SEALED_GRAPH_REQUIRED" : "GRAPH_UNSEALED");
  return valid;
}

function validateDependencyGraphSealed(input: EscalationGraphInput, reasons: EscalationGraphReasonCode[]): boolean {
  const valid = input.dependencyGraph.sealed && input.dependencyGraph.result.sealed;
  addReason(reasons, valid ? "DEPENDENCY_GRAPH_REQUIRED" : "DEPENDENCY_GRAPH_UNSEALED");
  return valid;
}

function validateProposalGraphSealed(input: EscalationGraphInput, reasons: EscalationGraphReasonCode[]): boolean {
  const valid = input.proposalGraph.sealed && input.proposalGraph.result.sealed;
  addReason(reasons, valid ? "PROPOSAL_GRAPH_REQUIRED" : "PROPOSAL_GRAPH_UNSEALED");
  return valid;
}

function validateGovernanceGraphSealed(input: EscalationGraphInput, reasons: EscalationGraphReasonCode[]): boolean {
  const valid = input.governanceGraph.sealed && input.governanceGraph.result.sealed;
  addReason(reasons, valid ? "GOVERNANCE_GRAPH_REQUIRED" : "GOVERNANCE_GRAPH_UNSEALED");
  return valid;
}

function validateGraphIdentity(input: EscalationGraphInput, reasons: EscalationGraphReasonCode[]): boolean {
  const valid = input.request.graphId === input.graph.contract.graphId
    && input.dependencyGraph.result.graphId === input.request.graphId
    && input.proposalGraph.result.graphId === input.request.graphId
    && input.governanceGraph.result.graphId === input.request.graphId;
  addReason(reasons, valid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  return valid;
}

function validatePresence(
  request: EscalationGraphRequest,
  reasons: EscalationGraphReasonCode[],
): { escalationPresent: boolean; targetsPresent: boolean } {
  const escalationPresent = normalizeStrings(request.escalationNodeIds).length > 0;
  const targetsPresent = normalizeStrings(request.targetNodeIds).length > 0;
  addReason(reasons, escalationPresent ? "ESCALATION_NODE_IDS_PRESENT" : "ESCALATION_NODE_IDS_MISSING");
  addReason(reasons, targetsPresent ? "TARGET_NODE_IDS_PRESENT" : "TARGET_NODE_IDS_MISSING");
  return { escalationPresent, targetsPresent };
}

function validateEscalationNodeInputs(input: EscalationGraphInput, reasons: EscalationGraphReasonCode[]): boolean {
  const escalationNodes = createEscalationNodes(input.escalationNodes);
  const valid = escalationNodes.every((node) => (
    node.graphId === input.request.graphId
    && node.tenantId === input.request.tenantId
    && node.lineageReference.length > 0
    && ESCALATION_TYPES.has(node.escalationType)
  ));
  addReason(reasons, valid ? "ESCALATION_TYPE_VALID" : "ESCALATION_TYPE_INVALID");
  return valid;
}

function validateTenantScope(
  input: EscalationGraphInput,
  targetNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  escalationNodes: readonly Readonly<EscalationNode>[],
  reasons: EscalationGraphReasonCode[],
): boolean {
  const crossTenantEscalation = escalationNodes.some((node) => node.tenantId !== input.request.tenantId);
  const crossTenantTargets = normalizeStrings(input.request.targetNodeIds)
    .map((nodeId) => targetNodeMap.get(nodeId))
    .filter((node): node is Readonly<DecisionGraphNode> => Boolean(node))
    .some((node) => node.tenantId !== input.request.tenantId);
  const valid = input.request.tenantId === input.graph.contract.tenantId
    && !crossTenantEscalation
    && !crossTenantTargets;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : crossTenantTargets ? "CROSS_TENANT_ESCALATION_BLOCKED" : "CROSS_TENANT_NODES_BLOCKED");
  return valid;
}

function validateEscalationReferences(
  input: EscalationGraphInput,
  escalationNodes: readonly Readonly<EscalationNode>[],
  reasons: EscalationGraphReasonCode[],
): boolean {
  const escalationMap = escalationNodeMap(escalationNodes);
  const missing = normalizeStrings(input.request.escalationNodeIds).some((id) => !escalationMap.has(id));
  addReason(reasons, missing ? "ESCALATION_ARTIFACT_MISSING" : "ESCALATION_NODES_VALID");
  return !missing;
}

function validateTargetReferences(
  input: EscalationGraphInput,
  targetNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: EscalationGraphReasonCode[],
): boolean {
  const unknown = normalizeStrings(input.request.targetNodeIds).some((id) => !targetNodeMap.has(id));
  addReason(reasons, unknown ? "TARGET_NODE_MISSING" : "TARGET_NODES_VALID");
  if (unknown) addReason(reasons, "ESCALATION_TARGET_UNKNOWN_NODE");
  return !unknown;
}

function validateOwnershipImmutability(input: EscalationGraphInput, reasons: EscalationGraphReasonCode[]): boolean {
  const valid = input.ownershipMutationRequested !== true;
  addReason(reasons, valid ? "ESCALATION_OWNERSHIP_IMMUTABLE" : "ESCALATION_MUTATES_OWNERSHIP");
  return valid;
}

function validateLineage(
  input: EscalationGraphInput,
  escalationNodes: readonly Readonly<EscalationNode>[],
  targetNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: EscalationGraphReasonCode[],
): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = normalizeStrings([
    ...escalationNodes.map((node) => node.lineageReference),
    ...normalizeStrings(input.request.targetNodeIds).flatMap((nodeId) => {
      const node = targetNodeMap.get(nodeId);
      return node ? [node.lineageReference] : [];
    }),
  ]);
  const valid = lineageReferences.length > 0
    && input.graph.validation.lineagePreserved
    && input.dependencyGraph.validation.lineageIntegrity
    && input.proposalGraph.validation.lineageIntegrity
    && input.governanceGraph.validation.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateEscalationConstraints(
  input: EscalationGraphInput,
  reasons: EscalationGraphReasonCode[],
): { valid: boolean; escalationDepth: number } {
  const escalationIds = normalizeStrings(input.request.escalationNodeIds);
  const targetIds = normalizeStrings(input.request.targetNodeIds);
  const selfEscalation = escalationIds.some((id) => targetIds.includes(id));
  const escalationCountExceeded = targetIds.length > MAX_ESCALATION_EDGES_PER_NODE
    || escalationIds.some(() => targetIds.length > MAX_ESCALATION_EDGES_PER_NODE);
  const escalationDepth = targetIds.length;
  const escalationDepthExceeded = escalationDepth > MAX_ESCALATION_DEPTH;

  addReason(reasons, selfEscalation ? "SELF_ESCALATION_DETECTED" : "ESCALATION_REFERENCE_VALID");
  addReason(reasons, escalationCountExceeded ? "ESCALATION_COUNT_EXCEEDED" : "ESCALATION_LIMIT_VALID");
  addReason(reasons, escalationDepthExceeded ? "ESCALATION_DEPTH_EXCEEDED" : "ESCALATION_DEPTH_VALID");

  return {
    valid: !selfEscalation && !escalationCountExceeded && !escalationDepthExceeded,
    escalationDepth,
  };
}

function validateBoundary(
  input: EscalationGraphInput,
  reasons: EscalationGraphReasonCode[],
): { executionImpossible: boolean; authorityBounded: boolean; escalationBounded: boolean } {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true;
  const escalationBounded = input.escalationCreatesAuthority !== true;
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  if (input.workflowRoutingRequested === true) addReason(reasons, "WORKFLOW_ROUTING_DETECTED");
  addReason(reasons, "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, escalationBounded ? "ESCALATION_BOUNDED" : "ESCALATION_CREATES_AUTHORITY");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "ESCALATION_GRAPH_IS_NOT_EXECUTION");

  return {
    executionImpossible,
    authorityBounded,
    escalationBounded,
  };
}

export function createEscalationEdges(
  input: EscalationGraphInput,
): readonly Readonly<EscalationEdge>[] {
  const request = requestCore(input.request);
  const escalationRelationship = input.escalationRelationship ?? DEFAULT_ESCALATION_RELATIONSHIP;
  const edges: EscalationEdge[] = [];

  for (const escalationNodeId of request.escalationNodeIds) {
    for (const targetNodeId of request.targetNodeIds) {
      const core = Object.freeze({
        edgeId: hashEscalationValue("escalation-graph-edge-id", {
          graphId: request.graphId,
          escalationNodeId,
          targetNodeId,
          escalationRelationship,
          tenantId: request.tenantId,
        }),
        graphId: request.graphId,
        escalationNodeId,
        targetNodeId,
        escalationRelationship,
        tenantId: request.tenantId,
      });
      edges.push(Object.freeze({
        ...core,
        immutableHash: hashEscalationValue("escalation-graph-edge", core),
      }));
    }
  }

  return Object.freeze(sortEscalationEdges(edges));
}

export function validateEscalationGraph(input: EscalationGraphInput): EscalationGraphValidation {
  const reasons: EscalationGraphReasonCode[] = [];
  const targetNodeMap = graphNodeMap(input.graph.nodes);
  const escalationNodes = createEscalationNodes(input.escalationNodes);
  const graphSealed = validateGraphSealed(input, reasons);
  const dependencyGraphSealed = validateDependencyGraphSealed(input, reasons);
  const proposalGraphSealed = validateProposalGraphSealed(input, reasons);
  const governanceGraphSealed = validateGovernanceGraphSealed(input, reasons);
  const graphIdentity = validateGraphIdentity(input, reasons);
  const presence = validatePresence(input.request, reasons);
  const escalationNodeInputsValid = validateEscalationNodeInputs(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, targetNodeMap, escalationNodes, reasons);
  const escalationReferencesValid = validateEscalationReferences(input, escalationNodes, reasons);
  const targetReferencesValid = validateTargetReferences(input, targetNodeMap, reasons);
  const ownershipImmutable = validateOwnershipImmutability(input, reasons);
  const lineageIntegrity = validateLineage(input, escalationNodes, targetNodeMap, reasons);
  const constraints = validateEscalationConstraints(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const escalationCount = normalizeStrings(input.request.escalationNodeIds).length
    * normalizeStrings(input.request.targetNodeIds).length;
  addReason(reasons, "ESCALATION_HASH_GENERATED");

  const valid = graphSealed
    && dependencyGraphSealed
    && proposalGraphSealed
    && governanceGraphSealed
    && graphIdentity
    && presence.escalationPresent
    && presence.targetsPresent
    && escalationNodeInputsValid
    && tenantIsolationVerified
    && escalationReferencesValid
    && targetReferencesValid
    && ownershipImmutable
    && lineageIntegrity
    && constraints.valid
    && boundary.executionImpossible
    && boundary.authorityBounded
    && boundary.escalationBounded;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly EscalationGraphReasonCode[],
    escalationCount,
    lineageIntegrity,
    tenantIsolationVerified,
    escalationBounded: boundary.escalationBounded,
    escalationDepth: constraints.escalationDepth,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
  });
}

export function buildEscalationGraphResult(input: EscalationGraphInput): EscalationGraphResult {
  const request = requestCore(input.request);
  const validation = validateEscalationGraph({
    ...input,
    request,
  });
  const escalationNodes = createEscalationNodes(input.escalationNodes);
  const edges = createEscalationEdges({
    ...input,
    request,
  });
  const escalationHash = hashEscalationValue("escalation-graph", {
    request,
    escalationNodes,
    escalationRelationship: input.escalationRelationship ?? DEFAULT_ESCALATION_RELATIONSHIP,
    edges,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
  });

  return Object.freeze({
    graphId: request.graphId,
    escalationCount: validation.escalationCount,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    escalationBounded: validation.escalationBounded,
    escalationHash,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
    sealed: validation.valid,
  });
}

export function buildEscalationGraphObservability(result: EscalationGraphResult): EscalationGraphObservability {
  return Object.freeze({
    graphId: result.graphId,
    escalationCount: result.escalationCount,
    lineageIntegrity: result.lineageIntegrity,
    escalationBounded: result.escalationBounded,
    escalationHash: result.escalationHash,
    graphState: result.graphState,
  });
}

export function sealEscalationGraph(input: EscalationGraphInput): SealedEscalationGraphRecord {
  const validation = validateEscalationGraph(input);
  const result = buildEscalationGraphResult(input);
  const escalationNodes = createEscalationNodes(input.escalationNodes);
  const edges = createEscalationEdges(input);
  const observability = buildEscalationGraphObservability(result);

  return Object.freeze({
    result,
    escalationNodes,
    edges,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    escalationOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    runtimeDispatchAllowed: false as const,
    notificationAllowed: false as const,
    authorityMutationAllowed: false as const,
    escalationMutationAllowed: false as const,
    selfExpansionAllowed: false as const,
  });
}

export const EscalationGraphValidator = Object.freeze({
  validate: validateEscalationGraph,
});

export const EscalationGraph = Object.freeze({
  buildRequest: buildEscalationGraphRequest,
  createEscalationNodes,
  createEdges: createEscalationEdges,
  buildResult: buildEscalationGraphResult,
  seal: sealEscalationGraph,
});

export const EscalationGraphObservabilityService = Object.freeze({
  build: buildEscalationGraphObservability,
});
