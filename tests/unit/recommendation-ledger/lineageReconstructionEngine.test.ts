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
import {
  buildLineageReconstructionRequest,
  buildRecommendationLedgerRequest,
  createLineageReconstructionEvidencePath,
  sealLineageReconstruction,
  sealRecommendationLedger,
  type LineageReconstructionInput,
  type RecommendationLedgerInput,
} from "@/services/recommendation-ledger";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-57b", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-57b", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-57b", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-57b", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-57b",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-04T16:00:00.000Z",
    nodes,
    edges: [
      {
        edgeId: "edge-escalation-governance",
        graphId: "graph-57b",
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
  { proposalId: "proposal-a", graphId: "graph-57b", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];

const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-57b", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];

const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-57b", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildReconstructionInputs() {
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
  const escalationCertification = sealEscalationCertification({
    request: buildEscalationCertificationRequest({
      intelligence,
      oversight,
      caution,
      governance,
      replay,
      graphIntegration,
      integrity,
      verification,
      certification,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationCertificationInput, "request"> & { certificationContext?: never; tenantId?: string; graphVersion?: string }),
    intelligence,
    oversight,
    caution,
    governance,
    replay,
    graphIntegration,
    integrity,
    verification,
    certification,
  });
  const ledger = sealRecommendationLedger({
    request: buildRecommendationLedgerRequest({
      graph,
      intelligence,
      verification,
      certification,
      escalationCertification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<RecommendationLedgerInput, "request"> & { recommendationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    graph,
    intelligence,
    verification,
    certification,
    escalationCertification,
  });
  return { ledger, graph, verification, certification, escalationCertification };
}

function reconstructionInput(overrides: Partial<LineageReconstructionInput> = {}): LineageReconstructionInput {
  const base = buildReconstructionInputs();
  const request = buildLineageReconstructionRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies LineageReconstructionInput);
}

describe("lineageReconstructionEngine", () => {
  it("is deterministic and reproduces reconstruction hashes", () => {
    const input = reconstructionInput();
    const first = sealLineageReconstruction(input);
    const second = sealLineageReconstruction(input);
    expect(first).toEqual(second);
    expect(first.result.reconstructionState).toBe("RECONSTRUCTED");
    expect(first.result.reconstructionHash).toHaveLength(64);
    expect(first.result.lineageHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = reconstructionInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "GRAPH", "ESCALATION", "FULL"] as const;
    for (const context of contexts) {
      const scoped = reconstructionInput({ request: { ...base.request, reconstructionContext: context } });
      expect(createLineageReconstructionEvidencePath(scoped)).toEqual(
        createLineageReconstructionEvidencePath(scoped),
      );
      expect(sealLineageReconstruction(scoped).result.reconstructionHash).toBe(
        sealLineageReconstruction(scoped).result.reconstructionHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = reconstructionInput();
    const crossTenant = sealLineageReconstruction({
      ...base,
      escalationCertification: {
        ...base.escalationCertification,
        result: { ...base.escalationCertification.result, tenantIsolationVerified: false },
      },
    });
    const ownershipMismatch = sealLineageReconstruction({
      ...base,
      request: { ...base.request, tenantId: "tenant-beta" },
    });
    expect(crossTenant.result.reconstructionState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces missing replay references as limited", () => {
    const base = reconstructionInput();
    const limited = sealLineageReconstruction({
      ...base,
      ledger: { ...base.ledger, result: { ...base.ledger.result, replayable: false, ledgerState: "LIMITED" } },
    });
    expect(limited.result.reconstructionState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
  });

  it("invalidates broken ancestry, lineage loss, and authority expansion", () => {
    const base = reconstructionInput();
    const broken = sealLineageReconstruction({
      ...base,
      ledger: { ...base.ledger, entry: { ...base.ledger.entry, lineageReferences: [] } },
    });
    const lineage = sealLineageReconstruction({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    const authority = sealLineageReconstruction({
      ...base,
      authorityExpansionRequested: true,
    });
    expect(broken.result.reconstructionState).toBe("INVALID");
    expect(broken.validation.reasonCodes).toContain("ANCESTRY_BROKEN");
    expect(lineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("keeps execution impossible and recommendation generation absent", () => {
    const base = reconstructionInput();
    const execution = sealLineageReconstruction({ ...base, executionRequested: true });
    const workflow = sealLineageReconstruction({ ...base, workflowRoutingRequested: true });
    const generation = sealLineageReconstruction({ ...base, recommendationGenerationRequested: true });
    const mutation = sealLineageReconstruction({ ...base, lineageMutationDetected: true });
    const healthy = sealLineageReconstruction(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(generation.validation.reasonCodes).toContain("RECOMMENDATION_GENERATION_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("LINEAGE_MUTATION_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.recommendationGenerationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.lineageMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = reconstructionInput();
    const before = JSON.stringify(input);
    sealLineageReconstruction(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
