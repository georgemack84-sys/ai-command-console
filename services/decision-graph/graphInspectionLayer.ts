import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  GraphInspectionInput,
  GraphInspectionObservability,
  GraphInspectionProjection,
  GraphInspectionReasonCode,
  GraphInspectionRequest,
  GraphInspectionResult,
  GraphInspectionScope,
  GraphInspectionValidation,
  SealedGraphInspectionRecord,
} from "./types";

export const MAX_VISIBLE_NODES = 1000;
export const MAX_VISIBLE_EDGES = 5000;
export const MAX_INSPECTION_DEPTH = 20;

const INSPECTION_SCOPES: readonly GraphInspectionScope[] = Object.freeze([
  "DEPENDENCIES",
  "FULL",
  "HEALTH",
  "LINEAGE",
  "TOPOLOGY",
]);

type BoundaryValidation = Readonly<{
  executionImpossible: boolean;
  authorityBounded: boolean;
  invalidBoundary: boolean;
}>;

function normalizeStrings(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.length > 0))].sort();
}

function addReason(reasons: GraphInspectionReasonCode[], reason: GraphInspectionReasonCode): void {
  if (!reasons.includes(reason)) reasons.push(reason);
}

function hashInspectionValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function requestCore(request: GraphInspectionRequest): GraphInspectionRequest {
  return Object.freeze({
    graphId: request.graphId,
    tenantId: request.tenantId,
    inspectionScope: request.inspectionScope,
    lineageReferences: normalizeStrings(request.lineageReferences),
  });
}

function collectLineage(input: Omit<GraphInspectionInput, "request">): string[] {
  return normalizeStrings([
    ...input.graph.contract.lineageReferences,
    ...input.graph.nodes.map((node) => node.lineageReference),
    ...input.proposalGraph.proposalNodes.map((node) => node.lineageReference),
    ...input.governanceGraph.governanceNodes.map((node) => node.lineageReference),
    ...input.escalationGraph.escalationNodes.map((node) => node.lineageReference),
  ]);
}

function collectGraphNodeIds(input: GraphInspectionInput): string[] {
  return normalizeStrings(input.graph.nodes.map((node) => node.nodeId));
}

function collectAllNodeIds(input: GraphInspectionInput): string[] {
  return normalizeStrings([
    ...input.graph.nodes.map((node) => node.nodeId),
    ...input.proposalGraph.proposalNodes.map((node) => node.proposalId),
    ...input.governanceGraph.governanceNodes.map((node) => node.governanceId),
    ...input.escalationGraph.escalationNodes.map((node) => node.escalationId),
    ...input.topology.nodes.map((node) => node.nodeHash),
  ]);
}

function collectAllEdgeIds(input: GraphInspectionInput): string[] {
  return normalizeStrings([
    ...input.graph.edges.map((edge) => edge.edgeId),
    ...input.dependencyGraph.edges.map((edge) => edge.edgeId),
    ...input.proposalGraph.edges.map((edge) => edge.edgeId),
    ...input.governanceGraph.edges.map((edge) => edge.edgeId),
    ...input.escalationGraph.edges.map((edge) => edge.edgeId),
    ...input.topology.edges.map((edge) => edge.edgeHash),
  ]);
}

function collectDependencyIds(input: GraphInspectionInput): string[] {
  return normalizeStrings(input.dependencyGraph.edges.map((edge) => edge.edgeId));
}

function projectNodes(scope: GraphInspectionScope, input: GraphInspectionInput): string[] {
  switch (scope) {
    case "HEALTH":
      return collectGraphNodeIds(input);
    case "LINEAGE":
      return normalizeStrings([
        ...input.graph.nodes.map((node) => node.nodeId),
        ...input.proposalGraph.proposalNodes.map((node) => node.proposalId),
        ...input.governanceGraph.governanceNodes.map((node) => node.governanceId),
        ...input.escalationGraph.escalationNodes.map((node) => node.escalationId),
      ]);
    case "DEPENDENCIES":
      return collectGraphNodeIds(input);
    case "TOPOLOGY":
      return normalizeStrings(input.topology.nodes.map((node) => node.nodeHash));
    case "FULL":
      return collectAllNodeIds(input);
  }

  return [];
}

function projectEdges(scope: GraphInspectionScope, input: GraphInspectionInput): string[] {
  switch (scope) {
    case "HEALTH":
      return normalizeStrings(input.graph.edges.map((edge) => edge.edgeId));
    case "LINEAGE":
      return normalizeStrings([
        ...input.proposalGraph.edges.map((edge) => edge.edgeId),
        ...input.governanceGraph.edges.map((edge) => edge.edgeId),
        ...input.escalationGraph.edges.map((edge) => edge.edgeId),
      ]);
    case "DEPENDENCIES":
      return collectDependencyIds(input);
    case "TOPOLOGY":
      return normalizeStrings(input.topology.edges.map((edge) => edge.edgeHash));
    case "FULL":
      return collectAllEdgeIds(input);
  }

  return [];
}

function projectDependencyIds(scope: GraphInspectionScope, input: GraphInspectionInput): string[] {
  return scope === "LINEAGE" ? [] : collectDependencyIds(input);
}

function addProjectionReasons(input: GraphInspectionInput, reasons: GraphInspectionReasonCode[]): void {
  const nodeIds = projectNodes(input.request.inspectionScope, input);
  const edgeIds = projectEdges(input.request.inspectionScope, input);
  const dependencyIds = projectDependencyIds(input.request.inspectionScope, input);

  addReason(
    reasons,
    nodeIds.length > MAX_VISIBLE_NODES ? "VISIBLE_NODE_LIMIT_APPLIED" : "VISIBLE_NODE_LIMIT_VALID",
  );
  addReason(
    reasons,
    edgeIds.length > MAX_VISIBLE_EDGES ? "VISIBLE_EDGE_LIMIT_APPLIED" : "VISIBLE_EDGE_LIMIT_VALID",
  );
  addReason(
    reasons,
    dependencyIds.length > MAX_INSPECTION_DEPTH ? "INSPECTION_DEPTH_LIMIT_APPLIED" : "INSPECTION_DEPTH_LIMIT_VALID",
  );
}

function applyVisibilityLimit(
  values: readonly string[],
  limit: number,
  reasons: GraphInspectionReasonCode[],
  validReason: GraphInspectionReasonCode,
  appliedReason: GraphInspectionReasonCode,
): { values: string[]; clipped: boolean } {
  const clipped = values.length > limit;
  addReason(reasons, clipped ? appliedReason : validReason);
  return {
    values: values.slice(0, limit),
    clipped,
  };
}

function applyDepthLimit(
  values: readonly string[],
  reasons: GraphInspectionReasonCode[],
): { values: string[]; clipped: boolean } {
  const clipped = values.length > MAX_INSPECTION_DEPTH;
  addReason(reasons, clipped ? "INSPECTION_DEPTH_LIMIT_APPLIED" : "INSPECTION_DEPTH_LIMIT_VALID");
  return {
    values: values.slice(0, MAX_INSPECTION_DEPTH),
    clipped,
  };
}

function validateSealedArtifacts(input: GraphInspectionInput, reasons: GraphInspectionReasonCode[]): boolean {
  const graphSealed = input.graph.sealed && input.graph.contract.sealed;
  const dependencySealed = input.dependencyGraph.sealed;
  const proposalSealed = input.proposalGraph.sealed;
  const governanceSealed = input.governanceGraph.sealed;
  const escalationSealed = input.escalationGraph.sealed;
  const topologySealed = input.topology.sealed;

  addReason(reasons, graphSealed ? "SEALED_GRAPH_REQUIRED" : "GRAPH_UNSEALED");
  addReason(reasons, dependencySealed ? "DEPENDENCY_GRAPH_REQUIRED" : "DEPENDENCY_GRAPH_UNSEALED");
  addReason(reasons, proposalSealed ? "PROPOSAL_GRAPH_REQUIRED" : "PROPOSAL_GRAPH_UNSEALED");
  addReason(reasons, governanceSealed ? "GOVERNANCE_GRAPH_REQUIRED" : "GOVERNANCE_GRAPH_UNSEALED");
  addReason(reasons, escalationSealed ? "ESCALATION_GRAPH_REQUIRED" : "ESCALATION_GRAPH_UNSEALED");
  addReason(reasons, topologySealed ? "TOPOLOGY_REQUIRED" : "TOPOLOGY_UNSEALED");

  return graphSealed
    && dependencySealed
    && proposalSealed
    && governanceSealed
    && escalationSealed
    && topologySealed;
}

function validateScope(request: GraphInspectionRequest, reasons: GraphInspectionReasonCode[]): boolean {
  const valid = INSPECTION_SCOPES.includes(request.inspectionScope);
  addReason(reasons, valid ? "INSPECTION_SCOPE_VALID" : "INSPECTION_SCOPE_INVALID");
  return valid;
}

function validateIdentity(input: GraphInspectionInput, reasons: GraphInspectionReasonCode[]): boolean {
  const valid = input.request.graphId === input.graph.contract.graphId
    && input.dependencyGraph.result.graphId === input.request.graphId
    && input.proposalGraph.result.graphId === input.request.graphId
    && input.governanceGraph.result.graphId === input.request.graphId
    && input.escalationGraph.result.graphId === input.request.graphId
    && input.topology.result.graphId === input.request.graphId;
  addReason(reasons, valid ? "GRAPH_ID_MATCHED" : "GRAPH_ID_MISMATCH");
  return valid;
}

function validateTenantScope(input: GraphInspectionInput, reasons: GraphInspectionReasonCode[]): boolean {
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
    && input.topology.nodes.every((node) => node.tenantId === tenantId);
  addReason(reasons, valid ? "TENANT_SCOPE_VALID" : "CROSS_TENANT_ARTIFACTS_BLOCKED");
  return valid;
}

function validateOwnership(input: GraphInspectionInput, reasons: GraphInspectionReasonCode[]): boolean {
  const graphId = input.request.graphId;
  const tenantId = input.request.tenantId;
  const valid = input.graph.nodes.every((node) => node.graphId === graphId)
    && input.graph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.dependencyGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.proposalGraph.proposalNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.proposalGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.governanceGraph.governanceNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.governanceGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.escalationGraph.escalationNodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.escalationGraph.edges.every((edge) => edge.graphId === graphId && edge.tenantId === tenantId)
    && input.topology.nodes.every((node) => node.graphId === graphId && node.tenantId === tenantId)
    && input.topology.edges.every((edge) => edge.graphId === graphId);
  addReason(reasons, valid ? "OWNERSHIP_EXPLICIT" : "ARTIFACT_OWNERSHIP_MISMATCH");
  return valid;
}

function validateLineage(input: GraphInspectionInput, reasons: GraphInspectionReasonCode[]): boolean {
  const lineageReferences = normalizeStrings(input.request.lineageReferences);
  const requiredLineage = collectLineage({
    graph: input.graph,
    dependencyGraph: input.dependencyGraph,
    proposalGraph: input.proposalGraph,
    governanceGraph: input.governanceGraph,
    escalationGraph: input.escalationGraph,
    topology: input.topology,
    inspectionMutationAttempted: input.inspectionMutationAttempted,
    executionRequested: input.executionRequested,
    workflowRoutingRequested: input.workflowRoutingRequested,
    recommendationCreationRequested: input.recommendationCreationRequested,
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
    && requiredLineage.every((reference) => lineageReferences.includes(reference));
  addReason(reasons, lineageReferences.length > 0 ? "LINEAGE_REFERENCES_PRESENT" : "LINEAGE_REFERENCES_MISSING");
  addReason(reasons, valid ? "LINEAGE_INTEGRITY_VALID" : "LINEAGE_INTEGRITY_FAILED");
  return valid;
}

function validateIntegrity(input: GraphInspectionInput, reasons: GraphInspectionReasonCode[]): boolean {
  const valid = input.graph.validation.valid
    && input.dependencyGraph.validation.valid
    && input.dependencyGraph.result.sealed
    && input.proposalGraph.validation.valid
    && input.proposalGraph.result.sealed
    && input.governanceGraph.validation.valid
    && input.governanceGraph.result.sealed
    && input.escalationGraph.validation.valid
    && input.escalationGraph.result.sealed
    && input.topology.validation.valid
    && input.topology.result.sealed
    && input.topology.result.topologyDeterministic;
  addReason(reasons, valid ? "GRAPH_INTEGRITY_HEALTHY" : "GRAPH_INTEGRITY_FAILURE");
  return valid;
}

function validateBoundary(input: GraphInspectionInput, reasons: GraphInspectionReasonCode[]): BoundaryValidation {
  const executionImpossible = input.executionRequested !== true && input.workflowRoutingRequested !== true;
  const authorityBounded = input.authorityExpansionRequested !== true;
  const invalidBoundary = input.inspectionMutationAttempted === true
    || input.recommendationCreationRequested === true
    || input.graphOptimizationRequested === true
    || input.ownershipMutationRequested === true
    || input.executionRequested === true
    || input.workflowRoutingRequested === true
    || input.authorityExpansionRequested === true;

  addReason(reasons, input.inspectionMutationAttempted === true ? "INSPECTION_ATTEMPTS_MUTATION" : "INSPECTION_MUTATION_BLOCKED");
  addReason(reasons, input.executionRequested === true ? "EXECUTION_REQUEST_BLOCKED" : "EXECUTION_IMPOSSIBLE");
  addReason(reasons, input.workflowRoutingRequested === true ? "WORKFLOW_ROUTING_DETECTED" : "WORKFLOW_ROUTING_BLOCKED");
  addReason(reasons, input.recommendationCreationRequested === true ? "RECOMMENDATION_CREATION_DETECTED" : "RECOMMENDATION_CREATION_BLOCKED");
  addReason(reasons, input.graphOptimizationRequested === true ? "GRAPH_OPTIMIZATION_DETECTED" : "GRAPH_OPTIMIZATION_BLOCKED");
  addReason(reasons, input.ownershipMutationRequested === true ? "OWNERSHIP_MUTATION_DETECTED" : "OWNERSHIP_MUTATION_BLOCKED");
  addReason(reasons, authorityBounded ? "AUTHORITY_BOUNDARY_PRESERVED" : "AUTHORITY_EXPANSION_DETECTED");
  addReason(reasons, "GRAPH_INSPECTION_IS_NOT_CONTROL");

  return Object.freeze({
    executionImpossible,
    authorityBounded,
    invalidBoundary,
  });
}

export function buildGraphInspectionRequest(
  input: Omit<GraphInspectionInput, "request"> & { inspectionScope?: GraphInspectionScope },
): GraphInspectionRequest {
  return Object.freeze({
    graphId: input.graph.contract.graphId,
    tenantId: input.graph.contract.tenantId,
    inspectionScope: input.inspectionScope ?? "FULL",
    lineageReferences: collectLineage(input),
  });
}

export function createGraphInspectionProjection(input: GraphInspectionInput): GraphInspectionProjection {
  const reasons: GraphInspectionReasonCode[] = [];
  const request = requestCore(input.request);
  const limitedNodes = applyVisibilityLimit(
    projectNodes(request.inspectionScope, input),
    MAX_VISIBLE_NODES,
    reasons,
    "VISIBLE_NODE_LIMIT_VALID",
    "VISIBLE_NODE_LIMIT_APPLIED",
  );
  const limitedEdges = applyVisibilityLimit(
    projectEdges(request.inspectionScope, input),
    MAX_VISIBLE_EDGES,
    reasons,
    "VISIBLE_EDGE_LIMIT_VALID",
    "VISIBLE_EDGE_LIMIT_APPLIED",
  );
  const depthLimitedDependencies = applyDepthLimit(projectDependencyIds(request.inspectionScope, input), reasons);

  const topologyNodeHashes = request.inspectionScope === "TOPOLOGY" || request.inspectionScope === "FULL"
    ? normalizeStrings(input.topology.nodes.map((node) => node.nodeHash))
    : [];
  const topologyEdgeHashes = request.inspectionScope === "TOPOLOGY" || request.inspectionScope === "FULL"
    ? normalizeStrings(input.topology.edges.map((edge) => edge.edgeHash))
    : [];

  return Object.freeze({
    scope: request.inspectionScope,
    nodeIds: Object.freeze(limitedNodes.values),
    edgeIds: Object.freeze(limitedEdges.values),
    dependencyIds: Object.freeze(depthLimitedDependencies.values),
    lineageReferences: Object.freeze(
      request.inspectionScope === "HEALTH" ? [] : request.lineageReferences,
    ),
    topologyNodeHashes: Object.freeze(topologyNodeHashes),
    topologyEdgeHashes: Object.freeze(topologyEdgeHashes),
    clipped: limitedNodes.clipped || limitedEdges.clipped || depthLimitedDependencies.clipped,
  });
}

export function validateGraphInspection(input: GraphInspectionInput): GraphInspectionValidation {
  const reasons: GraphInspectionReasonCode[] = [];
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };

  const sealedArtifacts = validateSealedArtifacts(normalizedInput, reasons);
  const scopeValid = validateScope(request, reasons);
  const identityValid = validateIdentity(normalizedInput, reasons);
  const tenantIsolationVerified = validateTenantScope(normalizedInput, reasons);
  const ownershipValid = validateOwnership(normalizedInput, reasons);
  const lineageIntegrity = validateLineage(normalizedInput, reasons);
  const integrityHealthy = validateIntegrity(normalizedInput, reasons);
  addProjectionReasons(normalizedInput, reasons);
  const projection = createGraphInspectionProjection(normalizedInput);
  const boundary = validateBoundary(normalizedInput, reasons);

  const invalid = !sealedArtifacts
    || !scopeValid
    || !identityValid
    || !tenantIsolationVerified
    || !ownershipValid
    || !lineageIntegrity
    || boundary.invalidBoundary;
  const escalated = !invalid && !integrityHealthy;

  const inspectionState: GraphInspectionResult["inspectionState"] = escalated
    ? "ESCALATED"
    : projection.clipped
      ? "DEGRADED"
      : request.inspectionScope === "FULL"
        ? "HEALTHY"
        : "LIMITED";

  return Object.freeze({
    valid: !invalid && !escalated,
    validationState: invalid ? "INVALID" : escalated ? "ESCALATED" : "VALID",
    reasonCodes: normalizeStrings(reasons) as readonly GraphInspectionReasonCode[],
    inspectionState,
    dependencyCount: projection.dependencyIds.length,
    nodeCount: projection.nodeIds.length,
    edgeCount: projection.edgeIds.length,
    topologyDeterministic: input.topology.result.topologyDeterministic,
    lineageIntegrity,
    tenantIsolationVerified,
    deterministic: true as const,
    readOnly: true as const,
    executionImpossible: boundary.executionImpossible,
    authorityBounded: boundary.authorityBounded,
    controlSurfaceAbsent: true as const,
  });
}

export function buildGraphInspectionResult(input: GraphInspectionInput): GraphInspectionResult {
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };
  const validation = validateGraphInspection(normalizedInput);
  const projection = createGraphInspectionProjection(normalizedInput);
  const inspectionHash = hashInspectionValue("graph-inspection-layer", {
    request,
    projection,
    inspectionState: validation.inspectionState,
    topologyDeterministic: input.topology.result.topologyDeterministic,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
  });

  return Object.freeze({
    graphId: request.graphId,
    inspectionState: validation.inspectionState,
    dependencyCount: validation.dependencyCount,
    nodeCount: validation.nodeCount,
    edgeCount: validation.edgeCount,
    topologyDeterministic: validation.topologyDeterministic,
    lineageIntegrity: validation.lineageIntegrity,
    tenantIsolationVerified: validation.tenantIsolationVerified,
    inspectionHash,
  });
}

export function buildGraphInspectionObservability(result: GraphInspectionResult): GraphInspectionObservability {
  return Object.freeze({
    graphId: result.graphId,
    inspectionState: result.inspectionState,
    nodeCount: result.nodeCount,
    edgeCount: result.edgeCount,
    lineageIntegrity: result.lineageIntegrity,
    inspectionHash: result.inspectionHash,
  });
}

export function sealGraphInspection(input: GraphInspectionInput): SealedGraphInspectionRecord {
  const request = requestCore(input.request);
  const normalizedInput = {
    ...input,
    request,
  };
  const projection = createGraphInspectionProjection(normalizedInput);
  const validation = validateGraphInspection(normalizedInput);
  const result = buildGraphInspectionResult(normalizedInput);
  const observability = buildGraphInspectionObservability(result);

  return Object.freeze({
    result,
    projection,
    validation,
    observability,
    sealed: true as const,
    readOnly: true as const,
    inspectionOnly: true as const,
    executionAuthorized: false as const,
    workflowRoutingAllowed: false as const,
    graphMutationAllowed: false as const,
    recommendationCreationAllowed: false as const,
    graphOptimizationAllowed: false as const,
    authorityMutationAllowed: false as const,
    ownershipMutationAllowed: false as const,
    controlSurfacePresent: false as const,
  });
}

export const GraphInspectionValidator = Object.freeze({
  validate: validateGraphInspection,
});

export const GraphInspectionLayer = Object.freeze({
  buildRequest: buildGraphInspectionRequest,
  createProjection: createGraphInspectionProjection,
  buildResult: buildGraphInspectionResult,
  seal: sealGraphInspection,
});

export const GraphInspectionObservabilityService = Object.freeze({
  build: buildGraphInspectionObservability,
});
