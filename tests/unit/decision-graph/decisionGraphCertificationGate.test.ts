import { describe, expect, it } from "vitest";
import {
  buildDecisionGraphCertificationRequest,
  buildEscalationGraphRequest,
  buildGovernanceInfluenceRequest,
  buildGraphInspectionRequest,
  buildGraphIntegrityVerificationRequest,
  buildProposalRelationshipRequest,
  buildRecommendationDependencyRequest,
  buildReplayableGraphTopologyRequest,
  createDecisionGraphCertificationEvidenceChain,
  sealDecisionGraphCertification,
  sealDecisionGraphContract,
  sealEscalationGraph,
  sealGovernanceInfluenceGraph,
  sealGraphInspection,
  sealGraphIntegrityVerification,
  sealProposalRelationshipGraph,
  sealRecommendationDependencyGraph,
  sealReplayableGraphTopology,
  type DecisionGraphCertificationInput,
  type DecisionGraphContractInput,
  type DecisionGraphNodeInput,
  type EscalationNodeInput,
  type GovernanceNodeInput,
  type ProposalNodeInput,
} from "@/services/decision-graph";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    {
      nodeId: "boundary-node",
      graphId: "graph-55i",
      nodeType: "CONSTRAINT",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-boundary-node",
    },
    {
      nodeId: "governance-anchor",
      graphId: "graph-55i",
      nodeType: "GOVERNANCE",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-governance-anchor",
    },
    {
      nodeId: "recommendation-anchor",
      graphId: "graph-55i",
      nodeType: "RECOMMENDATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-recommendation-anchor",
    },
    {
      nodeId: "escalation-anchor",
      graphId: "graph-55i",
      nodeType: "ESCALATION",
      tenantId: "tenant-alpha",
      lineageReference: "lineage-escalation-anchor",
    },
  ];

  return Object.freeze({
    graphId: "graph-55i",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T13:00:00.000Z",
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
      graphId: "graph-55i",
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
      graphId: "graph-55i",
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
      graphId: "graph-55i",
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
  const verification = sealGraphIntegrityVerification({
    request: buildGraphIntegrityVerificationRequest({
      graph,
      dependencyGraph,
      proposalGraph,
      governanceGraph,
      escalationGraph,
      topology,
      inspection,
    }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
    topology,
    inspection,
  });

  return { graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection, verification };
}

function certificationInput(overrides: Partial<DecisionGraphCertificationInput> = {}): DecisionGraphCertificationInput {
  const base = buildSealedUpstream();
  const request = buildDecisionGraphCertificationRequest(base);
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies DecisionGraphCertificationInput);
}

describe("decisionGraphCertificationGate", () => {
  it("certifies deterministically with reproducible hashes", () => {
    const input = certificationInput();
    const first = sealDecisionGraphCertification(input);
    const second = sealDecisionGraphCertification(input);

    expect(first).toEqual(second);
    expect(first.result.certificationStatus).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("keeps certification scope and evidence ordering reproducible", () => {
    const base = certificationInput();
    const scopes = ["TOPOLOGY", "OWNERSHIP", "LINEAGE", "AUTHORITY", "FULL"] as const;

    for (const scope of scopes) {
      const scoped = certificationInput({
        request: {
          ...base.request,
          certificationScope: scope,
        },
      });
      const chainA = createDecisionGraphCertificationEvidenceChain(scoped);
      const chainB = createDecisionGraphCertificationEvidenceChain(scoped);
      const sealed = sealDecisionGraphCertification(scoped);

      expect(chainA).toEqual(chainB);
      expect(sealed.result.certificationHash).toBe(sealDecisionGraphCertification(scoped).result.certificationHash);
      expect(sealed.result.certificationStatus).toBe("PASS");
    }
  });

  it("fails cross-tenant artifacts and ownership corruption", () => {
    const base = certificationInput();
    const crossTenant = sealDecisionGraphCertification({
      ...base,
      graph: {
        ...base.graph,
        nodes: base.graph.nodes.map((node, index) => index === 0 ? { ...node, tenantId: "tenant-beta" } : node),
      },
    });
    const ownershipMismatch = sealDecisionGraphCertification({
      ...base,
      topology: {
        ...base.topology,
        nodes: base.topology.nodes.map((node, index) => index === 0 ? { ...node, graphId: "graph-other" } : node),
      },
    });

    expect(crossTenant.result.certificationStatus).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.result.certificationStatus).toBe("FAIL");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("fails lineage corruption, topology corruption, and missing verification evidence", () => {
    const base = certificationInput();
    const missingLineage = sealDecisionGraphCertification({
      ...base,
      request: {
        ...base.request,
        lineageReferences: [],
      },
    });
    const topologyCorruption = sealDecisionGraphCertification({
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
    const missingVerification = sealDecisionGraphCertification({
      ...base,
      verification: {
        ...base.verification,
        sealed: false,
      },
    });

    expect(missingLineage.result.certificationStatus).toBe("FAIL");
    expect(missingLineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(topologyCorruption.result.certificationStatus).toBe("FAIL");
    expect(topologyCorruption.validation.reasonCodes).toContain("TOPOLOGY_CORRUPTION_DETECTED");
    expect(missingVerification.result.certificationStatus).toBe("FAIL");
    expect(missingVerification.validation.reasonCodes).toContain("VERIFICATION_MISSING");
  });

  it("fails authority expansion, mutation attempts, and evidence hash corruption", () => {
    const base = certificationInput();
    const authority = sealDecisionGraphCertification({
      ...base,
      authorityExpansionRequested: true,
    });
    const mutation = sealDecisionGraphCertification({
      ...base,
      certificationMutationAttempted: true,
    });
    const evidenceMismatch = sealDecisionGraphCertification({
      ...base,
      verification: {
        ...base.verification,
        result: {
          ...base.verification.result,
          verificationHash: `${base.verification.result.verificationHash.slice(0, 63)}0`,
        },
      },
    });

    expect(authority.result.certificationStatus).toBe("FAIL");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(mutation.result.certificationStatus).toBe("FAIL");
    expect(mutation.validation.reasonCodes).toContain("CERTIFICATION_ATTEMPTS_MUTATION");
    expect(evidenceMismatch.result.certificationStatus).toBe("FAIL");
    expect(evidenceMismatch.validation.reasonCodes).toContain("EVIDENCE_HASH_MISMATCH");
  });

  it("returns conditional pass for bounded replay drift", () => {
    const base = certificationInput();
    const replayDriftInspection = sealGraphInspection({
      request: buildGraphInspectionRequest({
        graph: base.graph,
        dependencyGraph: base.dependencyGraph,
        proposalGraph: base.proposalGraph,
        governanceGraph: base.governanceGraph,
        escalationGraph: base.escalationGraph,
        topology: base.topology,
      }),
      graph: base.graph,
      dependencyGraph: base.dependencyGraph,
      proposalGraph: base.proposalGraph,
      governanceGraph: base.governanceGraph,
      escalationGraph: base.escalationGraph,
      topology: {
        ...base.topology,
      },
    });
    const driftedInspection = {
      ...replayDriftInspection,
      result: {
        ...replayDriftInspection.result,
        topologyDeterministic: false,
      },
      validation: {
        ...replayDriftInspection.validation,
        topologyDeterministic: false,
      },
    };
    const driftedVerification = sealGraphIntegrityVerification({
      request: buildGraphIntegrityVerificationRequest({
        graph: base.graph,
        dependencyGraph: base.dependencyGraph,
        proposalGraph: base.proposalGraph,
        governanceGraph: base.governanceGraph,
        escalationGraph: base.escalationGraph,
        topology: base.topology,
        inspection: driftedInspection,
      }),
      graph: base.graph,
      dependencyGraph: base.dependencyGraph,
      proposalGraph: base.proposalGraph,
      governanceGraph: base.governanceGraph,
      escalationGraph: base.escalationGraph,
      topology: base.topology,
      inspection: driftedInspection,
    });
    const conditional = sealDecisionGraphCertification({
      ...base,
      inspection: driftedInspection,
      verification: driftedVerification,
    });

    expect(conditional.result.certificationStatus).toBe("CONDITIONAL_PASS");
    expect(conditional.validation.reasonCodes).toContain("REPLAY_DETERMINISM_FAILURE");
  });

  it("keeps execution impossible, mutation impossible, and graph control absent", () => {
    const base = certificationInput();
    const execution = sealDecisionGraphCertification({
      ...base,
      executionRequested: true,
    });
    const workflow = sealDecisionGraphCertification({
      ...base,
      workflowRoutingRequested: true,
    });
    const optimization = sealDecisionGraphCertification({
      ...base,
      graphOptimizationRequested: true,
    });
    const ownershipMutation = sealDecisionGraphCertification({
      ...base,
      ownershipMutationRequested: true,
    });
    const healthy = sealDecisionGraphCertification(base);

    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(optimization.validation.reasonCodes).toContain("GRAPH_OPTIMIZATION_DETECTED");
    expect(ownershipMutation.validation.reasonCodes).toContain("OWNERSHIP_MUTATION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.certificationOnly).toBe(true);
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
    const input = certificationInput();
    const before = JSON.stringify(input);

    sealDecisionGraphCertification(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
