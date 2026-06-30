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
  buildEscalationCertificationRequest,
  buildEscalationGraphIntegrationRequest,
  buildEscalationIntegrityRequest,
  buildEscalationIntelligenceRequest,
  buildEscalationReplayRequest,
  buildGovernanceEscalationRequest,
  buildOversightRequirementRequest,
  buildUncertaintyTriggeredCautionRequest,
  createEscalationCertificationEvidencePath,
  sealEscalationCertification,
  sealEscalationGraphIntegration,
  sealEscalationIntegrity,
  sealEscalationIntelligence,
  sealEscalationReplay,
  sealGovernanceEscalation,
  sealOversightRequirement,
  sealUncertaintyTriggeredCaution,
  type EscalationCertificationInput,
  type EscalationGraphIntegrationInput,
  type EscalationIntegrityInput,
  type EscalationIntelligenceInput,
  type EscalationReplayInput,
  type GovernanceEscalationInput,
  type OversightRequirementInput,
  type UncertaintyTriggeredCautionInput,
} from "@/services/escalation-intelligence";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-56h", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-56h", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-56h", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-56h", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-56h",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-04T14:00:00.000Z",
    nodes,
    edges: [
      {
        edgeId: "edge-escalation-governance",
        graphId: "graph-56h",
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
  { proposalId: "proposal-a", graphId: "graph-56h", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];

const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-56h", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];

const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-56h", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildCertificationInputs() {
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
  const graphIntegration = sealEscalationGraphIntegration({
    request: buildEscalationGraphIntegrationRequest({
      intelligence,
      oversight,
      caution,
      governance,
      replay,
      topology,
      inspection,
      certification,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationGraphIntegrationInput, "request"> & { integrationContext?: never; tenantId?: string; graphVersion?: string }),
    intelligence,
    oversight,
    caution,
    governance,
    replay,
    topology,
    inspection,
    certification,
  });
  const integrity = sealEscalationIntegrity({
    request: buildEscalationIntegrityRequest({
      intelligence,
      oversight,
      caution,
      governance,
      replay,
      graphIntegration,
      verification,
      certification,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationIntegrityInput, "request"> & { integrityContext?: never; tenantId?: string; graphVersion?: string }),
    intelligence,
    oversight,
    caution,
    governance,
    replay,
    graphIntegration,
    verification,
    certification,
  });

  return { intelligence, oversight, caution, governance, replay, graphIntegration, integrity, verification, certification };
}

function certificationInput(overrides: Partial<EscalationCertificationInput> = {}): EscalationCertificationInput {
  const base = buildCertificationInputs();
  const request = buildEscalationCertificationRequest({
    ...base,
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies EscalationCertificationInput);
}

describe("escalationIntelligenceCertificationGate", () => {
  it("is deterministic and reproduces certification hashes", () => {
    const input = certificationInput();
    const first = sealEscalationCertification(input);
    const second = sealEscalationCertification(input);
    expect(first).toEqual(second);
    expect(first.result.certificationState).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = certificationInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "REPLAY", "GRAPH", "AUTHORITY", "FULL"] as const;
    for (const context of contexts) {
      const scoped = certificationInput({ request: { ...base.request, certificationContext: context } });
      expect(createEscalationCertificationEvidencePath(scoped)).toEqual(createEscalationCertificationEvidencePath(scoped));
      expect(sealEscalationCertification(scoped).result.certificationHash).toBe(
        sealEscalationCertification(scoped).result.certificationHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = certificationInput();
    const crossTenant = sealEscalationCertification({
      ...base,
      integrity: { ...base.integrity, result: { ...base.integrity.result, tenantIsolationVerified: false } },
    });
    const ownershipMismatch = sealEscalationCertification({
      ...base,
      certification: { ...base.certification, result: { ...base.certification.result, ownershipCertified: false } },
    });
    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces replay and graph degradation as conditional pass", () => {
    const base = certificationInput();
    const replay = sealEscalationCertification({
      ...base,
      integrity: { ...base.integrity, result: { ...base.integrity.result, replayIntegrity: false, integrityState: "LIMITED" } },
    });
    const graph = sealEscalationCertification({
      ...base,
      integrity: { ...base.integrity, result: { ...base.integrity.result, graphIntegrity: false, integrityState: "LIMITED" } },
    });
    expect(replay.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(replay.validation.reasonCodes).toContain("REPLAY_INTEGRITY_FAILURE");
    expect(graph.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(graph.validation.reasonCodes).toContain("GRAPH_INTEGRATION_FAILURE");
  });

  it("fails broken evidence, lineage loss, authority expansion, and mutation attempts", () => {
    const base = certificationInput();
    const broken = sealEscalationCertification({
      ...base,
      integrity: { ...base.integrity, result: { ...base.integrity.result, evidenceIntegrity: false, integrityState: "INVALID" } },
    });
    const lineage = sealEscalationCertification({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    const authority = sealEscalationCertification({
      ...base,
      authorityExpansionRequested: true,
    });
    const mutation = sealEscalationCertification({
      ...base,
      certificationMutationAttempted: true,
    });
    expect(broken.result.certificationState).toBe("FAIL");
    expect(broken.validation.reasonCodes).toContain("EVIDENCE_CHAIN_BROKEN");
    expect(lineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(authority.result.certificationState).toBe("FAIL");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
  });

  it("keeps execution impossible and escalation actions absent", () => {
    const base = certificationInput();
    const execution = sealEscalationCertification({ ...base, executionRequested: true });
    const workflow = sealEscalationCertification({ ...base, workflowRoutingRequested: true });
    const notification = sealEscalationCertification({ ...base, notificationDispatchRequested: true });
    const approval = sealEscalationCertification({ ...base, approvalCreationRequested: true });
    const governanceMutation = sealEscalationCertification({ ...base, governanceMutationRequested: true });
    const healthy = sealEscalationCertification(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(notification.validation.reasonCodes).toContain("NOTIFICATION_DISPATCH_DETECTED");
    expect(approval.validation.reasonCodes).toContain("APPROVAL_CREATION_DETECTED");
    expect(governanceMutation.validation.reasonCodes).toContain("GOVERNANCE_MUTATION_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.notificationDispatchAllowed).toBe(false);
    expect(healthy.approvalCreationAllowed).toBe(false);
    expect(healthy.governanceMutationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = certificationInput();
    const before = JSON.stringify(input);
    sealEscalationCertification(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
