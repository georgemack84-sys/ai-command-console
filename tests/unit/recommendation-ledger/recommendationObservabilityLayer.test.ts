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
  sealEscalationIntelligence,
  type EscalationIntelligenceInput,
} from "@/services/escalation-intelligence";
import {
  buildLineageReconstructionRequest,
  buildRecommendationCertificationRequest,
  buildRecommendationHistoryVerificationRequest,
  buildRecommendationIntegrityRequest,
  buildRecommendationLedgerRequest,
  buildRecommendationObservabilityRequest,
  buildRecommendationReplayRequest,
  createRecommendationObservabilityEvidencePath,
  sealLineageReconstruction,
  sealRecommendationCertification,
  sealRecommendationHistoryVerification,
  sealRecommendationIntegrity,
  sealRecommendationLedger,
  sealRecommendationObservability,
  sealRecommendationReplay,
  type LineageReconstructionInput,
  type RecommendationCertificationInput,
  type RecommendationHistoryVerificationInput,
  type RecommendationIntegrityInput,
  type RecommendationLedgerInput,
  type RecommendationObservabilityInput,
  type RecommendationReplayInput,
} from "@/services/recommendation-ledger";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-58a", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-58a", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-58a", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-58a", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-58a",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-06T01:00:00.000Z",
    nodes,
    edges: [
      {
        edgeId: "edge-escalation-governance",
        graphId: "graph-58a",
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
  { proposalId: "proposal-a", graphId: "graph-58a", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];

const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-58a", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];

const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-58a", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildObservabilityInputs() {
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
  const verificationGraph = sealGraphIntegrityVerification({
    request: buildGraphIntegrityVerificationRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
    topology,
    inspection,
  });
  const graphCertification = sealDecisionGraphCertification({
    request: buildDecisionGraphCertificationRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection, verification: verificationGraph }),
    graph,
    dependencyGraph,
    proposalGraph,
    governanceGraph,
    escalationGraph,
    topology,
    inspection,
    verification: verificationGraph,
  } satisfies DecisionGraphCertificationInput);
  const escalation = sealEscalationIntelligence({
    request: buildEscalationIntelligenceRequest({
      certification: graphCertification,
      verification: verificationGraph,
      inspection,
      topology,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationIntelligenceInput, "request"> & { escalationContext?: never; tenantId?: string; graphVersion?: string }),
    certification: graphCertification,
    verification: verificationGraph,
    inspection,
    topology,
  });
  const escalationCertification = {
    ...graphCertification,
    result: {
      certificationHash: graphCertification.result.certificationHash,
      certificationState: "PASS",
      graphId: graphCertification.result.graphId,
      ownershipCertified: graphCertification.result.ownershipCertified,
      lineageCertified: graphCertification.result.lineageCertified,
      tenantIsolationVerified: graphCertification.result.tenantIsolationVerified,
      replayCertified: graphCertification.result.replayDeterministic,
      authorityBounded: graphCertification.result.authorityBounded,
      deterministic: graphCertification.result.deterministic,
    },
    sealed: true as const,
  } as RecommendationLedgerInput["escalationCertification"];
  const ledger = sealRecommendationLedger({
    request: buildRecommendationLedgerRequest({
      graph,
      intelligence: escalation,
      verification: verificationGraph,
      certification: graphCertification,
      escalationCertification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<RecommendationLedgerInput, "request"> & { recommendationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    graph,
    intelligence: escalation,
    verification: verificationGraph,
    certification: graphCertification,
    escalationCertification,
  });
  const lineage = sealLineageReconstruction({
    request: buildLineageReconstructionRequest({
      ledger,
      graph,
      verification: verificationGraph,
      certification: graphCertification,
      escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"],
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<LineageReconstructionInput, "request"> & { reconstructionContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    graph,
    verification: verificationGraph,
    certification: graphCertification,
    escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"],
  });
  const historyReferences = [
    ledger.entry.ledgerEntryId,
    ...ledger.entry.evidenceIds,
    ...lineage.ancestryChain.map((node) => node.lineageReference),
  ];
  const verification = sealRecommendationHistoryVerification({
    request: buildRecommendationHistoryVerificationRequest({
      ledger,
      lineage,
      escalation,
      graph,
      verification: verificationGraph,
      certification: graphCertification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
      historyReferences,
    } satisfies Omit<RecommendationHistoryVerificationInput, "request"> & { verificationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    lineage,
    escalation,
    graph,
    verification: verificationGraph,
    certification: graphCertification,
    historyReferences,
  });
  const replayReferences = [
    ledger.entry.ledgerEntryId,
    ...ledger.entry.evidenceIds,
    ...lineage.evidencePath.evidenceIds,
    ...verification.evidencePath.evidenceIds,
  ];
  const replay = sealRecommendationReplay({
    request: buildRecommendationReplayRequest({
      ledger,
      lineage,
      verification,
      escalation,
      graph,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
      replayReferences,
    } satisfies Omit<RecommendationReplayInput, "request"> & { replayContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    lineage,
    verification,
    escalation,
    graph,
    replayReferences,
  });
  const integrity = sealRecommendationIntegrity({
    request: buildRecommendationIntegrityRequest({
      ledger,
      lineage,
      verification,
      replay,
      escalation,
      graph,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
      historyReferences,
    } satisfies Omit<RecommendationIntegrityInput, "request"> & { integrityContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    lineage,
    verification,
    replay,
    escalation,
    graph,
    historyReferences,
  });
  const certification = sealRecommendationCertification({
    request: buildRecommendationCertificationRequest({
      ledger,
      lineage,
      verification,
      replay,
      integrity,
      escalation,
      graph,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
      historyReferences,
    } satisfies Omit<RecommendationCertificationInput, "request"> & { certificationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    lineage,
    verification,
    replay,
    integrity,
    escalation,
    graph,
    historyReferences,
  });

  return { ledger, lineage, verification, replay, integrity, certification, escalation, graph };
}

function observabilityInput(overrides: Partial<RecommendationObservabilityInput> = {}): RecommendationObservabilityInput {
  const base = buildObservabilityInputs();
  const request = buildRecommendationObservabilityRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies RecommendationObservabilityInput);
}

describe("recommendationObservabilityLayer", () => {
  it("is deterministic and reproduces observability hashes", () => {
    const input = observabilityInput();
    const first = sealRecommendationObservability(input);
    const second = sealRecommendationObservability(input);
    expect(first).toEqual(second);
    expect(first.result.observabilityState).toBe("VISIBLE");
    expect(first.result.observabilityHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = observabilityInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "REPLAY", "INTEGRITY", "CERTIFICATION", "FULL"] as const;
    for (const context of contexts) {
      const scoped = observabilityInput({ request: { ...base.request, observabilityContext: context } });
      expect(createRecommendationObservabilityEvidencePath(scoped)).toEqual(
        createRecommendationObservabilityEvidencePath(scoped),
      );
      expect(sealRecommendationObservability(scoped).result.observabilityHash).toBe(
        sealRecommendationObservability(scoped).result.observabilityHash,
      );
    }
  });

  it("blocks cross-tenant access and ownership mismatch", () => {
    const base = observabilityInput();
    const crossTenant = sealRecommendationObservability({
      ...base,
      escalation: { ...base.escalation, result: { ...base.escalation.result, tenantIsolationVerified: false } },
    });
    const ownershipMismatch = sealRecommendationObservability({
      ...base,
      request: { ...base.request, tenantId: "tenant-beta" },
    });
    expect(crossTenant.result.observabilityState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces replay absence as LIMITED", () => {
    const base = observabilityInput();
    const limited = sealRecommendationObservability({
      ...base,
      replay: { ...base.replay, result: { ...base.replay.result, replayState: "LIMITED", replayIntegrity: false } },
    });
    expect(limited.result.observabilityState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_VISIBILITY_LIMITED");
  });

  it("surfaces lineage visibility concern as ESCALATED", () => {
    const base = observabilityInput();
    const escalated = sealRecommendationObservability({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    expect(escalated.result.observabilityState).toBe("ESCALATED");
    expect(escalated.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("preserves integrity and certification visibility", () => {
    const healthy = sealRecommendationObservability(observabilityInput());
    expect(healthy.result.integrityVisible).toBe(true);
    expect(healthy.result.certificationVisible).toBe(true);
    expect(healthy.result.historyVisible).toBe(true);
  });

  it("invalidates authority expansion and observability mutation attempts", () => {
    const base = observabilityInput();
    const authority = sealRecommendationObservability({ ...base, authorityExpansionDetected: true });
    const mutation = sealRecommendationObservability({ ...base, observabilityMutationAttempted: true });
    expect(authority.result.observabilityState).toBe("INVALID");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("OBSERVABILITY_MUTATION_DETECTED");
  });

  it("keeps execution impossible and approval creation absent", () => {
    const base = observabilityInput();
    const execution = sealRecommendationObservability({ ...base, executionRequested: true });
    const workflow = sealRecommendationObservability({ ...base, workflowRoutingRequested: true });
    const generation = sealRecommendationObservability({ ...base, recommendationGenerationRequested: true });
    const approval = sealRecommendationObservability({ ...base, approvalCreationRequested: true });
    const healthy = sealRecommendationObservability(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(generation.validation.reasonCodes).toContain("RECOMMENDATION_GENERATION_DETECTED");
    expect(approval.validation.reasonCodes).toContain("APPROVAL_CREATION_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.recommendationGenerationAllowed).toBe(false);
    expect(healthy.approvalCreationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = observabilityInput();
    const before = JSON.stringify(input);
    sealRecommendationObservability(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
