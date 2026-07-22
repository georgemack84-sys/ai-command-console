import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  DecisionGraphContract,
  DecisionGraphContractInput,
  DecisionGraphEdge,
  DecisionGraphEdgeInput,
  DecisionGraphNode,
  DecisionGraphNodeInput,
  DecisionGraphObservability,
  DecisionGraphReasonCode,
  DecisionGraphValidationResult,
  SealedDecisionGraphRecord,
} from "./types";

const NODE_TYPES = new Set<DecisionGraphNode["nodeType"]>([
  "RECOMMENDATION",
  "SIMULATION",
  "CONSTRAINT",
  "GOVERNANCE",
  "ESCALATION",
  "OBSERVABILITY",
]);

const EDGE_TYPES = new Set<DecisionGraphEdge["relationshipType"]>([
  "DEPENDS_ON",
  "CONSTRAINED_BY",
  "INFLUENCED_BY",
  "ESCALATES_TO",
  "OBSERVED_BY",
  "depends_on",
  "blocks",
  "conflicts_with",
  "supersedes",
  "supports",
  "weakens",
  "escalates_to",
  "requires_operator_approval",
  "requires_governance_review",
  "requires_simulation",
  "requires_recovery_plan",
  "requires_certification",
]);

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: DecisionGraphReasonCode[], reason: DecisionGraphReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashGraphValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function normalizeNodeInput(node: DecisionGraphNodeInput): DecisionGraphNodeInput {
  return Object.freeze({
    nodeId: node.nodeId,
    graphId: node.graphId,
    nodeType: node.nodeType,
    tenantId: node.tenantId,
    lineageReference: node.lineageReference,
    decisionCandidateId: node.decisionCandidateId,
    missionId: node.missionId,
    priority: node.priority,
    state: node.state,
    dependencyRefs: node.dependencyRefs,
    conflictRefs: node.conflictRefs,
    blockerRefs: node.blockerRefs,
    supportingRefs: node.supportingRefs,
    weakeningRefs: node.weakeningRefs,
    supersessionRefs: node.supersessionRefs,
    escalationRefs: node.escalationRefs,
    governanceRefs: node.governanceRefs,
    authorityRefs: node.authorityRefs,
    simulationRefs: node.simulationRefs,
    recoveryRefs: node.recoveryRefs,
    certificationRefs: node.certificationRefs,
    replayRefs: node.replayRefs,
    sourceCandidateHash: node.sourceCandidateHash,
    createdAt: node.createdAt,
    updatedAt: node.updatedAt,
  });
}

function normalizeEdgeInput(edge: DecisionGraphEdgeInput): DecisionGraphEdgeInput {
  return Object.freeze({
    edgeId: edge.edgeId,
    graphId: edge.graphId,
    sourceNodeId: edge.sourceNodeId,
    targetNodeId: edge.targetNodeId,
    relationshipType: edge.relationshipType,
    tenantId: edge.tenantId,
  });
}

function sortNodes(nodes: readonly DecisionGraphNodeInput[]): DecisionGraphNodeInput[] {
  return [...nodes].map(normalizeNodeInput).sort((a, b) => a.nodeId.localeCompare(b.nodeId));
}

function sortEdges(edges: readonly DecisionGraphEdgeInput[]): DecisionGraphEdgeInput[] {
  return [...edges].map(normalizeEdgeInput).sort((a, b) => a.edgeId.localeCompare(b.edgeId));
}

function buildNode(node: DecisionGraphNodeInput): DecisionGraphNode {
  const normalized = normalizeNodeInput(node);
  const candidateId = normalized.decisionCandidateId ?? normalized.nodeId;
  const missionId = normalized.missionId ?? "";
  const createdAt = normalized.createdAt ?? "";
  const updatedAt = normalized.updatedAt ?? createdAt;
  const sourceCandidateHash = normalized.sourceCandidateHash
    ?? hashGraphValue("decision-graph-source-candidate", candidateId);
  const nodeHashPayload = {
    node_id: normalized.nodeId,
    decision_candidate_id: candidateId,
    tenant_id: normalized.tenantId,
    mission_id: missionId,
    decision_type: normalized.nodeType,
    priority: normalized.priority ?? 0,
    state: normalized.state ?? "CREATED",
    dependency_refs: normalizeStrings([...(normalized.dependencyRefs ?? [])]),
    conflict_refs: normalizeStrings([...(normalized.conflictRefs ?? [])]),
    blocker_refs: normalizeStrings([...(normalized.blockerRefs ?? [])]),
    supporting_refs: normalizeStrings([...(normalized.supportingRefs ?? [])]),
    governance_refs: normalizeStrings([...(normalized.governanceRefs ?? [])]),
    replay_refs: normalizeStrings([...(normalized.replayRefs ?? [])]),
    source_candidate_hash: sourceCandidateHash,
    contract_version: "decision-graph/v1",
  };
  const immutableHash = hashGraphValue("decision-graph-node", normalized);
  const integrityHash = hashGraphValue("decision-graph-node-integrity", nodeHashPayload);
  return Object.freeze({
    ...normalized,
    node_id: normalized.nodeId,
    decision_candidate_id: candidateId,
    tenant_id: normalized.tenantId,
    mission_id: missionId,
    decision_type: normalized.nodeType,
    priority: normalized.priority ?? 0,
    state: normalized.state ?? "CREATED",
    dependency_refs: nodeHashPayload.dependency_refs,
    conflict_refs: nodeHashPayload.conflict_refs,
    blocker_refs: nodeHashPayload.blocker_refs,
    supporting_refs: nodeHashPayload.supporting_refs,
    weakening_refs: normalizeStrings([...(normalized.weakeningRefs ?? [])]),
    supersession_refs: normalizeStrings([...(normalized.supersessionRefs ?? [])]),
    escalation_refs: normalizeStrings([...(normalized.escalationRefs ?? [])]),
    governance_refs: nodeHashPayload.governance_refs,
    authority_refs: normalizeStrings([...(normalized.authorityRefs ?? [])]),
    simulation_refs: normalizeStrings([...(normalized.simulationRefs ?? [])]),
    recovery_refs: normalizeStrings([...(normalized.recoveryRefs ?? [])]),
    certification_refs: normalizeStrings([...(normalized.certificationRefs ?? [])]),
    replay_refs: nodeHashPayload.replay_refs,
    source_candidate_hash: sourceCandidateHash,
    created_at: createdAt,
    updated_at: updatedAt,
    integrity_hash: integrityHash,
    immutableHash,
  });
}

function buildEdge(edge: DecisionGraphEdgeInput): DecisionGraphEdge {
  const normalized = normalizeEdgeInput(edge);
  const immutableHash = hashGraphValue("decision-graph-edge", normalized);
  return Object.freeze({
    ...normalized,
    immutableHash,
  });
}

export function createDecisionGraphNodes(nodes: readonly DecisionGraphNodeInput[]): readonly Readonly<DecisionGraphNode>[] {
  return Object.freeze(sortNodes(nodes).map(buildNode));
}

export function createDecisionGraphEdges(edges: readonly DecisionGraphEdgeInput[]): readonly Readonly<DecisionGraphEdge>[] {
  return Object.freeze(sortEdges(edges).map(buildEdge));
}

function contractHashInput(input: DecisionGraphContractInput): Omit<DecisionGraphContract, "graphHash"> {
  const nodes = createDecisionGraphNodes(input.nodes);
  const edges = createDecisionGraphEdges(input.edges);
  return Object.freeze({
    graphId: input.graphId,
    tenantId: input.tenantId,
    missionId: input.missionId,
    graphVersion: input.graphVersion,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    lineageReferences: normalizeStrings(input.lineageReferences),
    graphState: input.graphState ?? "INITIALIZED",
    sealed: input.sealed ?? false,
    createdAt: input.createdAt,
  });
}

export function generateDecisionGraphHash(input: DecisionGraphContractInput): string {
  const nodes = createDecisionGraphNodes(input.nodes);
  const edges = createDecisionGraphEdges(input.edges);
  return hashGraphValue("decision-graph-contract", {
    contract: contractHashInput(input),
    nodes,
    edges,
  });
}

function validateRequiredFields(input: DecisionGraphContractInput, reasons: DecisionGraphReasonCode[]): boolean {
  const graphIdPresent = input.graphId.length > 0;
  const tenantIdPresent = input.tenantId.length > 0;
  const missionIdPresent = input.missionId.length > 0;
  const graphVersionPresent = input.graphVersion.length > 0;
  const createdAtPresent = input.createdAt.length > 0;
  const nodesPresent = input.nodes.length > 0;

  addReason(reasons, graphIdPresent ? "GRAPH_ID_PRESENT" : "GRAPH_ID_MISSING");
  addReason(reasons, tenantIdPresent ? "TENANT_ID_PRESENT" : "TENANT_ID_MISSING");
  addReason(reasons, missionIdPresent ? "MISSION_ID_PRESENT" : "MISSION_ID_MISSING");
  addReason(reasons, graphVersionPresent ? "GRAPH_VERSION_PRESENT" : "GRAPH_VERSION_MISSING");
  addReason(reasons, createdAtPresent ? "CREATED_AT_PRESENT" : "CREATED_AT_MISSING");
  addReason(reasons, nodesPresent ? "NODES_PRESENT" : "NODES_MISSING");
  addReason(reasons, "EDGES_PRESENT");

  return graphIdPresent && tenantIdPresent && missionIdPresent && graphVersionPresent && createdAtPresent && nodesPresent;
}

function validateNodeTypes(nodes: readonly DecisionGraphNodeInput[], reasons: DecisionGraphReasonCode[]): boolean {
  const valid = nodes.every((node) => NODE_TYPES.has(node.nodeType));
  addReason(reasons, valid ? "NODE_TYPE_VALID" : "NODE_TYPE_INVALID");
  return valid;
}

function validateEdgeTypes(edges: readonly DecisionGraphEdgeInput[], reasons: DecisionGraphReasonCode[]): boolean {
  const valid = edges.every((edge) => EDGE_TYPES.has(edge.relationshipType));
  addReason(reasons, valid ? "EDGE_RELATIONSHIP_VALID" : "EDGE_RELATIONSHIP_INVALID");
  return valid;
}

function validateOwnership(input: DecisionGraphContractInput, reasons: DecisionGraphReasonCode[]): {
  nodeOwnershipValid: boolean;
  edgeOwnershipValid: boolean;
  tenantScoped: boolean;
  graphIdConsistent: boolean;
} {
  const nodeOwnershipValid = input.nodes.every((node) => node.tenantId.length > 0 && node.tenantId === input.tenantId);
  const edgeOwnershipValid = input.edges.every((edge) => edge.tenantId.length > 0 && edge.tenantId === input.tenantId);
  const crossTenantNodes = input.nodes.some((node) => node.tenantId !== input.tenantId);
  const crossTenantEdges = input.edges.some((edge) => edge.tenantId !== input.tenantId);
  const graphIdConsistent = input.nodes.every((node) => node.graphId === input.graphId)
    && input.edges.every((edge) => edge.graphId === input.graphId);

  addReason(reasons, nodeOwnershipValid ? "NODE_OWNERSHIP_VALID" : "NODE_OWNERSHIP_INVALID");
  addReason(reasons, edgeOwnershipValid ? "EDGE_OWNERSHIP_VALID" : "EDGE_OWNERSHIP_INVALID");
  addReason(reasons, !crossTenantNodes ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_NODES_BLOCKED");
  if (crossTenantEdges) addReason(reasons, "CROSS_TENANT_EDGES_BLOCKED");
  addReason(reasons, graphIdConsistent ? "GRAPH_ID_CONSISTENT" : "GRAPH_ID_MISMATCH");

  return {
    nodeOwnershipValid,
    edgeOwnershipValid,
    tenantScoped: !crossTenantNodes && !crossTenantEdges,
    graphIdConsistent,
  };
}

function validateLineage(input: DecisionGraphContractInput, reasons: DecisionGraphReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.lineageReferences);
  const lineagePresent = lineageReferences.length > 0;
  const nodeLineagePresent = input.nodes.every((node) => node.lineageReference.length > 0);
  const lineagePreserved = lineagePresent
    && nodeLineagePresent
    && input.nodes.every((node) => lineageReferences.includes(node.lineageReference));

  addReason(reasons, lineagePresent ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, lineagePreserved ? "LINEAGE_PRESERVED" : "LINEAGE_MISSING");
  return lineagePreserved;
}

function validateEdgeReferences(
  input: DecisionGraphContractInput,
  reasons: DecisionGraphReasonCode[],
): boolean {
  const nodeIds = new Set(input.nodes.map((node) => node.nodeId));
  const missingSource = input.edges.some((edge) => !nodeIds.has(edge.sourceNodeId));
  const missingTarget = input.edges.some((edge) => !nodeIds.has(edge.targetNodeId));
  const valid = !missingSource && !missingTarget;

  if (missingSource) addReason(reasons, "EDGE_SOURCE_NODE_MISSING");
  if (missingTarget) addReason(reasons, "EDGE_TARGET_NODE_MISSING");
  addReason(reasons, valid ? "EDGE_REFERENCES_VALID" : missingSource ? "EDGE_SOURCE_NODE_MISSING" : "EDGE_TARGET_NODE_MISSING");

  return valid;
}

function validateBoundary(input: DecisionGraphContractInput, reasons: DecisionGraphReasonCode[]): {
  mutationBlocked: boolean;
  executionImpossible: boolean;
  authorityBounded: boolean;
} {
  const mutationBlocked = !(input.graphState === "SEALED" && input.mutationAttempted === true);
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true;

  addReason(reasons, mutationBlocked ? "SEALED_GRAPH_IMMUTABLE" : "MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  if (input.workflowRoutingRequested === true) addReason(reasons, "WORKFLOW_ROUTING_DETECTED");
  addReason(reasons, "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "GRAPH_IS_NOT_DECISION");

  return {
    mutationBlocked,
    executionImpossible,
    authorityBounded,
  };
}

function resolveGraphState(valid: boolean): DecisionGraphContract["graphState"] {
  return valid ? "SEALED" : "VALIDATED";
}

export function validateDecisionGraphContract(input: DecisionGraphContractInput): DecisionGraphValidationResult {
  const reasons: DecisionGraphReasonCode[] = [];
  const requiredFieldsValid = validateRequiredFields(input, reasons);
  const nodeTypesValid = validateNodeTypes(input.nodes, reasons);
  const edgeTypesValid = validateEdgeTypes(input.edges, reasons);
  const { nodeOwnershipValid, edgeOwnershipValid, tenantScoped, graphIdConsistent } = validateOwnership(input, reasons);
  const lineagePreserved = validateLineage(input, reasons);
  const edgeReferencesValid = validateEdgeReferences(input, reasons);
  const boundary = validateBoundary(input, reasons);
  const valid = requiredFieldsValid
    && nodeTypesValid
    && edgeTypesValid
    && nodeOwnershipValid
    && edgeOwnershipValid
    && tenantScoped
    && graphIdConsistent
    && lineagePreserved
    && edgeReferencesValid
    && boundary.mutationBlocked
    && boundary.executionImpossible
    && boundary.authorityBounded;

  return Object.freeze({
    valid,
    reasonCodes: normalizeStrings(reasons) as readonly DecisionGraphReasonCode[],
    graphState: resolveGraphState(valid),
    nodeCount: input.nodes.length,
    edgeCount: input.edges.length,
    graphHash: generateDecisionGraphHash({
      ...input,
      graphState: resolveGraphState(valid),
      sealed: valid,
    }),
    deterministic: true as const,
    readOnly: true as const,
    tenantScoped,
    lineagePreserved,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
  });
}

export function createDecisionGraphContract(input: DecisionGraphContractInput): Readonly<DecisionGraphContract> {
  const validation = validateDecisionGraphContract(input);
  return Object.freeze({
    graphId: input.graphId,
    tenantId: input.tenantId,
    missionId: input.missionId,
    graphVersion: input.graphVersion,
    nodeCount: validation.nodeCount,
    edgeCount: validation.edgeCount,
    lineageReferences: normalizeStrings(input.lineageReferences),
    graphHash: validation.graphHash,
    graphState: validation.graphState,
    sealed: validation.valid,
    createdAt: input.createdAt,
  });
}

export function buildDecisionGraphObservability(contract: DecisionGraphContract): DecisionGraphObservability {
  return Object.freeze({
    graphId: contract.graphId,
    graphState: contract.graphState,
    nodeCount: contract.nodeCount,
    edgeCount: contract.edgeCount,
    graphHash: contract.graphHash,
  });
}

export function sealDecisionGraphContract(input: DecisionGraphContractInput): SealedDecisionGraphRecord {
  const validation = validateDecisionGraphContract(input);
  const contract = createDecisionGraphContract(input);
  const nodes = createDecisionGraphNodes(input.nodes);
  const edges = createDecisionGraphEdges(input.edges);
  const observability = buildDecisionGraphObservability(contract);

  return Object.freeze({
    contract,
    nodes,
    edges,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    graphOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    decisionAuthorized: false as const,
    authorityMutationAllowed: false as const,
    graphMutationAllowed: false as const,
    selfExpansionAllowed: false as const,
  });
}

export const DecisionGraphContractValidator = Object.freeze({
  validate: validateDecisionGraphContract,
});

export const DecisionGraphContractFactory = Object.freeze({
  create: createDecisionGraphContract,
  seal: sealDecisionGraphContract,
});

export const DecisionGraphNodeFactory = Object.freeze({
  create: createDecisionGraphNodes,
});

export const DecisionGraphEdgeFactory = Object.freeze({
  create: createDecisionGraphEdges,
});

export const DecisionGraphObservabilityService = Object.freeze({
  build: buildDecisionGraphObservability,
});
