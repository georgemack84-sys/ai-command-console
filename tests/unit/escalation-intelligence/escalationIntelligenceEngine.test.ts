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
import {
  buildEscalationIntelligenceRequest,
  createEscalationIntelligenceEvidencePath,
  sealEscalationIntelligence,
  type EscalationIntelligenceInput,
} from "@/services/escalation-intelligence";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-56a", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-56a", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-56a", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-56a", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];

  return Object.freeze({
    graphId: "graph-56a",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T14:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

function proposalNodes(): readonly ProposalNodeInput[] {
  return [{ proposalId: "proposal-a", graphId: "graph-56a", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" }];
}

function governanceNodes(): readonly GovernanceNodeInput[] {
  return [{ governanceId: "governance-a", graphId: "graph-56a", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" }];
}

function escalationNodes(): readonly EscalationNodeInput[] {
  return [{ escalationId: "escalation-a", graphId: "graph-56a", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" }];
}

function buildSealedCertification() {
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
      ...buildProposalRelationshipRequest({ graph, dependencyGraph, proposalNodes: proposalNodes() }),
      proposalNodeIds: ["proposal-a"],
      relationshipNodeIds: ["boundary-node", "governance-anchor"],
    },
    graph,
    dependencyGraph,
    proposalNodes: proposalNodes(),
  });
  const governanceGraph = sealGovernanceInfluenceGraph({
    request: {
      ...buildGovernanceInfluenceRequest({ graph, dependencyGraph, proposalGraph, governanceNodes: governanceNodes() }),
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
      ...buildEscalationGraphRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationNodes: escalationNodes() }),
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
    request: buildReplayableGraphTopologyRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
  });
  const inspection = sealGraphInspection({
    request: buildGraphInspectionRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
    topology,
  });
  const verification = sealGraphIntegrityVerification({
    request: buildGraphIntegrityVerificationRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
    topology,
    inspection,
  });
  const certification = sealDecisionGraphCertification({
    request: buildDecisionGraphCertificationRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection, verification }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
    topology,
    inspection,
    verification,
  } satisfies DecisionGraphCertificationInput);

  return { certification, verification, inspection, topology };
}

function intelligenceInput(overrides: Partial<EscalationIntelligenceInput> = {}): EscalationIntelligenceInput {
  const base = buildSealedCertification();
  const request = buildEscalationIntelligenceRequest(base);
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies EscalationIntelligenceInput);
}

describe("escalationIntelligenceEngine", () => {
  it("classifies deterministically and reproduces evidence hashes", () => {
    const input = intelligenceInput();
    const first = sealEscalationIntelligence(input);
    const second = sealEscalationIntelligence(input);

    expect(first).toEqual(second);
    expect(first.result.escalationClassification).toBe("NO_ESCALATION");
    expect(first.result.escalationEvidenceHash).toHaveLength(64);
    expect(first.result.deterministic).toBe(true);
  });

  it("keeps evaluation ordering and context-specific evidence reproducible", () => {
    const base = intelligenceInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "TOPOLOGY", "AUTHORITY", "FULL"] as const;

    for (const context of contexts) {
      const scoped = intelligenceInput({
        request: { ...base.request, escalationContext: context },
      });
      expect(createEscalationIntelligenceEvidencePath(scoped)).toEqual(createEscalationIntelligenceEvidencePath(scoped));
      expect(sealEscalationIntelligence(scoped).result.escalationEvidenceHash).toBe(sealEscalationIntelligence(scoped).result.escalationEvidenceHash);
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = intelligenceInput();
    const crossTenant = sealEscalationIntelligence({
      ...base,
      topology: {
        ...base.topology,
        nodes: base.topology.nodes.map((node, index) => index === 0 ? { ...node, tenantId: "tenant-beta" } : node),
      },
    });
    const ownershipMismatch = sealEscalationIntelligence({
      ...base,
      certification: {
        ...base.certification,
        result: {
          ...base.certification.result,
          ownershipCertified: false,
        },
      },
    });

    expect(crossTenant.validation.valid).toBe(false);
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.valid).toBe(false);
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces lineage corruption, topology degradation, and authority concern", () => {
    const base = intelligenceInput();
    const lineage = sealEscalationIntelligence({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    const topology = sealEscalationIntelligence({
      ...base,
      certification: {
        ...base.certification,
        result: { ...base.certification.result, certificationStatus: "CONDITIONAL_PASS", topologyCertified: true },
      },
    });
    const authority = sealEscalationIntelligence({
      ...base,
      authorityExpansionRequested: true,
    });

    expect(lineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(topology.result.escalationClassification).toBe("REVIEW_REQUIRED");
    expect(topology.result.topologyConcern).toBe(true);
    expect(authority.result.escalationClassification).toBe("HIGH_ATTENTION");
    expect(authority.result.authorityConcern).toBe(true);
  });

  it("invalidates broken evidence, hash mismatch, and mutation signals", () => {
    const base = intelligenceInput();
    const broken = sealEscalationIntelligence({
      ...base,
      certification: {
        ...base.certification,
        evidenceChain: { ...base.certification.evidenceChain, evidenceIds: [] },
      },
    });
    const hashMismatch = sealEscalationIntelligence({
      ...base,
      verification: {
        ...base.verification,
        result: { ...base.verification.result, verificationHash: "short" },
      },
    });
    const mutation = sealEscalationIntelligence({
      ...base,
      mutationSignalsDetected: true,
    });

    expect(broken.validation.reasonCodes).toContain("EVIDENCE_CHAIN_BROKEN");
    expect(hashMismatch.validation.reasonCodes).toContain("EVIDENCE_HASH_MISMATCH");
    expect(mutation.validation.reasonCodes).toContain("MUTATION_SIGNALS_DETECTED");
  });

  it("keeps execution impossible and escalation actions absent", () => {
    const base = intelligenceInput();
    const execution = sealEscalationIntelligence({ ...base, executionRequested: true });
    const workflow = sealEscalationIntelligence({ ...base, workflowRoutingRequested: true });
    const approval = sealEscalationIntelligence({ ...base, approvalCreationRequested: true });
    const notification = sealEscalationIntelligence({ ...base, notificationDispatchRequested: true });
    const governance = sealEscalationIntelligence({ ...base, governanceMutationRequested: true });
    const containment = sealEscalationIntelligence({ ...base, containmentActionRequested: true });
    const healthy = sealEscalationIntelligence(base);

    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(approval.validation.reasonCodes).toContain("APPROVAL_CREATION_DETECTED");
    expect(notification.validation.reasonCodes).toContain("NOTIFICATION_DISPATCH_DETECTED");
    expect(governance.validation.reasonCodes).toContain("GOVERNANCE_MUTATION_DETECTED");
    expect(containment.validation.reasonCodes).toContain("CONTAINMENT_ACTION_DETECTED");
    expect(healthy.readOnly).toBe(true);
    expect(healthy.intelligenceOnly).toBe(true);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.approvalCreationAllowed).toBe(false);
    expect(healthy.notificationDispatchAllowed).toBe(false);
    expect(healthy.governanceMutationAllowed).toBe(false);
    expect(healthy.containmentActionAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate sealed inputs", () => {
    const input = intelligenceInput();
    const before = JSON.stringify(input);

    sealEscalationIntelligence(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
