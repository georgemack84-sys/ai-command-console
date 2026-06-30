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
  buildRecommendationReplayRequest,
  createRecommendationCertificationEvidencePath,
  sealLineageReconstruction,
  sealRecommendationCertification,
  sealRecommendationHistoryVerification,
  sealRecommendationIntegrity,
  sealRecommendationLedger,
  sealRecommendationReplay,
  type LineageReconstructionInput,
  type RecommendationCertificationInput,
  type RecommendationHistoryVerificationInput,
  type RecommendationIntegrityInput,
  type RecommendationLedgerInput,
  type RecommendationReplayInput,
} from "@/services/recommendation-ledger";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-57f", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-57f", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-57f", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-57f", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-57f",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-06T00:00:00.000Z",
    nodes,
    edges: [
      {
        edgeId: "edge-escalation-governance",
        graphId: "graph-57f",
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
  { proposalId: "proposal-a", graphId: "graph-57f", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];

const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-57f", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];

const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-57f", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
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
  const certificationGraph = sealDecisionGraphCertification({
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
      certification: certificationGraph,
      verification: verificationGraph,
      inspection,
      topology,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationIntelligenceInput, "request"> & { escalationContext?: never; tenantId?: string; graphVersion?: string }),
    certification: certificationGraph,
    verification: verificationGraph,
    inspection,
    topology,
  });
  const escalationCertification = {
    ...certificationGraph,
    result: {
      certificationHash: certificationGraph.result.certificationHash,
      certificationState: "PASS",
      graphId: certificationGraph.result.graphId,
      ownershipCertified: certificationGraph.result.ownershipCertified,
      lineageCertified: certificationGraph.result.lineageCertified,
      tenantIsolationVerified: certificationGraph.result.tenantIsolationVerified,
      replayCertified: certificationGraph.result.replayDeterministic,
      authorityBounded: certificationGraph.result.authorityBounded,
      deterministic: certificationGraph.result.deterministic,
    },
    sealed: true as const,
  } as RecommendationLedgerInput["escalationCertification"];
  const ledger = sealRecommendationLedger({
    request: buildRecommendationLedgerRequest({
      graph,
      intelligence: escalation,
      verification: verificationGraph,
      certification: certificationGraph,
      escalationCertification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<RecommendationLedgerInput, "request"> & { recommendationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    graph,
    intelligence: escalation,
    verification: verificationGraph,
    certification: certificationGraph,
    escalationCertification,
  });
  const lineage = sealLineageReconstruction({
    request: buildLineageReconstructionRequest({
      ledger,
      graph,
      verification: verificationGraph,
      certification: certificationGraph,
      escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"],
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<LineageReconstructionInput, "request"> & { reconstructionContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    graph,
    verification: verificationGraph,
    certification: certificationGraph,
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
      certification: certificationGraph,
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
    certification: certificationGraph,
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

  return { ledger, lineage, verification, replay, integrity, escalation, graph, historyReferences };
}

function certificationInput(overrides: Partial<RecommendationCertificationInput> = {}): RecommendationCertificationInput {
  const base = buildCertificationInputs();
  const request = buildRecommendationCertificationRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies RecommendationCertificationInput);
}

describe("recommendationCertificationGate", () => {
  it("is deterministic and reproduces certification hashes", () => {
    const input = certificationInput();
    const first = sealRecommendationCertification(input);
    const second = sealRecommendationCertification(input);
    expect(first).toEqual(second);
    expect(first.result.certificationState).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = certificationInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "REPLAY", "EVIDENCE", "FULL"] as const;
    for (const context of contexts) {
      const scoped = certificationInput({ request: { ...base.request, certificationContext: context } });
      expect(createRecommendationCertificationEvidencePath(scoped)).toEqual(
        createRecommendationCertificationEvidencePath(scoped),
      );
      expect(sealRecommendationCertification(scoped).result.certificationHash).toBe(
        sealRecommendationCertification(scoped).result.certificationHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = certificationInput();
    const crossTenant = sealRecommendationCertification({
      ...base,
      escalation: {
        ...base.escalation,
        result: { ...base.escalation.result, tenantIsolationVerified: false },
      },
    });
    const ownershipMismatch = sealRecommendationCertification({
      ...base,
      request: { ...base.request, tenantId: "tenant-beta" },
    });
    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("fails on history corruption and missing history evidence", () => {
    const base = certificationInput();
    const missingHistory = sealRecommendationCertification({ ...base, historyReferences: [] });
    const corruptedHistory = sealRecommendationCertification({
      ...base,
      ledger: { ...base.ledger, entry: { ...base.ledger.entry, evidenceIds: [] } },
    });
    expect(missingHistory.result.certificationState).toBe("FAIL");
    expect(missingHistory.validation.reasonCodes).toContain("HISTORY_REFERENCES_MISSING");
    expect(corruptedHistory.validation.reasonCodes).toContain("HISTORY_INTEGRITY_FAILED");
  });

  it("fails on lineage corruption", () => {
    const base = certificationInput();
    const lineageCorruption = sealRecommendationCertification({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    expect(lineageCorruption.result.certificationState).toBe("FAIL");
    expect(lineageCorruption.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("produces CONDITIONAL_PASS for bounded replay degradation", () => {
    const base = certificationInput();
    const replayMismatch = sealRecommendationCertification({
      ...base,
      replay: {
        ...base.replay,
        result: { ...base.replay.result, replayIntegrity: false, replayState: "LIMITED" },
      },
    });
    expect(replayMismatch.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(replayMismatch.validation.reasonCodes).toContain("REPLAY_HASH_MISMATCH");
  });

  it("fails on evidence chain breaks, authority expansion, and certification mutation attempts", () => {
    const base = certificationInput();
    const evidenceBroken = sealRecommendationCertification({
      ...base,
      integrity: { ...base.integrity, evidencePath: { ...base.integrity.evidencePath, evidenceIds: [] } },
    });
    const authority = sealRecommendationCertification({
      ...base,
      authorityExpansionDetected: true,
    });
    const mutation = sealRecommendationCertification({
      ...base,
      certificationMutationAttempted: true,
    });
    expect(evidenceBroken.result.certificationState).toBe("FAIL");
    expect(evidenceBroken.validation.reasonCodes).toContain("EVIDENCE_CHAIN_BROKEN");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
  });

  it("keeps execution impossible and recommendation generation absent", () => {
    const base = certificationInput();
    const execution = sealRecommendationCertification({ ...base, executionRequested: true });
    const workflow = sealRecommendationCertification({ ...base, workflowRoutingRequested: true });
    const generation = sealRecommendationCertification({ ...base, recommendationGenerationRequested: true });
    const prioritization = sealRecommendationCertification({ ...base, prioritizationRequested: true });
    const repair = sealRecommendationCertification({ ...base, repairRequested: true });
    const healthy = sealRecommendationCertification(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(generation.validation.reasonCodes).toContain("RECOMMENDATION_GENERATION_DETECTED");
    expect(prioritization.validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(repair.validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.recommendationGenerationAllowed).toBe(false);
    expect(healthy.prioritizationAllowed).toBe(false);
    expect(healthy.repairAuthorized).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = certificationInput();
    const before = JSON.stringify(input);
    sealRecommendationCertification(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
