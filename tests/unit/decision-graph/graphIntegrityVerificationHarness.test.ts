import { describe, expect, it } from "vitest";
import {
  buildEscalationGraphRequest,
  buildGovernanceInfluenceRequest,
  buildGraphInspectionRequest,
  buildGraphIntegrityVerificationRequest,
  buildProposalRelationshipRequest,
  buildRecommendationDependencyRequest,
  buildReplayableGraphTopologyRequest,
  createGraphIntegrityVerificationPath,
  sealDecisionGraphContract,
  sealEscalationGraph,
  sealGovernanceInfluenceGraph,
  sealGraphInspection,
  sealGraphIntegrityVerification,
  sealProposalRelationshipGraph,
  sealRecommendationDependencyGraph,
  sealReplayableGraphTopology,
  type DecisionGraphContractInput,
  type DecisionGraphNodeInput,
  type EscalationNodeInput,
  type GovernanceNodeInput,
  type GraphIntegrityVerificationInput,
  type ProposalNodeInput,
} from "@/services/decision-graph";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    {
      nodeId: "boundary-node",
      graphId: "graph-55h",
      nodeType: "CONSTRAINT",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-boundary-node",
    },
    {
      nodeId: "governance-anchor",
      graphId: "graph-55h",
      nodeType: "GOVERNANCE",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-governance-anchor",
    },
    {
      nodeId: "recommendation-anchor",
      graphId: "graph-55h",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-anchor",
    },
    {
      nodeId: "escalation-anchor",
      graphId: "graph-55h",
      nodeType: "ESCALATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-escalation-anchor",
    },
  ];

  return Object.freeze({
    graphId: "graph-55h",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T12:00:00.000Z",
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
      graphId: "graph-55h",
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
      graphId: "graph-55h",
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
      graphId: "graph-55h",
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
  const inspection = sealGraphInspection({
    request: buildGraphInspectionRequest({
      graph,
      dependencyGraph,
      proposalGraph,
      governanceGraph,
      escalationGraph,
      topology,
    }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
    topology,
  });

  return { graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection };
}

function verificationInput(overrides: Partial<GraphIntegrityVerificationInput> = {}): GraphIntegrityVerificationInput {
  const base = buildSealedUpstream();
  const request = buildGraphIntegrityVerificationRequest(base);
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies GraphIntegrityVerificationInput);
}

describe("graphIntegrityVerificationHarness", () => {
  it("verifies deterministically with reproducible hashes", () => {
    const input = verificationInput();
    const first = sealGraphIntegrityVerification(input);
    const second = sealGraphIntegrityVerification(input);

    expect(first).toEqual(second);
    expect(first.result.verificationStatus).toBe("PASS");
    expect(first.result.verificationHash).toHaveLength(64);
  });

  it("keeps verification scope and ordering reproducible", () => {
    const base = verificationInput();
    const scopes = ["OWNERSHIP", "LINEAGE", "TOPOLOGY", "AUTHORITY", "FULL"] as const;

    for (const scope of scopes) {
      const scoped = verificationInput({
        request: {
          ...base.request,
          verificationScope: scope,
        },
      });
      const pathA = createGraphIntegrityVerificationPath(scoped);
      const pathB = createGraphIntegrityVerificationPath(scoped);
      const sealed = sealGraphIntegrityVerification(scoped);

      expect(pathA).toEqual(pathB);
      expect(sealed.result.verificationHash).toBe(sealGraphIntegrityVerification(scoped).result.verificationHash);
      expect(sealed.result.verificationStatus).toBe(scope === "FULL" ? "PASS" : "LIMITED");
    }
  });

  it("blocks cross-tenant ownership drift and ownership mismatches", () => {
    const base = verificationInput();
    const crossTenant = sealGraphIntegrityVerification({
      ...base,
      graph: {
        ...base.graph,
        nodes: base.graph.nodes.map((node, index) => index === 0 ? { ...node, tenantId: "tenant-beta" } : node),
      },
    });
    const ownershipMismatch = sealGraphIntegrityVerification({
      ...base,
      topology: {
        ...base.topology,
        nodes: base.topology.nodes.map((node, index) => index === 0 ? { ...node, graphId: "graph-other" } : node),
      },
    });

    expect(crossTenant.result.verificationStatus).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.result.verificationStatus).toBe("FAIL");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("detects lineage corruption and topology corruption", () => {
    const base = verificationInput();
    const missingLineage = sealGraphIntegrityVerification({
      ...base,
      request: {
        ...base.request,
        lineageReferences: [],
      },
    });
    const topologyCorruption = sealGraphIntegrityVerification({
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
          reconstructionComplete: false,
        },
      },
    });

    expect(missingLineage.result.verificationStatus).toBe("FAIL");
    expect(missingLineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(topologyCorruption.result.verificationStatus).toBe("FAIL");
    expect(topologyCorruption.validation.reasonCodes).toContain("TOPOLOGY_CORRUPTION_DETECTED");
  });

  it("fails unsealed artifacts, duplicates, authority expansion, and mutation attempts", () => {
    const base = verificationInput();
    const unsealed = sealGraphIntegrityVerification({
      ...base,
      inspection: {
        ...base.inspection,
        sealed: false,
      },
    });
    const duplicates = sealGraphIntegrityVerification({
      ...base,
      topology: {
        ...base.topology,
        nodes: [...base.topology.nodes, base.topology.nodes[0]],
      },
    });
    const authority = sealGraphIntegrityVerification({
      ...base,
      authorityExpansionRequested: true,
    });
    const mutation = sealGraphIntegrityVerification({
      ...base,
      verificationMutationAttempted: true,
    });

    expect(unsealed.result.verificationStatus).toBe("FAIL");
    expect(unsealed.validation.reasonCodes).toContain("INSPECTION_UNSEALED");
    expect(duplicates.result.verificationStatus).toBe("FAIL");
    expect(duplicates.validation.reasonCodes).toContain("DUPLICATE_ARTIFACTS_DETECTED");
    expect(authority.result.verificationStatus).toBe("FAIL");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(mutation.result.verificationStatus).toBe("FAIL");
    expect(mutation.validation.reasonCodes).toContain("VERIFICATION_ATTEMPTS_MUTATION");
  });

  it("escalates replay determinism failures without introducing control", () => {
    const base = verificationInput();
    const escalated = sealGraphIntegrityVerification({
      ...base,
      inspection: {
        ...base.inspection,
        result: {
          ...base.inspection.result,
          topologyDeterministic: false,
        },
        validation: {
          ...base.inspection.validation,
          topologyDeterministic: false,
        },
      },
    });

    expect(escalated.result.verificationStatus).toBe("ESCALATED");
    expect(escalated.validation.reasonCodes).toContain("REPLAY_DETERMINISM_FAILURE");
  });

  it("keeps execution impossible, mutation impossible, and graph control absent", () => {
    const base = verificationInput();
    const execution = sealGraphIntegrityVerification({
      ...base,
      executionRequested: true,
    });
    const workflow = sealGraphIntegrityVerification({
      ...base,
      workflowRoutingRequested: true,
    });
    const optimization = sealGraphIntegrityVerification({
      ...base,
      graphOptimizationRequested: true,
    });
    const ownershipMutation = sealGraphIntegrityVerification({
      ...base,
      ownershipMutationRequested: true,
    });
    const healthy = sealGraphIntegrityVerification(base);

    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(optimization.validation.reasonCodes).toContain("GRAPH_OPTIMIZATION_DETECTED");
    expect(ownershipMutation.validation.reasonCodes).toContain("OWNERSHIP_MUTATION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.verificationOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.graphMutationAllowed).toBe(false);
    expect(healthy.graphOptimizationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.ownershipMutationAllowed).toBe(false);
    expect(healthy.repairAuthorized).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate sealed inputs", () => {
    const input = verificationInput();
    const before = JSON.stringify(input);

    sealGraphIntegrityVerification(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
