import { describe, expect, it } from "vitest";
import {
  buildEscalationGraphRequest,
  buildGovernanceInfluenceRequest,
  buildProposalRelationshipRequest,
  buildRecommendationDependencyRequest,
  buildReplayableGraphTopologyRequest,
  sealDecisionGraphContract,
  sealEscalationGraph,
  sealGovernanceInfluenceGraph,
  sealProposalRelationshipGraph,
  sealRecommendationDependencyGraph,
  sealReplayableGraphTopology,
  type DecisionGraphContractInput,
  type DecisionGraphNodeInput,
  type EscalationNodeInput,
  type GovernanceNodeInput,
  type ProposalNodeInput,
  type ReplayableGraphTopologyInput,
} from "@/services/decision-graph";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    {
      nodeId: "boundary-node",
      graphId: "graph-55f",
      nodeType: "CONSTRAINT",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-boundary-node",
    },
    {
      nodeId: "governance-node",
      graphId: "graph-55f",
      nodeType: "GOVERNANCE",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-governance-node",
    },
    {
      nodeId: "recommendation-anchor",
      graphId: "graph-55f",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-anchor",
    },
    {
      nodeId: "supervision-node",
      graphId: "graph-55f",
      nodeType: "ESCALATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-supervision-node",
    },
  ];

  return Object.freeze({
    graphId: "graph-55f",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T10:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

function proposalNodes(): readonly ProposalNodeInput[] {
  return [
    {
      proposalId: "proposal-a",
      graphId: "graph-55f",
      tenantId: "tenant-alpha",
      proposalType: "MISSION",
      lineageReference: "lineage-proposal-a",
    },
  ];
}

function governanceNodes(): readonly GovernanceNodeInput[] {
  return [
    {
      governanceId: "governance-a",
      graphId: "graph-55f",
      tenantId: "tenant-alpha",
      governanceType: "POLICY",
      lineageReference: "lineage-governance-a",
    },
  ];
}

function escalationNodes(): readonly EscalationNodeInput[] {
  return [
    {
      escalationId: "escalation-a",
      graphId: "graph-55f",
      tenantId: "tenant-alpha",
      escalationType: "REVIEW",
      lineageReference: "lineage-escalation-a",
    },
  ];
}

function buildSealedUpstream() {
  const graph = sealDecisionGraphContract(graphInput());
  const dependencyGraph = sealRecommendationDependencyGraph({
    request: {
      ...buildRecommendationDependencyRequest({ graph }),
      recommendationNodeIds: ["recommendation-anchor"],
      dependencyNodeIds: ["boundary-node", "governance-node"],
    },
    graph,
  });
  const proposalGraph = sealProposalRelationshipGraph({
    request: {
      ...buildProposalRelationshipRequest({
        graph,
        dependencyGraph,
        proposalNodes: proposalNodes(),
      }),
      proposalNodeIds: ["proposal-a"],
      relationshipNodeIds: ["boundary-node", "governance-node"],
    },
    graph,
    dependencyGraph,
    proposalNodes: proposalNodes(),
  });
  const governanceGraph = sealGovernanceInfluenceGraph({
    request: {
      ...buildGovernanceInfluenceRequest({
        graph,
        dependencyGraph,
        proposalGraph,
        governanceNodes: governanceNodes(),
      }),
      governanceNodeIds: ["governance-a"],
      influencedNodeIds: ["boundary-node", "recommendation-anchor"],
    },
    graph,
    dependencyGraph,
    proposalGraph,
    governanceNodes: governanceNodes(),
  });
  const escalationGraph = sealEscalationGraph({
    request: {
      ...buildEscalationGraphRequest({
        graph,
        dependencyGraph,
        proposalGraph,
        governanceGraph,
        escalationNodes: escalationNodes(),
      }),
      escalationNodeIds: ["escalation-a"],
      targetNodeIds: ["boundary-node", "recommendation-anchor"],
    },
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationNodes: escalationNodes(),
  });

  return { graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph };
}

function topologyInput(overrides: Partial<ReplayableGraphTopologyInput> = {}): ReplayableGraphTopologyInput {
  const base = buildSealedUpstream();
  const request = buildReplayableGraphTopologyRequest(base);
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies ReplayableGraphTopologyInput);
}

describe("replayableGraphTopology", () => {
  it("reconstructs topology reproducibly with deterministic hashes", () => {
    const input = topologyInput();
    const first = sealReplayableGraphTopology(input);
    const second = sealReplayableGraphTopology(input);

    expect(first).toEqual(second);
    expect(first.result.graphState).toBe("SEALED");
    expect(first.result.topologyDeterministic).toBe(true);
    expect(first.result.topologyHash).toHaveLength(64);
    expect(first.result.reconstructionHash).toHaveLength(64);
  });

  it("keeps same inputs producing same outputs", () => {
    const input = topologyInput();
    const reversed = topologyInput({
      request: {
        ...input.request,
        nodeHashes: [...input.request.nodeHashes].reverse(),
        edgeHashes: [...input.request.edgeHashes].reverse(),
      },
    });
    const normal = sealReplayableGraphTopology(input);
    const shuffled = sealReplayableGraphTopology(reversed);

    expect(normal.result.topologyHash).toBe(shuffled.result.topologyHash);
    expect(shuffled.validation.valid).toBe(false);
    expect(shuffled.validation.reasonCodes).toContain("TOPOLOGY_ORDERING_INCONSISTENT");
  });

  it("blocks cross-tenant topology drift", () => {
    const base = topologyInput();
    const record = sealReplayableGraphTopology({
      ...base,
      graph: {
        ...base.graph,
        nodes: base.graph.nodes.map((node, index) => index === 0 ? { ...node, tenantId: "tenant-beta" } : node),
      },
    });

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_NODES_BLOCKED");
  });

  it("invalidates duplicate nodes and duplicate edges", () => {
    const base = topologyInput();
    const duplicateNodes = sealReplayableGraphTopology({
      ...base,
      request: {
        ...base.request,
        nodeHashes: [...base.request.nodeHashes, base.request.nodeHashes[0]],
      },
    });
    const duplicateEdges = sealReplayableGraphTopology({
      ...base,
      request: {
        ...base.request,
        edgeHashes: [...base.request.edgeHashes, base.request.edgeHashes[0]],
      },
    });

    expect(duplicateNodes.validation.valid).toBe(false);
    expect(duplicateNodes.validation.reasonCodes).toContain("DUPLICATE_NODE_HASHES");
    expect(duplicateEdges.validation.valid).toBe(false);
    expect(duplicateEdges.validation.reasonCodes).toContain("DUPLICATE_EDGE_HASHES");
  });

  it("detects incomplete reconstruction inputs", () => {
    const base = topologyInput();
    const missingNode = sealReplayableGraphTopology({
      ...base,
      request: {
        ...base.request,
        nodeHashes: base.request.nodeHashes.slice(1),
      },
    });
    const missingEdge = sealReplayableGraphTopology({
      ...base,
      request: {
        ...base.request,
        edgeHashes: base.request.edgeHashes.slice(1),
      },
    });

    expect(missingNode.validation.valid).toBe(false);
    expect(missingNode.validation.reasonCodes).toContain("RECONSTRUCTION_INPUTS_INCOMPLETE");
    expect(missingEdge.validation.valid).toBe(false);
    expect(missingEdge.validation.reasonCodes).toContain("RECONSTRUCTION_INPUTS_INCOMPLETE");
  });

  it("detects topology mutation", () => {
    const record = sealReplayableGraphTopology({
      ...topologyInput(),
      topologyMutationDetected: true,
    });

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("TOPOLOGY_MUTATION_DETECTED");
  });

  it("enforces topology ceilings", () => {
    const base = topologyInput();
    const nodesExceeded = sealReplayableGraphTopology({
      ...base,
      request: {
        ...base.request,
        nodeHashes: Array.from({ length: 1001 }, (_, index) => `node-hash-${index}`),
      },
    });
    const edgesExceeded = sealReplayableGraphTopology({
      ...base,
      request: {
        ...base.request,
        edgeHashes: Array.from({ length: 5001 }, (_, index) => `edge-hash-${index}`),
      },
    });
    const depthExceeded = sealReplayableGraphTopology({
      ...base,
      request: {
        ...base.request,
        edgeHashes: Array.from({ length: 21 }, (_, index) => `edge-hash-depth-${index}`),
      },
    });

    expect(nodesExceeded.validation.valid).toBe(false);
    expect(nodesExceeded.validation.reasonCodes).toContain("TOPOLOGY_NODE_LIMIT_EXCEEDED");
    expect(edgesExceeded.validation.valid).toBe(false);
    expect(edgesExceeded.validation.reasonCodes).toContain("TOPOLOGY_EDGE_LIMIT_EXCEEDED");
    expect(depthExceeded.validation.valid).toBe(false);
    expect(depthExceeded.validation.reasonCodes).toContain("TOPOLOGY_DEPTH_EXCEEDED");
  });

  it("preserves lineage and rejects missing lineage", () => {
    const valid = sealReplayableGraphTopology(topologyInput());
    const missing = sealReplayableGraphTopology({
      ...topologyInput(),
      request: {
        ...topologyInput().request,
        lineageReferences: [],
      },
    });

    expect(valid.result.lineageIntegrity).toBe(true);
    expect(missing.validation.valid).toBe(false);
    expect(missing.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("keeps execution impossible and workflow routing absent", () => {
    const execution = sealReplayableGraphTopology({
      ...topologyInput(),
      executionRequested: true,
    });
    const workflow = sealReplayableGraphTopology({
      ...topologyInput(),
      workflowRoutingRequested: true,
    });
    const authority = sealReplayableGraphTopology({
      ...topologyInput(),
      authorityExpansionRequested: true,
    });
    const healthy = sealReplayableGraphTopology(topologyInput());

    expect(execution.validation.valid).toBe(false);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.valid).toBe(false);
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(authority.validation.valid).toBe(false);
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.topologyOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.topologyMutationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.graphOptimizationAllowed).toBe(false);
    expect(healthy.selfExpansionAllowed).toBe(false);
  });

  it("does not mutate sealed inputs", () => {
    const input = topologyInput();
    const before = JSON.stringify(input);

    sealReplayableGraphTopology(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
