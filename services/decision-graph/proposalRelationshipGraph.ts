import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DecisionGraphNode,
  ProposalNode,
  ProposalNodeInput,
  ProposalRelationshipEdge,
  ProposalRelationshipGraphInput,
  ProposalRelationshipGraphObservability,
  ProposalRelationshipGraphResult,
  ProposalRelationshipGraphValidation,
  ProposalRelationshipReasonCode,
  ProposalRelationshipRequest,
  ProposalRelationshipType,
  SealedProposalRelationshipGraphRecord,
} from "./types";

export const MAX_RELATIONSHIPS_PER_PROPOSAL = 50;
export const MAX_RELATIONSHIP_DEPTH = 10;

const PROPOSAL_TYPES = new Set<ProposalNode["proposalType"]>([
  "MISSION",
  "RECOMMENDATION",
  "ESCALATION",
  "CONSTRAINT",
  "SIMULATION",
]);

const DEFAULT_RELATIONSHIP_TYPE: ProposalRelationshipType = "RELATED_TO";

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: ProposalRelationshipReasonCode[], reason: ProposalRelationshipReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashRelationshipValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function sortRelationshipEdges(edges: readonly ProposalRelationshipEdge[]): ProposalRelationshipEdge[] {
  return [...edges].sort((a, b) => a.edgeId.localeCompare(b.edgeId));
}

function sortProposalNodeInputs(nodes: readonly ProposalNodeInput[]): ProposalNodeInput[] {
  return [...nodes].sort((a, b) => a.proposalId.localeCompare(b.proposalId));
}

function graphNodeMap(nodes: readonly Readonly<DecisionGraphNode>[]): Map<string, Readonly<DecisionGraphNode>> {
  return new Map(nodes.map((node) => [node.nodeId, node]));
}

function proposalNodeMap(nodes: readonly Readonly<ProposalNode>[]): Map<string, Readonly<ProposalNode>> {
  return new Map(nodes.map((node) => [node.proposalId, node]));
}

function requestCore(request: ProposalRelationshipRequest): ProposalRelationshipRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    proposalNodeIds: normalizeStrings(request.proposalNodeIds),
    relationshipNodeIds: normalizeStrings(request.relationshipNodeIds),
    lineageReferences: normalizeStrings(request.lineageReferences),
  });
}

function normalizeProposalNodeInput(node: ProposalNodeInput): ProposalNodeInput {
  return Object.freeze({
    proposalId: node.proposalId,
    graphId: node.graphId,
    tenantId: node.tenantId,
    proposalType: node.proposalType,
    lineageReference: node.lineageReference,
  });
}

function buildProposalNode(node: ProposalNodeInput): ProposalNode {
  const normalized = normalizeProposalNodeInput(node);
  return Object.freeze({
    ...normalized,
    immutableHash: hashRelationshipValue("proposal-relationship-node", normalized),
  });
}

export function createProposalNodes(
  nodes: readonly ProposalNodeInput[],
): readonly Readonly<ProposalNode>[] {
  return Object.freeze(sortProposalNodeInputs(nodes).map(buildProposalNode));
}

export function buildProposalRelationshipRequest(
  input: Omit<ProposalRelationshipGraphInput, "request">,
): ProposalRelationshipRequest {
  return Object.freeze({
    graphId: input.graph.contract.graphId,
    tenantId: input.graph.contract.tenantId,
    proposalNodeIds: normalizeStrings(input.proposalNodes.map((node) => node.proposalId)),
    relationshipNodeIds: normalizeStrings(
      input.graph.nodes
        .filter((node) => !input.proposalNodes.some((proposalNode) => proposalNode.proposalId === node.nodeId))
        .map((node) => node.nodeId),
    ),
    lineageReferences: normalizeStrings([
      ...input.graph.contract.lineageReferences,
      ...input.proposalNodes.map((node) => node.lineageReference),
    ]),
  });
}

function validateGraphSealed(
  input: ProposalRelationshipGraphInput,
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const valid = input.graph.sealed && input.graph.contract.sealed && input.graph.contract.graphState === "SEALED";
  addReason(reasons, valid ? "SEALED_GRAPH_REQUIRED" : "GRAPH_UNSEALED");
  return valid;
}

function validateDependencyGraphSealed(
  input: ProposalRelationshipGraphInput,
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const valid = input.dependencyGraph.sealed && input.dependencyGraph.result.sealed;
  addReason(reasons, valid ? "DEPENDENCY_GRAPH_REQUIRED" : "DEPENDENCY_GRAPH_UNSEALED");
  return valid;
}

function validateGraphIdentity(
  input: ProposalRelationshipGraphInput,
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const valid = input.request.graphId === input.graph.contract.graphId
    && input.dependencyGraph.result.graphId === input.request.graphId;
  addReason(reasons, valid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  return valid;
}

function validatePresence(
  request: ProposalRelationshipRequest,
  reasons: ProposalRelationshipReasonCode[],
): { proposalsPresent: boolean; relationshipsPresent: boolean } {
  const proposalsPresent = normalizeStrings(request.proposalNodeIds).length > 0;
  const relationshipsPresent = normalizeStrings(request.relationshipNodeIds).length > 0;
  addReason(reasons, proposalsPresent ? "PROPOSAL_NODE_IDS_PRESENT" : "PROPOSAL_NODE_IDS_MISSING");
  addReason(reasons, relationshipsPresent ? "RELATIONSHIP_NODE_IDS_PRESENT" : "RELATIONSHIP_NODE_IDS_MISSING");
  return { proposalsPresent, relationshipsPresent };
}

function validateProposalNodeInputs(
  input: ProposalRelationshipGraphInput,
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const proposalNodes = createProposalNodes(input.proposalNodes);
  const valid = proposalNodes.every((node) => (
    node.graphId === input.request.graphId
    && node.tenantId === input.request.tenantId
    && node.lineageReference.length > 0
    && PROPOSAL_TYPES.has(node.proposalType)
  ));
  addReason(reasons, valid ? "PROPOSAL_TYPE_VALID" : "PROPOSAL_TYPE_INVALID");
  return valid;
}

function validateTenantScope(
  input: ProposalRelationshipGraphInput,
  relationshipNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  proposalNodes: readonly Readonly<ProposalNode>[],
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const crossTenantProposals = proposalNodes.some((node) => node.tenantId !== input.request.tenantId);
  const crossTenantRelationships = normalizeStrings(input.request.relationshipNodeIds)
    .map((nodeId) => relationshipNodeMap.get(nodeId))
    .filter((node): node is Readonly<DecisionGraphNode> => Boolean(node))
    .some((node) => node.tenantId !== input.request.tenantId);
  const valid = input.request.tenantId === input.graph.contract.tenantId
    && !crossTenantProposals
    && !crossTenantRelationships;
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : crossTenantRelationships ? "CROSS_TENANT_RELATIONSHIPS_BLOCKED" : "CROSS_TENANT_NODES_BLOCKED");
  return valid;
}

function validateProposalReferences(
  input: ProposalRelationshipGraphInput,
  proposalNodes: readonly Readonly<ProposalNode>[],
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const proposalMap = proposalNodeMap(proposalNodes);
  const missing = normalizeStrings(input.request.proposalNodeIds).some((proposalId) => !proposalMap.has(proposalId));
  addReason(reasons, missing ? "PROPOSAL_NODE_MISSING" : "PROPOSAL_NODES_VALID");
  return !missing;
}

function validateRelationshipReferences(
  input: ProposalRelationshipGraphInput,
  relationshipNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const unknown = normalizeStrings(input.request.relationshipNodeIds)
    .some((nodeId) => !relationshipNodeMap.has(nodeId));
  addReason(reasons, unknown ? "RELATIONSHIP_NODE_MISSING" : "RELATIONSHIP_NODES_VALID");
  if (unknown) addReason(reasons, "RELATIONSHIP_TARGET_UNKNOWN_NODE");
  return !unknown;
}

function validateReferenceImmutability(
  input: ProposalRelationshipGraphInput,
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const expectedProposalIds = normalizeStrings(input.proposalNodes.map((node) => node.proposalId));
  const expectedRelationshipIds = normalizeStrings(input.graph.nodes.map((node) => node.nodeId));
  const proposalIds = normalizeStrings(input.request.proposalNodeIds);
  const actualRelationshipIds = normalizeStrings(input.request.relationshipNodeIds);
  const sameProposalReferences = proposalIds.length === expectedProposalIds.length
    && proposalIds.every((proposalId, index) => proposalId === expectedProposalIds[index]);
  const valid = sameProposalReferences
    && actualRelationshipIds.every((nodeId) => expectedRelationshipIds.includes(nodeId));
  addReason(reasons, valid ? "RELATIONSHIP_REFERENCES_IMMUTABLE" : "RELATIONSHIP_REFERENCES_MUTATED");
  return valid;
}

function validateLineage(
  input: ProposalRelationshipGraphInput,
  proposalNodes: readonly Readonly<ProposalNode>[],
  relationshipNodeMap: Map<string, Readonly<DecisionGraphNode>>,
  reasons: ProposalRelationshipReasonCode[],
): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const required = normalizeStrings([
    ...proposalNodes.map((node) => node.lineageReference),
    ...normalizeStrings(input.request.relationshipNodeIds).flatMap((nodeId) => {
      const node = relationshipNodeMap.get(nodeId);
      return node ? [node.lineageReference] : [];
    }),
  ]);
  const valid = lineageReferences.length > 0
    && input.graph.validation.lineagePreserved
    && input.dependencyGraph.validation.lineageIntegrity
    && required.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateRelationshipConstraints(
  input: ProposalRelationshipGraphInput,
  reasons: ProposalRelationshipReasonCode[],
): { valid: boolean; relationshipDepth: number } {
  const proposalIds = normalizeStrings(input.request.proposalNodeIds);
  const relationshipIds = normalizeStrings(input.request.relationshipNodeIds);
  const selfRelationshipDetected = proposalIds.some((proposalId) => relationshipIds.includes(proposalId));
  const circularRelationshipDetected = proposalIds.length > 1 && relationshipIds.some((nodeId) => proposalIds.includes(nodeId));
  const relationshipCountExceeded = relationshipIds.length > MAX_RELATIONSHIPS_PER_PROPOSAL
    || proposalIds.some(() => relationshipIds.length > MAX_RELATIONSHIPS_PER_PROPOSAL);
  const relationshipDepth = relationshipIds.length;
  const relationshipDepthExceeded = relationshipDepth > MAX_RELATIONSHIP_DEPTH;

  addReason(reasons, selfRelationshipDetected ? "SELF_RELATIONSHIP_DETECTED" : "RELATIONSHIP_REFERENCE_VALID");
  if (circularRelationshipDetected) addReason(reasons, "CIRCULAR_RELATIONSHIP_DETECTED");
  addReason(reasons, relationshipCountExceeded ? "RELATIONSHIP_COUNT_EXCEEDED" : "RELATIONSHIP_LIMIT_VALID");
  addReason(reasons, relationshipDepthExceeded ? "RELATIONSHIP_DEPTH_EXCEEDED" : "RELATIONSHIP_DEPTH_VALID");

  return {
    valid: !selfRelationshipDetected && !circularRelationshipDetected && !relationshipCountExceeded && !relationshipDepthExceeded,
    relationshipDepth,
  };
}

function validateBoundary(
  input: ProposalRelationshipGraphInput,
  reasons: ProposalRelationshipReasonCode[],
): { executionImpossible: boolean; authorityBounded: boolean } {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.prioritizationRequested !== true
    && input.proposalSelectionRequested !== true
    && input.authorityExpansionRequested !== true;
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  if (input.workflowRoutingRequested === true) addReason(reasons, "WORKFLOW_ROUTING_DETECTED");
  addReason(reasons, "WORKFLOW_ROUTING_BLOCKED");
  if (input.prioritizationRequested === true) addReason(reasons, "PRIORITIZATION_DETECTED");
  addReason(reasons, "PRIORITIZATION_BLOCKED");
  if (input.proposalSelectionRequested === true) addReason(reasons, "PROPOSAL_SELECTION_DETECTED");
  addReason(reasons, "PROPOSAL_SELECTION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "PROPOSAL_RELATIONSHIP_GRAPH_IS_NOT_WORKFLOW_ENGINE");
  return {
    executionImpossible,
    authorityBounded,
  };
}

export function createProposalRelationshipEdges(
  input: ProposalRelationshipGraphInput,
): readonly Readonly<ProposalRelationshipEdge>[] {
  const request = requestCore(input.request);
  const relationshipType = input.relationshipType ?? DEFAULT_RELATIONSHIP_TYPE;
  const edges: ProposalRelationshipEdge[] = [];

  for (const proposalId of request.proposalNodeIds) {
    for (const relationshipNodeId of request.relationshipNodeIds) {
      const core = Object.freeze({
        edgeId: hashRelationshipValue("proposal-relationship-edge-id", {
          graphId: request.graphId,
          sourceProposalId: proposalId,
          targetRelationshipId: relationshipNodeId,
          relationshipType,
          tenantId: request.tenantId,
        }),
        graphId: request.graphId,
        sourceProposalId: proposalId,
        targetRelationshipId: relationshipNodeId,
        relationshipType,
        tenantId: request.tenantId,
      });
      edges.push(Object.freeze({
        ...core,
        immutableHash: hashRelationshipValue("proposal-relationship-edge", core),
      }));
    }
  }

  return Object.freeze(sortRelationshipEdges(edges));
}

export function validateProposalRelationshipGraph(
  input: ProposalRelationshipGraphInput,
): ProposalRelationshipGraphValidation {
  const reasons: ProposalRelationshipReasonCode[] = [];
  const relationshipNodeMap = graphNodeMap(input.graph.nodes);
  const proposalNodes = createProposalNodes(input.proposalNodes);
  const graphSealed = validateGraphSealed(input, reasons);
  const dependencyGraphSealed = validateDependencyGraphSealed(input, reasons);
  const graphIdentity = validateGraphIdentity(input, reasons);
  const presence = validatePresence(input.request, reasons);
  const proposalNodeInputsValid = validateProposalNodeInputs(input, reasons);
  const tenantIsolationVerified = validateTenantScope(input, relationshipNodeMap, proposalNodes, reasons);
  const proposalsValid = validateProposalReferences(input, proposalNodes, reasons);
  const relationshipsValid = validateRelationshipReferences(input, relationshipNodeMap, reasons);
  const referencesImmutable = validateReferenceImmutability(input, reasons);
  const lineageIntegrity = validateLineage(input, proposalNodes, relationshipNodeMap, reasons);
  const constraints = validateRelationshipConstraints(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const relationshipCount = normalizeStrings(input.request.proposalNodeIds).length
    * normalizeStrings(input.request.relationshipNodeIds).length;
  addReason(reasons, "RELATIONSHIP_HASH_GENERATED");

  const valid = graphSealed
    && dependencyGraphSealed
    && graphIdentity
    && presence.proposalsPresent
    && presence.relationshipsPresent
    && proposalNodeInputsValid
    && tenantIsolationVerified
    && proposalsValid
    && relationshipsValid
    && referencesImmutable
    && lineageIntegrity
    && constraints.valid
    && boundary.executionImpossible
    && boundary.authorityBounded;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly ProposalRelationshipReasonCode[],
    relationshipCount,
    lineageIntegrity,
    tenantIsolationVerified,
    relationshipDepth: constraints.relationshipDepth,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
  });
}

export function buildProposalRelationshipGraphResult(
  input: ProposalRelationshipGraphInput,
): ProposalRelationshipGraphResult {
  const request = requestCore(input.request);
  const validation = validateProposalRelationshipGraph({
    ...input,
    request,
  });
  const proposalNodes = createProposalNodes(input.proposalNodes);
  const edges = createProposalRelationshipEdges({
    ...input,
    request,
  });
  const relationshipHash = hashRelationshipValue("proposal-relationship-graph", {
    request,
    proposalNodes,
    relationshipType: input.relationshipType ?? DEFAULT_RELATIONSHIP_TYPE,
    edges,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
  });

  return Object.freeze({
    graphId: request.graphId,
    relationshipCount: validation.relationshipCount,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    relationshipHash,
    graphState: validation.valid ? "SEALED" : "VALIDATED",
    sealed: validation.valid,
  });
}

export function buildProposalRelationshipGraphObservability(
  result: ProposalRelationshipGraphResult,
): ProposalRelationshipGraphObservability {
  return Object.freeze({
    graphId: result.graphId,
    relationshipCount: result.relationshipCount,
    lineageIntegrity: result.lineageIntegrity,
    tenantIsolationVerified: result.tenantIsolationVerified,
    relationshipHash: result.relationshipHash,
    graphState: result.graphState,
  });
}

export function sealProposalRelationshipGraph(
  input: ProposalRelationshipGraphInput,
): SealedProposalRelationshipGraphRecord {
  const validation = validateProposalRelationshipGraph(input);
  const result = buildProposalRelationshipGraphResult(input);
  const proposalNodes = createProposalNodes(input.proposalNodes);
  const edges = createProposalRelationshipEdges(input);
  const observability = buildProposalRelationshipGraphObservability(result);

  return Object.freeze({
    result,
    proposalNodes,
    edges,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    relationshipOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    prioritizationAllowed: false as const,
    proposalSelectionAllowed: false as const,
    proposalCreationAllowed: false as const,
    authorityMutationAllowed: false as const,
    relationshipMutationAllowed: false as const,
    selfExpansionAllowed: false as const,
  });
}

export const ProposalRelationshipGraphValidator = Object.freeze({
  validate: validateProposalRelationshipGraph,
});

export const ProposalRelationshipGraph = Object.freeze({
  buildRequest: buildProposalRelationshipRequest,
  createProposalNodes,
  createEdges: createProposalRelationshipEdges,
  buildResult: buildProposalRelationshipGraphResult,
  seal: sealProposalRelationshipGraph,
});

export const ProposalRelationshipGraphObservabilityService = Object.freeze({
  build: buildProposalRelationshipGraphObservability,
});
