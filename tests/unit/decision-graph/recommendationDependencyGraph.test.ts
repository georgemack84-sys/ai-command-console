import { describe, expect, it } from "vitest";
import {
  buildRecommendationDependencyRequest,
  sealDecisionGraphContract,
  sealRecommendationDependencyGraph,
  type DecisionGraphContractInput,
  type DecisionGraphNodeInput,
  type RecommendationDependencyGraphInput,
} from "@/services/decision-graph";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    {
      nodeId: "dependency-observability",
      graphId: "graph-55b",
      nodeType: "OBSERVABILITY",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-observability",
    },
    {
      nodeId: "recommendation-a",
      graphId: "graph-55b",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-a",
    },
    {
      nodeId: "recommendation-b",
      graphId: "graph-55b",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-b",
    },
    {
      nodeId: "dependency-governance",
      graphId: "graph-55b",
      nodeType: "GOVERNANCE",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-governance",
    },
  ];

  return Object.freeze({
    graphId: "graph-55b",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T06:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

function dependencyInput(overrides: Partial<RecommendationDependencyGraphInput> = {}): RecommendationDependencyGraphInput {
  const graph = sealDecisionGraphContract(graphInput());
  const request = buildRecommendationDependencyRequest({
    graph,
  });

  return Object.freeze({
    request: {
      ...request,
      recommendationNodeIds: ["recommendation-b", "recommendation-a"],
      dependencyNodeIds: ["dependency-observability", "dependency-governance"],
    },
    graph,
    ...overrides,
  } satisfies RecommendationDependencyGraphInput);
}

describe("recommendationDependencyGraph", () => {
  it("creates deterministic dependency graphs and reproducible hashes", () => {
    const input = dependencyInput();
    const reversed = dependencyInput({
      request: {
        ...input.request,
        recommendationNodeIds: [...input.request.recommendationNodeIds].reverse(),
        dependencyNodeIds: [...input.request.dependencyNodeIds].reverse(),
      },
    });

    const first = sealRecommendationDependencyGraph(input);
    const second = sealRecommendationDependencyGraph(reversed);

    expect(first).toEqual(second);
    expect(first.result.graphState).toBe("SEALED");
    expect(first.result.sealed).toBe(true);
    expect(first.result.dependencyCount).toBe(4);
    expect(first.result.dependencyHash).toHaveLength(64);
  });

  it("keeps dependency sealing deterministic and count accurate", () => {
    const first = sealRecommendationDependencyGraph(dependencyInput());
    const second = sealRecommendationDependencyGraph(dependencyInput());

    expect(first.result).toEqual(second.result);
    expect(first.edges).toHaveLength(4);
    expect(first.validation.dependencyCount).toBe(4);
  });

  it("blocks unsealed graphs and graphId mismatches", () => {
    const graph = sealDecisionGraphContract(graphInput({
      sealed: false,
    }));
    const unsealed = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      graph: {
        ...graph,
        contract: {
          ...graph.contract,
          sealed: false,
          graphState: "VALIDATED",
        },
      },
    });
    const base = dependencyInput();
    const mismatched = sealRecommendationDependencyGraph({
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

  it("blocks cross-tenant dependencies and missing ownership", () => {
    const crossTenantGraph = sealDecisionGraphContract(graphInput({
      nodes: [
        {
          nodeId: "recommendation-a",
          graphId: "graph-55b",
          nodeType: "RECOMMENDATION",
          tenantId: "tenant-alpha",
          lineageReference: "lineage-recommendation-a",
        },
        {
          nodeId: "dependency-governance",
          graphId: "graph-55b",
          nodeType: "GOVERNANCE",
          tenantId: "tenant-beta",
          lineageReference: "lineage-governance",
        },
      ],
      lineageReferences: ["lineage-recommendation-a", "lineage-governance"],
    }));
    const record = sealRecommendationDependencyGraph({
      request: {
        graphId: "graph-55b",
        tenantId: "tenant-alpha",
        recommendationNodeIds: ["recommendation-a"],
        dependencyNodeIds: ["dependency-governance"],
        lineageReferences: ["lineage-recommendation-a", "lineage-governance"],
      },
      graph: crossTenantGraph,
    });

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("CROSS_TENANT_DEPENDENCIES_BLOCKED");
  });

  it("invalidates missing recommendation and dependency nodes", () => {
    const missingRecommendation = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      request: {
        ...dependencyInput().request,
        recommendationNodeIds: ["missing-recommendation"],
      },
    });
    const missingDependency = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      request: {
        ...dependencyInput().request,
        dependencyNodeIds: ["missing-dependency"],
      },
    });

    expect(missingRecommendation.validation.valid).toBe(false);
    expect(missingRecommendation.validation.reasonCodes).toContain("RECOMMENDATION_NODE_MISSING");
    expect(missingDependency.validation.valid).toBe(false);
    expect(missingDependency.validation.reasonCodes).toContain("DEPENDENCY_NODE_MISSING");
  });

  it("blocks self dependencies and recursive loops", () => {
    const selfDependency = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      request: {
        ...dependencyInput().request,
        dependencyNodeIds: ["recommendation-a"],
      },
    });
    const loop = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      request: {
        ...dependencyInput().request,
        recommendationNodeIds: ["recommendation-a", "recommendation-b"],
        dependencyNodeIds: ["recommendation-b"],
      },
    });

    expect(selfDependency.validation.valid).toBe(false);
    expect(selfDependency.validation.reasonCodes).toContain("SELF_DEPENDENCY_DETECTED");
    expect(loop.validation.valid).toBe(false);
    expect(loop.validation.reasonCodes).toContain("DEPENDENCY_LOOP_DETECTED");
  });

  it("enforces dependency count ceiling", () => {
    const graph = sealDecisionGraphContract(graphInput({
      nodes: [
        {
          nodeId: "recommendation-a",
          graphId: "graph-55b",
          nodeType: "RECOMMENDATION",
          tenantId: "tenant-alpha",
          lineageReference: "lineage-recommendation-a",
        },
        ...Array.from({ length: 51 }, (_, index) => ({
          nodeId: `dependency-${index.toString().padStart(2, "0")}`,
          graphId: "graph-55b",
          nodeType: "CONSTRAINT" as const,
          tenantId: "tenant-alpha",
          lineageReference: `lineage-dependency-${index.toString().padStart(2, "0")}`,
        })),
      ],
      lineageReferences: [
        "lineage-recommendation-a",
        ...Array.from({ length: 51 }, (_, index) => `lineage-dependency-${index.toString().padStart(2, "0")}`),
      ],
    }));
    const record = sealRecommendationDependencyGraph({
      request: {
        graphId: "graph-55b",
        tenantId: "tenant-alpha",
        recommendationNodeIds: ["recommendation-a"],
        dependencyNodeIds: Array.from({ length: 51 }, (_, index) => `dependency-${index.toString().padStart(2, "0")}`),
        lineageReferences: graph.contract.lineageReferences,
      },
      graph,
    });

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("DEPENDENCY_COUNT_EXCEEDED");
  });

  it("enforces graph depth ceiling", () => {
    const graph = sealDecisionGraphContract(graphInput({
      nodes: [
        {
          nodeId: "recommendation-a",
          graphId: "graph-55b",
          nodeType: "RECOMMENDATION",
          tenantId: "tenant-alpha",
          lineageReference: "lineage-recommendation-a",
        },
        ...Array.from({ length: 11 }, (_, index) => ({
          nodeId: `deep-dependency-${index + 1}`,
          graphId: "graph-55b",
          nodeType: "SIMULATION" as const,
          tenantId: "tenant-alpha",
          lineageReference: `lineage-deep-dependency-${index + 1}`,
        })),
      ],
      lineageReferences: [
        "lineage-recommendation-a",
        ...Array.from({ length: 11 }, (_, index) => `lineage-deep-dependency-${index + 1}`),
      ],
    }));
    const record = sealRecommendationDependencyGraph({
      request: {
        graphId: "graph-55b",
        tenantId: "tenant-alpha",
        recommendationNodeIds: ["recommendation-a"],
        dependencyNodeIds: Array.from({ length: 11 }, (_, index) => `deep-dependency-${index + 1}`),
        lineageReferences: graph.contract.lineageReferences,
      },
      graph,
    });

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("GRAPH_DEPTH_EXCEEDED");
  });

  it("preserves lineage and rejects missing lineage references", () => {
    const valid = sealRecommendationDependencyGraph(dependencyInput());
    const missingLineage = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      request: {
        ...dependencyInput().request,
        lineageReferences: [],
      },
    });

    expect(valid.result.lineageIntegrity).toBe(true);
    expect(missingLineage.validation.valid).toBe(false);
    expect(missingLineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("keeps execution, workflow routing, prioritization, and authority blocked", () => {
    const execution = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      executionRequested: true,
    });
    const workflow = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      workflowRoutingRequested: true,
    });
    const prioritization = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      prioritizationRequested: true,
    });
    const authority = sealRecommendationDependencyGraph({
      ...dependencyInput(),
      authorityExpansionRequested: true,
    });
    const healthy = sealRecommendationDependencyGraph(dependencyInput());

    expect(execution.validation.valid).toBe(false);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.valid).toBe(false);
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(prioritization.validation.valid).toBe(false);
    expect(prioritization.validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(authority.validation.valid).toBe(false);
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.dependencyOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.prioritizationAllowed).toBe(false);
    expect(healthy.recommendationCreationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.dependencyMutationAllowed).toBe(false);
    expect(healthy.selfExpansionAllowed).toBe(false);
  });

  it("does not mutate sealed inputs", () => {
    const input = dependencyInput();
    const before = JSON.stringify(input);

    sealRecommendationDependencyGraph(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
