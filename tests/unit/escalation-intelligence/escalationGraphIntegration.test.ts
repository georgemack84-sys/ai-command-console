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
  buildEscalationGraphIntegrationRequest,
  buildEscalationIntelligenceRequest,
  buildEscalationReplayRequest,
  buildGovernanceEscalationRequest,
  buildOversightRequirementRequest,
  buildUncertaintyTriggeredCautionRequest,
  createEscalationGraphIntegrationEvidencePath,
  sealEscalationGraphIntegration,
  sealEscalationIntelligence,
  sealEscalationReplay,
  sealGovernanceEscalation,
  sealOversightRequirement,
  sealUncertaintyTriggeredCaution,
  type EscalationGraphIntegrationInput,
  type EscalationIntelligenceInput,
  type EscalationReplayInput,
  type GovernanceEscalationInput,
  type OversightRequirementInput,
  type UncertaintyTriggeredCautionInput,
} from "@/services/escalation-intelligence";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-56f", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-56f", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-56f", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-56f", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-56f",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-04T12:00:00.000Z",
    nodes,
    edges: [
      {
        edgeId: "edge-escalation-governance",
        graphId: "graph-56f",
        sourceNodeId: "escalation-anchor",
        targetNodeId: "governance-anchor",
        relationshipType: "ESCALATES_TO",
        tenantId: "tenant-alpha",
      },
    ],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

const proposalNodes = (): readonly ProposalNodeInput[] => [
  { proposalId: "proposal-a", graphId: "graph-56f", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];

const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-56f", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];

const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-56f", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildIntegratedInputs() {
  const graph = sealDecisionGraphContract(graphInput());
  const dependencyGraph = sealRecommendationDependencyGraph({
    request: { ...buildRecommendationDependencyRequest({ graph }), recommendationNodeIds: ["recommendation-anchor"], dependencyNodeIds: ["boundary-node", "governance-anchor"] },
    graph,
  });
  const proposalGraph = sealProposalRelationshipGraph({
    request: { ...buildProposalRelationshipRequest({ graph, dependencyGraph, proposalNodes: proposalNodes() }), proposalNodeIds: ["proposal-a"], relationshipNodeIds: ["boundary-node", "governance-anchor"] },
    graph,
    dependencyGraph,
    proposalNodes: proposalNodes(),
  });
  const governanceGraph = sealGovernanceInfluenceGraph({
    request: { ...buildGovernanceInfluenceRequest({ graph, dependencyGraph, proposalGraph, governanceNodes: governanceNodes() }), governanceNodeIds: ["governance-a"], influencedNodeIds: ["boundary-node", "recommendation-anchor"] },
    graph,
    dependencyGraph,
    proposalGraph,
    governanceNodes: governanceNodes(),
  });
  const escalationGraph = sealEscalationGraph({
    request: { ...buildEscalationGraphRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationNodes: escalationNodes() }), escalationNodeIds: ["escalation-a"], targetNodeIds: ["boundary-node", "recommendation-anchor"] },
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
  const intelligence = sealEscalationIntelligence({
    request: buildEscalationIntelligenceRequest({
      certification,
      verification,
      inspection,
      topology,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationIntelligenceInput, "request"> & { escalationContext?: never; tenantId?: string; graphVersion?: string }),
    certification,
    verification,
    inspection,
    topology,
  });
  const oversight = sealOversightRequirement({
    request: buildOversightRequirementRequest({
      intelligence,
      certification,
      verification,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<OversightRequirementInput, "request"> & { oversightContext?: never; tenantId?: string; graphVersion?: string }),
    intelligence,
    certification,
    verification,
  });
  const caution = sealUncertaintyTriggeredCaution({
    request: buildUncertaintyTriggeredCautionRequest({
      intelligence,
      oversight,
      verification,
      certification,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<UncertaintyTriggeredCautionInput, "request"> & { uncertaintyContext?: never; tenantId?: string; graphVersion?: string }),
    intelligence,
    oversight,
    verification,
    certification,
  });
  const governance = sealGovernanceEscalation({
    request: buildGovernanceEscalationRequest({
      intelligence,
      oversight,
      caution,
      verification,
      certification,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<GovernanceEscalationInput, "request"> & { governanceContext?: never; tenantId?: string; graphVersion?: string }),
    intelligence,
    oversight,
    caution,
    verification,
    certification,
  });
  const replay = sealEscalationReplay({
    request: buildEscalationReplayRequest({
      intelligence,
      oversight,
      caution,
      governance,
      verification,
      certification,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationReplayInput, "request"> & { replayContext?: never; tenantId?: string; graphVersion?: string }),
    intelligence,
    oversight,
    caution,
    governance,
    verification,
    certification,
  });

  return { intelligence, oversight, caution, governance, replay, topology, inspection, certification };
}

function integrationInput(overrides: Partial<EscalationGraphIntegrationInput> = {}): EscalationGraphIntegrationInput {
  const base = buildIntegratedInputs();
  const request = buildEscalationGraphIntegrationRequest({
    ...base,
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies EscalationGraphIntegrationInput);
}

describe("escalationGraphIntegration", () => {
  it("is deterministic and reproduces graph hashes", () => {
    const input = integrationInput();
    const first = sealEscalationGraphIntegration(input);
    const second = sealEscalationGraphIntegration(input);
    expect(first).toEqual(second);
    expect(first.result.integrationState).toBe("INTEGRATED");
    expect(first.result.graphEvidenceHash).toHaveLength(64);
    expect(first.result.relationshipHash).toHaveLength(64);
  });

  it("keeps integration ordering reproducible across contexts", () => {
    const base = integrationInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "TOPOLOGY", "AUTHORITY", "FULL"] as const;
    for (const context of contexts) {
      const scoped = integrationInput({ request: { ...base.request, integrationContext: context } });
      expect(createEscalationGraphIntegrationEvidencePath(scoped)).toEqual(
        createEscalationGraphIntegrationEvidencePath(scoped),
      );
      expect(sealEscalationGraphIntegration(scoped).result.relationshipHash).toBe(
        sealEscalationGraphIntegration(scoped).result.relationshipHash,
      );
    }
  });

  it("blocks cross-tenant references and ownership mismatch", () => {
    const base = integrationInput();
    const crossTenant = sealEscalationGraphIntegration({
      ...base,
      replay: { ...base.replay, result: { ...base.replay.result, tenantIsolationVerified: false } },
    });
    const ownershipMismatch = sealEscalationGraphIntegration({
      ...base,
      certification: { ...base.certification, result: { ...base.certification.result, ownershipCertified: false } },
    });
    expect(crossTenant.result.integrationState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces topology degradation, replay mismatch, and limited visibility", () => {
    const base = integrationInput();
    const limited = sealEscalationGraphIntegration({
      ...base,
      inspection: { ...base.inspection, result: { ...base.inspection.result, inspectionState: "LIMITED" } },
    });
    const topology = sealEscalationGraphIntegration({
      ...base,
      topology: { ...base.topology, result: { ...base.topology.result, topologyDeterministic: false } },
    });
    const replay = sealEscalationGraphIntegration({
      ...base,
      replay: { ...base.replay, result: { ...base.replay.result, replayState: "ESCALATED" } },
    });
    expect(limited.result.integrationState).toBe("LIMITED");
    expect(topology.result.integrationState).toBe("ESCALATED");
    expect(topology.validation.reasonCodes).toContain("TOPOLOGY_MISMATCH_DETECTED");
    expect(replay.result.integrationState).toBe("ESCALATED");
    expect(replay.validation.reasonCodes).toContain("REPLAY_GRAPH_MISMATCH");
  });

  it("invalidates broken relationships, missing graph evidence, and authority expansion", () => {
    const base = integrationInput();
    const broken = sealEscalationGraphIntegration({
      ...base,
      replay: { ...base.replay, evidencePath: { ...base.replay.evidencePath, evidenceIds: [] } },
    });
    const missingGraph = sealEscalationGraphIntegration({
      ...base,
      topology: { ...base.topology, nodes: [], edges: [] },
    });
    const authority = sealEscalationGraphIntegration({
      ...base,
      authorityExpansionRequested: true,
    });
    expect(broken.validation.reasonCodes).toContain("RELATIONSHIP_REFERENCES_BROKEN");
    expect(missingGraph.result.integrationState).toBe("INVALID");
    expect(missingGraph.validation.reasonCodes).toContain("GRAPH_EVIDENCE_MISSING");
    expect(authority.result.integrationState).toBe("INVALID");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("keeps execution impossible and graph actions absent", () => {
    const base = integrationInput();
    const execution = sealEscalationGraphIntegration({ ...base, executionRequested: true });
    const workflow = sealEscalationGraphIntegration({ ...base, workflowRoutingRequested: true });
    const notification = sealEscalationGraphIntegration({ ...base, notificationDispatchRequested: true });
    const approval = sealEscalationGraphIntegration({ ...base, approvalCreationRequested: true });
    const mutation = sealEscalationGraphIntegration({ ...base, graphMutationRequested: true });
    const optimization = sealEscalationGraphIntegration({ ...base, graphOptimizationRequested: true });
    const healthy = sealEscalationGraphIntegration(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(notification.validation.reasonCodes).toContain("NOTIFICATION_DISPATCH_DETECTED");
    expect(approval.validation.reasonCodes).toContain("APPROVAL_CREATION_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("GRAPH_MUTATION_DETECTED");
    expect(optimization.validation.reasonCodes).toContain("GRAPH_OPTIMIZATION_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.notificationDispatchAllowed).toBe(false);
    expect(healthy.approvalCreationAllowed).toBe(false);
    expect(healthy.graphMutationAllowed).toBe(false);
    expect(healthy.graphOptimizationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = integrationInput();
    const before = JSON.stringify(input);
    sealEscalationGraphIntegration(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
