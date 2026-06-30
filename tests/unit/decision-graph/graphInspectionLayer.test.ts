import { describe, expect, it } from "vitest";
import {
  buildEscalationGraphRequest,
  buildGovernanceInfluenceRequest,
  buildGraphInspectionRequest,
  buildProposalRelationshipRequest,
  buildRecommendationDependencyRequest,
  buildReplayableGraphTopologyRequest,
  createGraphInspectionProjection,
  sealDecisionGraphContract,
  sealEscalationGraph,
  sealGovernanceInfluenceGraph,
  sealGraphInspection,
  sealProposalRelationshipGraph,
  sealRecommendationDependencyGraph,
  sealReplayableGraphTopology,
  type DecisionGraphContractInput,
  type DecisionGraphNodeInput,
  type EscalationNodeInput,
  type GovernanceNodeInput,
  type GraphInspectionInput,
  type ProposalNodeInput,
} from "@/services/decision-graph";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    {
      nodeId: "boundary-node",
      graphId: "graph-55g",
      nodeType: "CONSTRAINT",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-boundary-node",
    },
    {
      nodeId: "governance-anchor",
      graphId: "graph-55g",
      nodeType: "GOVERNANCE",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-governance-anchor",
    },
    {
      nodeId: "recommendation-anchor",
      graphId: "graph-55g",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-anchor",
    },
    {
      nodeId: "escalation-anchor",
      graphId: "graph-55g",
      nodeType: "ESCALATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-escalation-anchor",
    },
  ];

  return Object.freeze({
    graphId: "graph-55g",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T11:00:00.000Z",
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
      graphId: "graph-55g",
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
      graphId: "graph-55g",
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
      graphId: "graph-55g",
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
      dependencyNodeIds: ["boundary-node", "governance-anchor"],
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
      relationshipNodeIds: ["boundary-node", "governance-anchor"],
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
  const topology = sealReplayableGraphTopology({
    request: buildReplayableGraphTopologyRequest({
      graph,
      dependencyGraph,
      proposalGraph,
      governanceGraph,
      escalationGraph,
    }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
  });

  return { graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology };
}

function inspectionInput(overrides: Partial<GraphInspectionInput> = {}): GraphInspectionInput {
  const base = buildSealedUpstream();
  const request = buildGraphInspectionRequest(base);
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies GraphInspectionInput);
}

describe("graphInspectionLayer", () => {
  it("seals deterministic inspection output with reproducible hashes", () => {
    const input = inspectionInput();
    const first = sealGraphInspection(input);
    const second = sealGraphInspection(input);

    expect(first).toEqual(second);
    expect(first.result.inspectionState).toBe("HEALTHY");
    expect(first.result.inspectionHash).toHaveLength(64);
    expect(first.result.topologyDeterministic).toBe(true);
  });

  it("keeps visibility projections reproducible and scope-specific", () => {
    const full = inspectionInput();
    const scopes = ["HEALTH", "LINEAGE", "DEPENDENCIES", "TOPOLOGY", "FULL"] as const;

    for (const scope of scopes) {
      const scoped = inspectionInput({
        request: {
          ...full.request,
          inspectionScope: scope,
        },
      });
      const projectionA = createGraphInspectionProjection(scoped);
      const projectionB = createGraphInspectionProjection(scoped);
      const sealed = sealGraphInspection(scoped);

      expect(projectionA).toEqual(projectionB);
      expect(sealed.result.inspectionHash).toBe(sealGraphInspection(scoped).result.inspectionHash);
      expect(sealed.result.inspectionState).toBe(scope === "FULL" ? "HEALTHY" : "LIMITED");
    }
  });

  it("blocks cross-tenant inspection and ownership mismatches", () => {
    const base = inspectionInput();
    const crossTenant = sealGraphInspection({
      ...base,
      graph: {
        ...base.graph,
        nodes: base.graph.nodes.map((node, index) => index === 0 ? { ...node, tenantId: "tenant-beta" } : node),
      },
    });
    const ownershipMismatch = sealGraphInspection({
      ...base,
      topology: {
        ...base.topology,
        nodes: base.topology.nodes.map((node, index) => index === 0 ? { ...node, graphId: "graph-else" } : node),
      },
    });

    expect(crossTenant.validation.valid).toBe(false);
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.valid).toBe(false);
    expect(ownershipMismatch.validation.reasonCodes).toContain("ARTIFACT_OWNERSHIP_MISMATCH");
  });

  it("detects lineage failures and invalid scope inputs", () => {
    const base = inspectionInput();
    const missingLineage = sealGraphInspection({
      ...base,
      request: {
        ...base.request,
        lineageReferences: [],
      },
    });
    const invalidScope = sealGraphInspection({
      ...base,
      request: {
        ...base.request,
        inspectionScope: "RUNTIME" as never,
      },
    });

    expect(missingLineage.validation.valid).toBe(false);
    expect(missingLineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(invalidScope.validation.valid).toBe(false);
    expect(invalidScope.validation.reasonCodes).toContain("INSPECTION_SCOPE_INVALID");
  });

  it("invalidates unsealed artifacts and escalates graph integrity failures", () => {
    const base = inspectionInput();
    const unsealed = sealGraphInspection({
      ...base,
      topology: {
        ...base.topology,
        sealed: false,
      },
    });
    const escalated = sealGraphInspection({
      ...base,
      topology: {
        ...base.topology,
        result: {
          ...base.topology.result,
          topologyDeterministic: false,
        },
        validation: {
          ...base.topology.validation,
          valid: false,
          topologyDeterministic: false,
        },
      },
    });

    expect(unsealed.validation.valid).toBe(false);
    expect(unsealed.validation.reasonCodes).toContain("TOPOLOGY_UNSEALED");
    expect(escalated.validation.validationState).toBe("ESCALATED");
    expect(escalated.result.inspectionState).toBe("ESCALATED");
    expect(escalated.validation.reasonCodes).toContain("GRAPH_INTEGRITY_FAILURE");
  });

  it("keeps execution impossible, mutation impossible, and authority unchanged", () => {
    const base = inspectionInput();
    const mutation = sealGraphInspection({
      ...base,
      inspectionMutationAttempted: true,
    });
    const execution = sealGraphInspection({
      ...base,
      executionRequested: true,
    });
    const workflow = sealGraphInspection({
      ...base,
      workflowRoutingRequested: true,
    });
    const recommendation = sealGraphInspection({
      ...base,
      recommendationCreationRequested: true,
    });
    const optimization = sealGraphInspection({
      ...base,
      graphOptimizationRequested: true,
    });
    const authority = sealGraphInspection({
      ...base,
      authorityExpansionRequested: true,
    });
    const healthy = sealGraphInspection(base);

    expect(mutation.validation.valid).toBe(false);
    expect(mutation.validation.reasonCodes).toContain("INSPECTION_ATTEMPTS_MUTATION");
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(recommendation.validation.reasonCodes).toContain("RECOMMENDATION_CREATION_DETECTED");
    expect(optimization.validation.reasonCodes).toContain("GRAPH_OPTIMIZATION_DETECTED");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.inspectionOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.graphMutationAllowed).toBe(false);
    expect(healthy.recommendationCreationAllowed).toBe(false);
    expect(healthy.graphOptimizationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.ownershipMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("produces degraded output when visibility limits clip the projection", () => {
    const base = inspectionInput();
    const clipped = sealGraphInspection({
      ...base,
      request: {
        ...base.request,
        inspectionScope: "DEPENDENCIES",
      },
      dependencyGraph: {
        ...base.dependencyGraph,
        edges: Array.from({ length: 25 }, (_, index) => ({
          ...base.dependencyGraph.edges[0],
          edgeId: `dependency-${index.toString().padStart(2, "0")}`,
          immutableHash: `${base.dependencyGraph.edges[0].immutableHash}-${index.toString().padStart(2, "0")}`,
        })),
      },
    });

    expect(clipped.result.inspectionState).toBe("DEGRADED");
    expect(clipped.validation.reasonCodes).toContain("INSPECTION_DEPTH_LIMIT_APPLIED");
    expect(clipped.result.dependencyCount).toBe(20);
  });

  it("does not mutate sealed inputs", () => {
    const input = inspectionInput();
    const before = JSON.stringify(input);

    sealGraphInspection(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
