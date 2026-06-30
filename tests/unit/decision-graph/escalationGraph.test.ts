import { describe, expect, it } from "vitest";
import {
  buildEscalationGraphRequest,
  buildGovernanceInfluenceRequest,
  buildProposalRelationshipRequest,
  buildRecommendationDependencyRequest,
  sealDecisionGraphContract,
  sealEscalationGraph,
  sealGovernanceInfluenceGraph,
  sealProposalRelationshipGraph,
  sealRecommendationDependencyGraph,
  type DecisionGraphContractInput,
  type DecisionGraphNodeInput,
  type EscalationGraphInput,
  type EscalationNodeInput,
  type GovernanceNodeInput,
  type ProposalNodeInput,
} from "@/services/decision-graph";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    {
      nodeId: "boundary-node",
      graphId: "graph-55e",
      nodeType: "CONSTRAINT",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-boundary-node",
    },
    {
      nodeId: "governance-node",
      graphId: "graph-55e",
      nodeType: "GOVERNANCE",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-governance-node",
    },
    {
      nodeId: "recommendation-anchor",
      graphId: "graph-55e",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-anchor",
    },
    {
      nodeId: "supervision-node",
      graphId: "graph-55e",
      nodeType: "ESCALATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-supervision-node",
    },
  ];

  return Object.freeze({
    graphId: "graph-55e",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T09:00:00.000Z",
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
      graphId: "graph-55e",
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
      graphId: "graph-55e",
      tenantId: "tenant-alpha",
      governanceType: "POLICY",
      lineageReference: "lineage-governance-a",
    },
  ];
}

function escalationNodes(overrides?: readonly EscalationNodeInput[]): readonly EscalationNodeInput[] {
  return overrides ?? [
    {
      escalationId: "escalation-b",
      graphId: "graph-55e",
      tenantId: "tenant-alpha",
      escalationType: "SUPERVISION",
      lineageReference: "lineage-escalation-b",
    },
    {
      escalationId: "escalation-a",
      graphId: "graph-55e",
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

  return { graph, dependencyGraph, proposalGraph, governanceGraph };
}

function escalationInput(overrides: Partial<EscalationGraphInput> = {}): EscalationGraphInput {
  const { graph, dependencyGraph, proposalGraph, governanceGraph } = buildSealedUpstream();
  const request = buildEscalationGraphRequest({
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationNodes: escalationNodes(),
  });

  return Object.freeze({
    request: {
      ...request,
      escalationNodeIds: ["escalation-b", "escalation-a"],
      targetNodeIds: ["boundary-node", "recommendation-anchor"],
    },
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationNodes: escalationNodes(),
    ...overrides,
  } satisfies EscalationGraphInput);
}

describe("escalationGraph", () => {
  it("creates deterministic escalation graphs and reproducible hashes", () => {
    const input = escalationInput();
    const reversed = escalationInput({
      request: {
        ...input.request,
        escalationNodeIds: [...input.request.escalationNodeIds].reverse(),
        targetNodeIds: [...input.request.targetNodeIds].reverse(),
      },
      escalationNodes: [...input.escalationNodes].reverse(),
    });

    const first = sealEscalationGraph(input);
    const second = sealEscalationGraph(reversed);

    expect(first).toEqual(second);
    expect(first.result.graphState).toBe("SEALED");
    expect(first.result.sealed).toBe(true);
    expect(first.result.escalationCount).toBe(4);
    expect(first.result.escalationHash).toHaveLength(64);
  });

  it("keeps escalation sealing deterministic and count reproducible", () => {
    const first = sealEscalationGraph(escalationInput());
    const second = sealEscalationGraph(escalationInput());

    expect(first.result).toEqual(second.result);
    expect(first.edges).toHaveLength(4);
    expect(first.validation.escalationCount).toBe(4);
  });

  it("blocks unsealed upstream graph inputs", () => {
    const base = escalationInput();
    const unsealedGraph = sealEscalationGraph({
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
    const unsealedGovernanceGraph = sealEscalationGraph({
      ...base,
      governanceGraph: {
        ...base.governanceGraph,
        result: {
          ...base.governanceGraph.result,
          sealed: false,
          graphState: "VALIDATED",
        },
      },
    });

    expect(unsealedGraph.validation.valid).toBe(false);
    expect(unsealedGraph.validation.reasonCodes).toContain("GRAPH_UNSEALED");
    expect(unsealedGovernanceGraph.validation.valid).toBe(false);
    expect(unsealedGovernanceGraph.validation.reasonCodes).toContain("GOVERNANCE_GRAPH_UNSEALED");
  });

  it("blocks graphId mismatches and cross-tenant escalation", () => {
    const mismatched = sealEscalationGraph({
      ...escalationInput(),
      request: {
        ...escalationInput().request,
        graphId: "graph-other",
      },
    });
    const crossTenant = sealEscalationGraph(escalationInput({
      escalationNodes: escalationNodes([
        {
          escalationId: "escalation-a",
          graphId: "graph-55e",
          tenantId: "tenant-beta",
          escalationType: "REVIEW",
          lineageReference: "lineage-escalation-a",
        },
      ]),
      request: {
        graphId: "graph-55e",
        tenantId: "tenant-alpha",
        escalationNodeIds: ["escalation-a"],
        targetNodeIds: ["boundary-node"],
        lineageReferences: ["lineage-escalation-a", "lineage-boundary-node"],
      },
    }));

    expect(mismatched.validation.valid).toBe(false);
    expect(mismatched.validation.reasonCodes).toContain("GRAPH_ID_MISMATCH");
    expect(crossTenant.validation.valid).toBe(false);
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_NODES_BLOCKED");
  });

  it("invalidates missing escalation artifacts and unknown targets", () => {
    const missingEscalation = sealEscalationGraph({
      ...escalationInput(),
      request: {
        ...escalationInput().request,
        escalationNodeIds: ["missing-escalation"],
      },
    });
    const missingTarget = sealEscalationGraph({
      ...escalationInput(),
      request: {
        ...escalationInput().request,
        targetNodeIds: ["missing-target"],
      },
    });

    expect(missingEscalation.validation.valid).toBe(false);
    expect(missingEscalation.validation.reasonCodes).toContain("ESCALATION_ARTIFACT_MISSING");
    expect(missingTarget.validation.valid).toBe(false);
    expect(missingTarget.validation.reasonCodes).toContain("TARGET_NODE_MISSING");
    expect(missingTarget.validation.reasonCodes).toContain("ESCALATION_TARGET_UNKNOWN_NODE");
  });

  it("blocks self escalation and ownership mutation", () => {
    const selfEscalation = sealEscalationGraph({
      ...escalationInput(),
      request: {
        ...escalationInput().request,
        targetNodeIds: ["escalation-a"],
      },
    });
    const ownershipMutation = sealEscalationGraph({
      ...escalationInput(),
      ownershipMutationRequested: true,
    });

    expect(selfEscalation.validation.valid).toBe(false);
    expect(selfEscalation.validation.reasonCodes).toContain("SELF_ESCALATION_DETECTED");
    expect(ownershipMutation.validation.valid).toBe(false);
    expect(ownershipMutation.validation.reasonCodes).toContain("ESCALATION_MUTATES_OWNERSHIP");
  });

  it("enforces escalation ceilings and depth limits", () => {
    const graph = sealDecisionGraphContract(graphInput({
      nodes: [
        {
          nodeId: "recommendation-anchor",
          graphId: "graph-55e",
          nodeType: "RECOMMENDATION",
          tenantId: "tenant-alpha",
          lineageReference: "lineage-recommendation-anchor",
        },
        ...Array.from({ length: 51 }, (_, index) => ({
          nodeId: `target-node-${index}`,
          graphId: "graph-55e",
          nodeType: "SIMULATION" as const,
          tenantId: "tenant-alpha",
          lineageReference: `lineage-target-node-${index}`,
        })),
      ],
      lineageReferences: [
        "lineage-recommendation-anchor",
        ...Array.from({ length: 51 }, (_, index) => `lineage-target-node-${index}`),
      ],
    }));
    const dependencyGraph = sealRecommendationDependencyGraph({
      request: {
        ...buildRecommendationDependencyRequest({ graph }),
        recommendationNodeIds: ["recommendation-anchor"],
        dependencyNodeIds: Array.from({ length: 10 }, (_, index) => `target-node-${index}`),
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
        relationshipNodeIds: Array.from({ length: 10 }, (_, index) => `target-node-${index}`),
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
        influencedNodeIds: Array.from({ length: 10 }, (_, index) => `target-node-${index}`),
      },
      graph,
      dependencyGraph,
      proposalGraph,
      governanceNodes: governanceNodes(),
    });
    const ceiling = sealEscalationGraph({
      request: {
        graphId: "graph-55e",
        tenantId: "tenant-alpha",
        escalationNodeIds: ["escalation-a"],
        targetNodeIds: Array.from({ length: 51 }, (_, index) => `target-node-${index}`),
        lineageReferences: [
          "lineage-escalation-a",
          ...Array.from({ length: 51 }, (_, index) => `lineage-target-node-${index}`),
        ],
      },
      graph,
      dependencyGraph,
      proposalGraph,
      governanceGraph,
      escalationNodes: [
        {
          escalationId: "escalation-a",
          graphId: "graph-55e",
          tenantId: "tenant-alpha",
          escalationType: "REVIEW",
          lineageReference: "lineage-escalation-a",
        },
      ],
    });
    const depth = sealEscalationGraph({
      request: {
        graphId: "graph-55e",
        tenantId: "tenant-alpha",
        escalationNodeIds: ["escalation-a"],
        targetNodeIds: Array.from({ length: 11 }, (_, index) => `target-node-${index}`),
        lineageReferences: [
          "lineage-escalation-a",
          ...Array.from({ length: 11 }, (_, index) => `lineage-target-node-${index}`),
        ],
      },
      graph,
      dependencyGraph,
      proposalGraph,
      governanceGraph,
      escalationNodes: [
        {
          escalationId: "escalation-a",
          graphId: "graph-55e",
          tenantId: "tenant-alpha",
          escalationType: "REVIEW",
          lineageReference: "lineage-escalation-a",
        },
      ],
    });

    expect(ceiling.validation.valid).toBe(false);
    expect(ceiling.validation.reasonCodes).toContain("ESCALATION_COUNT_EXCEEDED");
    expect(depth.validation.valid).toBe(false);
    expect(depth.validation.reasonCodes).toContain("ESCALATION_DEPTH_EXCEEDED");
  });

  it("preserves lineage and rejects missing lineage", () => {
    const valid = sealEscalationGraph(escalationInput());
    const missing = sealEscalationGraph({
      ...escalationInput(),
      request: {
        ...escalationInput().request,
        lineageReferences: [],
      },
    });

    expect(valid.result.lineageIntegrity).toBe(true);
    expect(missing.validation.valid).toBe(false);
    expect(missing.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("blocks authority creation, workflow routing, and execution", () => {
    const createsAuthority = sealEscalationGraph({
      ...escalationInput(),
      escalationCreatesAuthority: true,
    });
    const execution = sealEscalationGraph({
      ...escalationInput(),
      executionRequested: true,
    });
    const workflow = sealEscalationGraph({
      ...escalationInput(),
      workflowRoutingRequested: true,
    });
    const expansion = sealEscalationGraph({
      ...escalationInput(),
      authorityExpansionRequested: true,
    });
    const healthy = sealEscalationGraph(escalationInput());

    expect(createsAuthority.validation.valid).toBe(false);
    expect(createsAuthority.validation.reasonCodes).toContain("ESCALATION_CREATES_AUTHORITY");
    expect(execution.validation.valid).toBe(false);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.valid).toBe(false);
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(expansion.validation.valid).toBe(false);
    expect(expansion.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.escalationOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.runtimeDispatchAllowed).toBe(false);
    expect(healthy.notificationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.escalationMutationAllowed).toBe(false);
    expect(healthy.selfExpansionAllowed).toBe(false);
  });

  it("does not mutate sealed inputs", () => {
    const input = escalationInput();
    const before = JSON.stringify(input);

    sealEscalationGraph(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
