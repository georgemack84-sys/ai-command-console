import { describe, expect, it } from "vitest";
import {
  buildProposalRelationshipRequest,
  buildRecommendationDependencyRequest,
  sealDecisionGraphContract,
  sealProposalRelationshipGraph,
  sealRecommendationDependencyGraph,
  type DecisionGraphContractInput,
  type DecisionGraphNodeInput,
  type ProposalNodeInput,
  type ProposalRelationshipGraphInput,
} from "@/services/decision-graph";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    {
      nodeId: "constraint-node",
      graphId: "graph-55c",
      nodeType: "CONSTRAINT",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-constraint-node",
    },
    {
      nodeId: "escalation-node",
      graphId: "graph-55c",
      nodeType: "ESCALATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-escalation-node",
    },
    {
      nodeId: "governance-node",
      graphId: "graph-55c",
      nodeType: "GOVERNANCE",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-governance-node",
    },
    {
      nodeId: "recommendation-anchor",
      graphId: "graph-55c",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-anchor",
    },
  ];

  return Object.freeze({
    graphId: "graph-55c",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T07:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

function proposalNodes(overrides?: readonly ProposalNodeInput[]): readonly ProposalNodeInput[] {
  return overrides ?? [
    {
      proposalId: "proposal-b",
      graphId: "graph-55c",
      tenantId: "tenant-alpha",
      proposalType: "RECOMMENDATION",
      lineageReference: "lineage-proposal-b",
    },
    {
      proposalId: "proposal-a",
      graphId: "graph-55c",
      tenantId: "tenant-alpha",
      proposalType: "MISSION",
      lineageReference: "lineage-proposal-a",
    },
  ];
}

function buildDependencyGraphFixture() {
  const graph = sealDecisionGraphContract(graphInput());
  const baseRequest = buildRecommendationDependencyRequest({ graph });
  return {
    graph,
    dependencyGraph: sealRecommendationDependencyGraph({
      request: {
        ...baseRequest,
        recommendationNodeIds: ["recommendation-anchor"],
        dependencyNodeIds: ["governance-node", "constraint-node"],
      },
      graph,
    }),
  };
}

function relationshipInput(overrides: Partial<ProposalRelationshipGraphInput> = {}): ProposalRelationshipGraphInput {
  const { graph, dependencyGraph } = buildDependencyGraphFixture();
  const proposals = proposalNodes();
  const request = buildProposalRelationshipRequest({
    graph,
    dependencyGraph,
    proposalNodes: proposals,
  });

  return Object.freeze({
    request: {
      ...request,
      proposalNodeIds: ["proposal-b", "proposal-a"],
      relationshipNodeIds: ["escalation-node", "governance-node"],
    },
    graph,
    dependencyGraph,
    proposalNodes: proposals,
    ...overrides,
  } satisfies ProposalRelationshipGraphInput);
}

describe("proposalRelationshipGraph", () => {
  it("creates deterministic relationship graphs and reproducible hashes", () => {
    const input = relationshipInput();
    const reversed = relationshipInput({
      request: {
        ...input.request,
        proposalNodeIds: [...input.request.proposalNodeIds].reverse(),
        relationshipNodeIds: [...input.request.relationshipNodeIds].reverse(),
      },
      proposalNodes: [...input.proposalNodes].reverse(),
    });

    const first = sealProposalRelationshipGraph(input);
    const second = sealProposalRelationshipGraph(reversed);

    expect(first).toEqual(second);
    expect(first.result.graphState).toBe("SEALED");
    expect(first.result.sealed).toBe(true);
    expect(first.result.relationshipCount).toBe(4);
    expect(first.result.relationshipHash).toHaveLength(64);
  });

  it("keeps relationship sealing deterministic and count accurate", () => {
    const first = sealProposalRelationshipGraph(relationshipInput());
    const second = sealProposalRelationshipGraph(relationshipInput());

    expect(first.result).toEqual(second.result);
    expect(first.edges).toHaveLength(4);
    expect(first.validation.relationshipCount).toBe(4);
  });

  it("blocks unsealed graph inputs and graphId mismatches", () => {
    const base = relationshipInput();
    const unsealed = sealProposalRelationshipGraph({
      ...base,
      graph: {
        ...base.graph,
        contract: {
          ...base.graph.contract,
          sealed: false,
          graphState: "VALIDATED",
        },
      },
    });
    const mismatched = sealProposalRelationshipGraph({
      ...base,
      request: {
        ...base.request,
        graphId: "graph-other",
      },
    });

    expect(unsealed.validation.valid).toBe(false);
    expect(unsealed.validation.reasonCodes).toContain("GRAPH_UNSEALED");
    expect(mismatched.validation.valid).toBe(false);
    expect(mismatched.validation.reasonCodes).toContain("GRAPH_ID_MISMATCH");
  });

  it("blocks unsealed dependency graphs", () => {
    const base = relationshipInput();
    const record = sealProposalRelationshipGraph({
      ...base,
      dependencyGraph: {
        ...base.dependencyGraph,
        result: {
          ...base.dependencyGraph.result,
          sealed: false,
          graphState: "VALIDATED",
        },
      },
    });

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("DEPENDENCY_GRAPH_UNSEALED");
  });

  it("blocks cross-tenant relationships and invalid proposal ownership", () => {
    const record = sealProposalRelationshipGraph(relationshipInput({
      proposalNodes: proposalNodes([
        {
          proposalId: "proposal-a",
          graphId: "graph-55c",
          tenantId: "tenant-beta",
          proposalType: "MISSION",
          lineageReference: "lineage-proposal-a",
        },
      ]),
      request: {
        graphId: "graph-55c",
        tenantId: "tenant-alpha",
        proposalNodeIds: ["proposal-a"],
        relationshipNodeIds: ["governance-node"],
        lineageReferences: ["lineage-proposal-a", "lineage-governance-node"],
      },
    }));

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_NODES_BLOCKED");
  });

  it("invalidates missing proposal nodes and missing relationship nodes", () => {
    const missingProposal = sealProposalRelationshipGraph({
      ...relationshipInput(),
      request: {
        ...relationshipInput().request,
        proposalNodeIds: ["missing-proposal"],
      },
    });
    const missingRelationship = sealProposalRelationshipGraph({
      ...relationshipInput(),
      request: {
        ...relationshipInput().request,
        relationshipNodeIds: ["missing-node"],
      },
    });

    expect(missingProposal.validation.valid).toBe(false);
    expect(missingProposal.validation.reasonCodes).toContain("PROPOSAL_NODE_MISSING");
    expect(missingRelationship.validation.valid).toBe(false);
    expect(missingRelationship.validation.reasonCodes).toContain("RELATIONSHIP_NODE_MISSING");
    expect(missingRelationship.validation.reasonCodes).toContain("RELATIONSHIP_TARGET_UNKNOWN_NODE");
  });

  it("blocks self relationships and circular proposal chains", () => {
    const selfRelationship = sealProposalRelationshipGraph({
      ...relationshipInput(),
      request: {
        ...relationshipInput().request,
        relationshipNodeIds: ["proposal-a"],
      },
    });
    const circular = sealProposalRelationshipGraph({
      ...relationshipInput(),
      request: {
        ...relationshipInput().request,
        proposalNodeIds: ["proposal-a", "proposal-b"],
        relationshipNodeIds: ["proposal-b"],
      },
    });

    expect(selfRelationship.validation.valid).toBe(false);
    expect(selfRelationship.validation.reasonCodes).toContain("SELF_RELATIONSHIP_DETECTED");
    expect(circular.validation.valid).toBe(false);
    expect(circular.validation.reasonCodes).toContain("CIRCULAR_RELATIONSHIP_DETECTED");
  });

  it("blocks mutated references, relationship ceilings, and depth overflow", () => {
    const mutated = sealProposalRelationshipGraph({
      ...relationshipInput(),
      request: {
        ...relationshipInput().request,
        proposalNodeIds: ["proposal-a"],
      },
    });

    const overflowNodes = Array.from({ length: 51 }, (_, index) => ({
      nodeId: `rel-node-${index}`,
      graphId: "graph-55c",
      nodeType: "SIMULATION" as const,
      tenantId: "tenant-alpha",
      lineageReference: `lineage-rel-node-${index}`,
    }));
    const graph = sealDecisionGraphContract(graphInput({
      nodes: [
        {
          nodeId: "recommendation-anchor",
          graphId: "graph-55c",
          nodeType: "RECOMMENDATION",
          tenantId: "tenant-alpha",
          lineageReference: "lineage-recommendation-anchor",
        },
        ...overflowNodes,
      ],
      lineageReferences: [
        "lineage-recommendation-anchor",
        ...overflowNodes.map((node) => node.lineageReference),
      ],
    }));
    const dependencyRequest = buildRecommendationDependencyRequest({ graph });
    const sealedDependencyGraph = sealRecommendationDependencyGraph({
      request: {
        ...dependencyRequest,
        recommendationNodeIds: ["recommendation-anchor"],
        dependencyNodeIds: overflowNodes.slice(0, 10).map((node) => node.nodeId),
      },
      graph,
    });
    const ceiling = sealProposalRelationshipGraph({
      request: {
        graphId: "graph-55c",
        tenantId: "tenant-alpha",
        proposalNodeIds: ["proposal-a"],
        relationshipNodeIds: overflowNodes.map((node) => node.nodeId),
        lineageReferences: [
          "lineage-proposal-a",
          ...overflowNodes.map((node) => node.lineageReference),
        ],
      },
      graph,
      dependencyGraph: sealedDependencyGraph,
      proposalNodes: [
        {
          proposalId: "proposal-a",
          graphId: "graph-55c",
          tenantId: "tenant-alpha",
          proposalType: "MISSION",
          lineageReference: "lineage-proposal-a",
        },
      ],
    });
    const depth = sealProposalRelationshipGraph({
      request: {
        graphId: "graph-55c",
        tenantId: "tenant-alpha",
        proposalNodeIds: ["proposal-a"],
        relationshipNodeIds: overflowNodes.slice(0, 11).map((node) => node.nodeId),
        lineageReferences: [
          "lineage-proposal-a",
          ...overflowNodes.slice(0, 11).map((node) => node.lineageReference),
        ],
      },
      graph,
      dependencyGraph: sealedDependencyGraph,
      proposalNodes: [
        {
          proposalId: "proposal-a",
          graphId: "graph-55c",
          tenantId: "tenant-alpha",
          proposalType: "MISSION",
          lineageReference: "lineage-proposal-a",
        },
      ],
    });

    expect(mutated.validation.valid).toBe(false);
    expect(mutated.validation.reasonCodes).toContain("RELATIONSHIP_REFERENCES_MUTATED");
    expect(ceiling.validation.valid).toBe(false);
    expect(ceiling.validation.reasonCodes).toContain("RELATIONSHIP_COUNT_EXCEEDED");
    expect(depth.validation.valid).toBe(false);
    expect(depth.validation.reasonCodes).toContain("RELATIONSHIP_DEPTH_EXCEEDED");
  });

  it("preserves lineage and rejects missing lineage", () => {
    const valid = sealProposalRelationshipGraph(relationshipInput());
    const missing = sealProposalRelationshipGraph({
      ...relationshipInput(),
      request: {
        ...relationshipInput().request,
        lineageReferences: [],
      },
    });

    expect(valid.result.lineageIntegrity).toBe(true);
    expect(missing.validation.valid).toBe(false);
    expect(missing.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("keeps execution, workflow routing, prioritization, selection, and authority blocked", () => {
    const execution = sealProposalRelationshipGraph({
      ...relationshipInput(),
      executionRequested: true,
    });
    const workflow = sealProposalRelationshipGraph({
      ...relationshipInput(),
      workflowRoutingRequested: true,
    });
    const prioritization = sealProposalRelationshipGraph({
      ...relationshipInput(),
      prioritizationRequested: true,
    });
    const selection = sealProposalRelationshipGraph({
      ...relationshipInput(),
      proposalSelectionRequested: true,
    });
    const authority = sealProposalRelationshipGraph({
      ...relationshipInput(),
      authorityExpansionRequested: true,
    });
    const healthy = sealProposalRelationshipGraph(relationshipInput());

    expect(execution.validation.valid).toBe(false);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.valid).toBe(false);
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(prioritization.validation.valid).toBe(false);
    expect(prioritization.validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(selection.validation.valid).toBe(false);
    expect(selection.validation.reasonCodes).toContain("PROPOSAL_SELECTION_DETECTED");
    expect(authority.validation.valid).toBe(false);
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.relationshipOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.prioritizationAllowed).toBe(false);
    expect(healthy.proposalSelectionAllowed).toBe(false);
    expect(healthy.proposalCreationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.relationshipMutationAllowed).toBe(false);
    expect(healthy.selfExpansionAllowed).toBe(false);
  });

  it("does not mutate sealed inputs", () => {
    const input = relationshipInput();
    const before = JSON.stringify(input);

    sealProposalRelationshipGraph(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
