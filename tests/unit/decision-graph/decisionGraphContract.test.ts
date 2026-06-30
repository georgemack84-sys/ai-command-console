import { describe, expect, it } from "vitest";
import {
  createDecisionGraphEdges,
  createDecisionGraphNodes,
  generateDecisionGraphHash,
  sealDecisionGraphContract,
  type DecisionGraphContractInput,
  type DecisionGraphEdgeInput,
  type DecisionGraphNodeInput,
} from "@/services/decision-graph";

function node(nodeId: string, overrides: Partial<DecisionGraphNodeInput> = {}): DecisionGraphNodeInput {
  return Object.freeze({
    nodeId,
    graphId: "graph-55a",
    nodeType: "SIMULATION",
    tenantId: "tenant-alpha",
    lineageReference: `lineage-${nodeId}`,
    ...overrides,
  } satisfies DecisionGraphNodeInput);
}

function edge(edgeId: string, sourceNodeId: string, targetNodeId: string, overrides: Partial<DecisionGraphEdgeInput> = {}): DecisionGraphEdgeInput {
  return Object.freeze({
    edgeId,
    graphId: "graph-55a",
    sourceNodeId,
    targetNodeId,
    relationshipType: "DEPENDS_ON",
    tenantId: "tenant-alpha",
    ...overrides,
  } satisfies DecisionGraphEdgeInput);
}

function contractInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes = [
    node("node-b", { nodeType: "OBSERVABILITY" }),
    node("node-a", { nodeType: "SIMULATION" }),
    node("node-c", { nodeType: "GOVERNANCE" }),
  ];
  const edges = [
    edge("edge-b", "node-b", "node-c", { relationshipType: "OBSERVED_BY" }),
    edge("edge-a", "node-a", "node-c", { relationshipType: "INFLUENCED_BY" }),
  ];

  return Object.freeze({
    graphId: "graph-55a",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T05:00:00.000Z",
    nodes,
    edges,
    lineageReferences: nodes.map((item) => item.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

describe("decisionGraphContract", () => {
  it("creates deterministic contracts and seals deterministically", () => {
    const input = contractInput();
    const reversed = contractInput({
      nodes: [...input.nodes].reverse(),
      edges: [...input.edges].reverse(),
    });

    const firstHash = generateDecisionGraphHash(input);
    const secondHash = generateDecisionGraphHash(reversed);
    const firstSeal = sealDecisionGraphContract(input);
    const secondSeal = sealDecisionGraphContract(reversed);

    expect(firstHash).toBe(secondHash);
    expect(firstSeal).toEqual(secondSeal);
    expect(firstSeal.contract.graphState).toBe("SEALED");
    expect(firstSeal.contract.sealed).toBe(true);
    expect(firstSeal.contract.nodeCount).toBe(3);
    expect(firstSeal.contract.edgeCount).toBe(2);
  });

  it("builds reproducible node and edge hashes", () => {
    const nodeA = createDecisionGraphNodes([node("node-a")])[0];
    const nodeB = createDecisionGraphNodes([node("node-a")])[0];
    const edgeA = createDecisionGraphEdges([edge("edge-a", "node-a", "node-a")])[0];
    const edgeB = createDecisionGraphEdges([edge("edge-a", "node-a", "node-a")])[0];

    expect(nodeA.immutableHash).toBe(nodeB.immutableHash);
    expect(edgeA.immutableHash).toBe(edgeB.immutableHash);
  });

  it("rejects missing tenant ownership and missing lineage", () => {
    const missingTenant = sealDecisionGraphContract(contractInput({
      tenantId: "",
    }));
    const crossTenantNode = sealDecisionGraphContract(contractInput({
      nodes: [node("node-a", { tenantId: "tenant-beta" })],
      lineageReferences: ["lineage-node-a"],
    }));
    const missingLineage = sealDecisionGraphContract(contractInput({
      lineageReferences: [],
    }));

    expect(missingTenant.validation.valid).toBe(false);
    expect(missingTenant.validation.reasonCodes).toContain("TENANT_ID_MISSING");
    expect(crossTenantNode.validation.valid).toBe(false);
    expect(crossTenantNode.validation.reasonCodes).toContain("CROSS_TENANT_NODES_BLOCKED");
    expect(missingLineage.validation.valid).toBe(false);
    expect(missingLineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("rejects invalid node types", () => {
    const record = sealDecisionGraphContract(contractInput({
      nodes: [
        node("node-a", {
          nodeType: "INVALID" as unknown as DecisionGraphNodeInput["nodeType"],
        }),
      ],
      lineageReferences: ["lineage-node-a"],
      edges: [],
    }));

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("NODE_TYPE_INVALID");
  });

  it("rejects invalid edge relationships and missing nodes", () => {
    const invalidRelationship = sealDecisionGraphContract(contractInput({
      edges: [
        edge("edge-a", "node-a", "node-c", {
          relationshipType: "INVALID" as unknown as DecisionGraphEdgeInput["relationshipType"],
        }),
      ],
    }));
    const missingSource = sealDecisionGraphContract(contractInput({
      edges: [edge("edge-a", "missing-node", "node-c")],
    }));
    const missingTarget = sealDecisionGraphContract(contractInput({
      edges: [edge("edge-a", "node-a", "missing-node")],
    }));

    expect(invalidRelationship.validation.valid).toBe(false);
    expect(invalidRelationship.validation.reasonCodes).toContain("EDGE_RELATIONSHIP_INVALID");
    expect(missingSource.validation.valid).toBe(false);
    expect(missingSource.validation.reasonCodes).toContain("EDGE_SOURCE_NODE_MISSING");
    expect(missingTarget.validation.valid).toBe(false);
    expect(missingTarget.validation.reasonCodes).toContain("EDGE_TARGET_NODE_MISSING");
  });

  it("blocks cross-tenant edges and inconsistent graph ownership", () => {
    const crossTenantEdge = sealDecisionGraphContract(contractInput({
      edges: [edge("edge-a", "node-a", "node-c", { tenantId: "tenant-beta" })],
    }));
    const graphMismatch = sealDecisionGraphContract(contractInput({
      nodes: [node("node-a", { graphId: "graph-other" })],
      edges: [],
      lineageReferences: ["lineage-node-a"],
    }));

    expect(crossTenantEdge.validation.valid).toBe(false);
    expect(crossTenantEdge.validation.reasonCodes).toContain("CROSS_TENANT_EDGES_BLOCKED");
    expect(graphMismatch.validation.valid).toBe(false);
    expect(graphMismatch.validation.reasonCodes).toContain("GRAPH_ID_MISMATCH");
  });

  it("preserves lineage references deterministically", () => {
    const input = contractInput();
    const shuffled = contractInput({
      lineageReferences: [...input.lineageReferences].reverse(),
    });
    const first = sealDecisionGraphContract(input);
    const second = sealDecisionGraphContract(shuffled);

    expect(first.contract.lineageReferences).toEqual(["lineage-node-a", "lineage-node-b", "lineage-node-c"]);
    expect(first.contract.graphHash).toBe(second.contract.graphHash);
  });

  it("blocks sealed graph mutation attempts", () => {
    const record = sealDecisionGraphContract(contractInput({
      graphState: "SEALED",
      sealed: true,
      mutationAttempted: true,
    }));

    expect(record.validation.valid).toBe(false);
    expect(record.validation.reasonCodes).toContain("MUTATION_BLOCKED");
  });

  it("keeps execution impossible, authority unchanged, and workflow routing absent", () => {
    const execution = sealDecisionGraphContract(contractInput({
      executionRequested: true,
    }));
    const workflow = sealDecisionGraphContract(contractInput({
      workflowRoutingRequested: true,
    }));
    const authority = sealDecisionGraphContract(contractInput({
      authorityExpansionRequested: true,
    }));
    const healthy = sealDecisionGraphContract(contractInput());

    expect(execution.validation.valid).toBe(false);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.valid).toBe(false);
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(authority.validation.valid).toBe(false);
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.graphOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.decisionAuthorized).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.graphMutationAllowed).toBe(false);
    expect(healthy.selfExpansionAllowed).toBe(false);
    expect(healthy.validation.reasonCodes).toContain("EXECUTION_IMPOSSIBLE");
    expect(healthy.validation.reasonCodes).toContain("GRAPH_IS_NOT_DECISION");
  });

  it("does not mutate the provided inputs", () => {
    const input = contractInput();
    const before = JSON.stringify(input);

    sealDecisionGraphContract(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
