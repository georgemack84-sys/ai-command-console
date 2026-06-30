import { describe, expect, it } from "vitest";
import {
  buildGovernanceInfluenceRequest,
  buildProposalRelationshipRequest,
  buildRecommendationDependencyRequest,
  sealDecisionGraphContract,
  sealGovernanceInfluenceGraph,
  sealProposalRelationshipGraph,
  sealRecommendationDependencyGraph,
  type DecisionGraphContractInput,
  type DecisionGraphNodeInput,
  type GovernanceInfluenceGraphInput,
  type GovernanceNodeInput,
  type ProposalNodeInput,
} from "@/services/decision-graph";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    {
      nodeId: "boundary-node",
      graphId: "graph-55d",
      nodeType: "CONSTRAINT",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-boundary-node",
    },
    {
      nodeId: "escalation-node",
      graphId: "graph-55d",
      nodeType: "ESCALATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-escalation-node",
    },
    {
      nodeId: "governance-anchor",
      graphId: "graph-55d",
      nodeType: "GOVERNANCE",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-governance-anchor",
    },
    {
      nodeId: "simulation-node",
      graphId: "graph-55d",
      nodeType: "SIMULATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-simulation-node",
    },
    {
      nodeId: "recommendation-anchor",
      graphId: "graph-55d",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-anchor",
    },
  ];

  return Object.freeze({
    graphId: "graph-55d",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T08:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

function proposalNodes(): readonly ProposalNodeInput[] {
  return [
    {
      proposalId: "proposal-b",
      graphId: "graph-55d",
      tenantId: "tenant-alpha",
      proposalType: "RECOMMENDATION",
      lineageReference: "lineage-proposal-b",
    },
    {
      proposalId: "proposal-a",
      graphId: "graph-55d",
      tenantId: "tenant-alpha",
      proposalType: "MISSION",
      lineageReference: "lineage-proposal-a",
    },
  ];
}

function governanceNodes(overrides?: readonly GovernanceNodeInput[]): readonly GovernanceNodeInput[] {
  return overrides ?? [
    {
      governanceId: "governance-b",
      graphId: "graph-55d",
      tenantId: "tenant-alpha",
      governanceType: "BOUNDARY",
      lineageReference: "lineage-governance-b",
    },
    {
      governanceId: "governance-a",
      graphId: "graph-55d",
      tenantId: "tenant-alpha",
      governanceType: "POLICY",
      lineageReference: "lineage-governance-a",
    },
  ];
}

function buildSealedDependencyAndProposal() {
  const graph = sealDecisionGraphContract(graphInput());
  const dependencyGraph = sealRecommendationDependencyGraph({
    request: {
      ...buildRecommendationDependencyRequest({ graph }),
      recommendationNodeIds: ["recommendation-anchor"],
      dependencyNodeIds: ["boundary-node", "simulation-node"],
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
      proposalNodeIds: ["proposal-b", "proposal-a"],
      relationshipNodeIds: ["escalation-node", "simulation-node"],
    },
    graph,
    dependencyGraph,
    proposalNodes: proposalNodes(),
  });

  return { graph, dependencyGraph, proposalGraph };
}

function influenceInput(overrides: Partial<GovernanceInfluenceGraphInput> = {}): GovernanceInfluenceGraphInput {
  const { graph, dependencyGraph, proposalGraph } = buildSealedDependencyAndProposal();
  const request = buildGovernanceInfluenceRequest({
    graph,
    dependencyGraph,
    proposalGraph,
    governanceNodes: governanceNodes(),
  });

  return Object.freeze({
    request: {
      ...request,
      governanceNodeIds: ["governance-b", "governance-a"],
      influencedNodeIds: ["simulation-node", "boundary-node"],
    },
    graph,
    dependencyGraph,
    proposalGraph,
    governanceNodes: governanceNodes(),
    ...overrides,
  } satisfies GovernanceInfluenceGraphInput);
}

describe("governanceInfluenceGraph", () => {
  it("creates deterministic influence graphs and reproducible hashes", () => {
    const input = influenceInput();
    const reversed = influenceInput({
      request: {
        ...input.request,
        governanceNodeIds: [...input.request.governanceNodeIds].reverse(),
        influencedNodeIds: [...input.request.influencedNodeIds].reverse(),
      },
      governanceNodes: [...input.governanceNodes].reverse(),
    });

    const first = sealGovernanceInfluenceGraph(input);
    const second = sealGovernanceInfluenceGraph(reversed);

    expect(first).toEqual(second);
    expect(first.result.graphState).toBe("SEALED");
    expect(first.result.sealed).toBe(true);
    expect(first.result.influenceCount).toBe(4);
    expect(first.result.influenceHash).toHaveLength(64);
  });

  it("keeps influence sealing deterministic and count reproducible", () => {
    const first = sealGovernanceInfluenceGraph(influenceInput());
    const second = sealGovernanceInfluenceGraph(influenceInput());

    expect(first.result).toEqual(second.result);
    expect(first.edges).toHaveLength(4);
    expect(first.validation.influenceCount).toBe(4);
  });

  it("blocks unsealed graph, dependency graph, and proposal graph inputs", () => {
    const base = influenceInput();
    const unsealedGraph = sealGovernanceInfluenceGraph({
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
    const unsealedDependencyGraph = sealGovernanceInfluenceGraph({
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
    const unsealedProposalGraph = sealGovernanceInfluenceGraph({
      ...base,
      proposalGraph: {
        ...base.proposalGraph,
        result: {
          ...base.proposalGraph.result,
          sealed: false,
          graphState: "VALIDATED",
        },
      },
    });

    expect(unsealedGraph.validation.valid).toBe(false);
    expect(unsealedGraph.validation.reasonCodes).toContain("GRAPH_UNSEALED");
    expect(unsealedDependencyGraph.validation.valid).toBe(false);
    expect(unsealedDependencyGraph.validation.reasonCodes).toContain("DEPENDENCY_GRAPH_UNSEALED");
    expect(unsealedProposalGraph.validation.valid).toBe(false);
    expect(unsealedProposalGraph.validation.reasonCodes).toContain("PROPOSAL_GRAPH_UNSEALED");
  });

  it("blocks graphId mismatches and cross-tenant influence", () => {
    const mismatched = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      request: {
        ...influenceInput().request,
        graphId: "graph-other",
      },
    });
    const crossTenant = sealGovernanceInfluenceGraph(influenceInput({
      governanceNodes: governanceNodes([
        {
          governanceId: "governance-a",
          graphId: "graph-55d",
          tenantId: "tenant-beta",
          governanceType: "POLICY",
          lineageReference: "lineage-governance-a",
        },
      ]),
      request: {
        graphId: "graph-55d",
        tenantId: "tenant-alpha",
        governanceNodeIds: ["governance-a"],
        influencedNodeIds: ["boundary-node"],
        lineageReferences: ["lineage-governance-a", "lineage-boundary-node"],
      },
    }));

    expect(mismatched.validation.valid).toBe(false);
    expect(mismatched.validation.reasonCodes).toContain("GRAPH_ID_MISMATCH");
    expect(crossTenant.validation.valid).toBe(false);
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_NODES_BLOCKED");
  });

  it("invalidates missing governance artifacts and unknown influenced nodes", () => {
    const missingGovernance = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      request: {
        ...influenceInput().request,
        governanceNodeIds: ["missing-governance"],
      },
    });
    const missingInfluenced = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      request: {
        ...influenceInput().request,
        influencedNodeIds: ["missing-node"],
      },
    });

    expect(missingGovernance.validation.valid).toBe(false);
    expect(missingGovernance.validation.reasonCodes).toContain("GOVERNANCE_ARTIFACT_MISSING");
    expect(missingInfluenced.validation.valid).toBe(false);
    expect(missingInfluenced.validation.reasonCodes).toContain("INFLUENCED_NODE_MISSING");
    expect(missingInfluenced.validation.reasonCodes).toContain("INFLUENCE_TARGET_UNKNOWN_NODE");
  });

  it("blocks self influence and influence ceilings", () => {
    const selfInfluence = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      request: {
        ...influenceInput().request,
        influencedNodeIds: ["governance-a"],
      },
    });

    const graph = sealDecisionGraphContract(graphInput({
      nodes: [
        {
          nodeId: "recommendation-anchor",
          graphId: "graph-55d",
          nodeType: "RECOMMENDATION",
          tenantId: "tenant-alpha",
          lineageReference: "lineage-recommendation-anchor",
        },
        ...Array.from({ length: 51 }, (_, index) => ({
          nodeId: `influenced-node-${index}`,
          graphId: "graph-55d",
          nodeType: "SIMULATION" as const,
          tenantId: "tenant-alpha",
          lineageReference: `lineage-influenced-node-${index}`,
        })),
      ],
      lineageReferences: [
        "lineage-recommendation-anchor",
        ...Array.from({ length: 51 }, (_, index) => `lineage-influenced-node-${index}`),
      ],
    }));
    const dependencyGraph = sealRecommendationDependencyGraph({
      request: {
        ...buildRecommendationDependencyRequest({ graph }),
        recommendationNodeIds: ["recommendation-anchor"],
        dependencyNodeIds: Array.from({ length: 10 }, (_, index) => `influenced-node-${index}`),
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
        relationshipNodeIds: Array.from({ length: 10 }, (_, index) => `influenced-node-${index}`),
      },
      graph,
      dependencyGraph,
      proposalNodes: proposalNodes(),
    });
    const ceiling = sealGovernanceInfluenceGraph({
      request: {
        graphId: "graph-55d",
        tenantId: "tenant-alpha",
        governanceNodeIds: ["governance-a"],
        influencedNodeIds: Array.from({ length: 51 }, (_, index) => `influenced-node-${index}`),
        lineageReferences: [
          "lineage-governance-a",
          ...Array.from({ length: 51 }, (_, index) => `lineage-influenced-node-${index}`),
        ],
      },
      graph,
      dependencyGraph,
      proposalGraph,
      governanceNodes: [
        {
          governanceId: "governance-a",
          graphId: "graph-55d",
          tenantId: "tenant-alpha",
          governanceType: "POLICY",
          lineageReference: "lineage-governance-a",
        },
      ],
    });

    expect(selfInfluence.validation.valid).toBe(false);
    expect(selfInfluence.validation.reasonCodes).toContain("SELF_INFLUENCE_DETECTED");
    expect(ceiling.validation.valid).toBe(false);
    expect(ceiling.validation.reasonCodes).toContain("INFLUENCE_COUNT_EXCEEDED");
  });

  it("blocks governance depth overflow", () => {
    const graph = sealDecisionGraphContract(graphInput({
      nodes: [
        {
          nodeId: "recommendation-anchor",
          graphId: "graph-55d",
          nodeType: "RECOMMENDATION",
          tenantId: "tenant-alpha",
          lineageReference: "lineage-recommendation-anchor",
        },
        ...Array.from({ length: 11 }, (_, index) => ({
          nodeId: `deep-node-${index + 1}`,
          graphId: "graph-55d",
          nodeType: "SIMULATION" as const,
          tenantId: "tenant-alpha",
          lineageReference: `lineage-deep-node-${index + 1}`,
        })),
      ],
      lineageReferences: [
        "lineage-recommendation-anchor",
        ...Array.from({ length: 11 }, (_, index) => `lineage-deep-node-${index + 1}`),
      ],
    }));
    const dependencyGraph = sealRecommendationDependencyGraph({
      request: {
        ...buildRecommendationDependencyRequest({ graph }),
        recommendationNodeIds: ["recommendation-anchor"],
        dependencyNodeIds: Array.from({ length: 10 }, (_, index) => `deep-node-${index + 1}`),
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
        relationshipNodeIds: Array.from({ length: 10 }, (_, index) => `deep-node-${index + 1}`),
      },
      graph,
      dependencyGraph,
      proposalNodes: proposalNodes(),
    });
    const record = sealGovernanceInfluenceGraph({
      request: {
        graphId: "graph-55d",
        tenantId: "tenant-alpha",
        governanceNodeIds: ["governance-a"],
        influencedNodeIds: Array.from({ length: 11 }, (_, index) => `deep-node-${index + 1}`),
        lineageReferences: [
          "lineage-governance-a",
          ...Array.from({ length: 11 }, (_, index) => `lineage-deep-node-${index + 1}`),
        ],
      },
      graph,
      dependencyGraph,
      proposalGraph,
      governanceNodes: [
        {
          governanceId: "governance-a",
          graphId: "graph-55d",
          tenantId: "tenant-alpha",
          governanceType: "POLICY",
          lineageReference: "lineage-governance-a",
        },
      ],
    });

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("GOVERNANCE_DEPTH_EXCEEDED");
  });

  it("preserves lineage and rejects missing lineage", () => {
    const valid = sealGovernanceInfluenceGraph(influenceInput());
    const missing = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      request: {
        ...influenceInput().request,
        lineageReferences: [],
      },
    });

    expect(valid.result.lineageIntegrity).toBe(true);
    expect(missing.validation.valid).toBe(false);
    expect(missing.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("blocks authority creation, policy mutation, execution, and workflow routing", () => {
    const authority = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      governanceCreatesAuthority: true,
    });
    const policyMutation = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      policyMutationRequested: true,
    });
    const execution = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      executionRequested: true,
    });
    const workflow = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      workflowRoutingRequested: true,
    });
    const expansion = sealGovernanceInfluenceGraph({
      ...influenceInput(),
      authorityExpansionRequested: true,
    });
    const healthy = sealGovernanceInfluenceGraph(influenceInput());

    expect(authority.validation.valid).toBe(false);
    expect(authority.validation.reasonCodes).toContain("GOVERNANCE_CREATES_AUTHORITY");
    expect(policyMutation.validation.valid).toBe(false);
    expect(policyMutation.validation.reasonCodes).toContain("GOVERNANCE_MUTATES_POLICY");
    expect(execution.validation.valid).toBe(false);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.valid).toBe(false);
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(expansion.validation.valid).toBe(false);
    expect(expansion.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.influenceOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.policyMutationAllowed).toBe(false);
    expect(healthy.governanceExecutionAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.influenceMutationAllowed).toBe(false);
    expect(healthy.selfExpansionAllowed).toBe(false);
  });

  it("does not mutate sealed inputs", () => {
    const input = influenceInput();
    const before = JSON.stringify(input);

    sealGovernanceInfluenceGraph(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
