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
  buildRecommendationHistoryVerificationRequest,
  buildRecommendationIntegrityRequest,
  buildRecommendationLedgerRequest,
  buildRecommendationReplayRequest,
  createRecommendationIntegrityEvidencePath,
  sealLineageReconstruction,
  sealRecommendationHistoryVerification,
  sealRecommendationIntegrity,
  sealRecommendationLedger,
  sealRecommendationReplay,
  type LineageReconstructionInput,
  type RecommendationHistoryVerificationInput,
  type RecommendationIntegrityInput,
  type RecommendationLedgerInput,
  type RecommendationReplayInput,
} from "@/services/recommendation-ledger";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-57e", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-57e", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-57e", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-57e", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-57e",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-05T01:00:00.000Z",
    nodes,
    edges: [
      {
        edgeId: "edge-escalation-governance",
        graphId: "graph-57e",
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
  { proposalId: "proposal-a", graphId: "graph-57e", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];

const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-57e", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];

const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-57e", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildIntegrityInputs() {
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
  const certification = sealDecisionGraphCertification({
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
      certification,
      verification: verificationGraph,
      inspection,
      topology,
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationIntelligenceInput, "request"> & { escalationContext?: never; tenantId?: string; graphVersion?: string }),
    certification,
    verification: verificationGraph,
    inspection,
    topology,
  });
  const escalationCertification = {
    ...certification,
    result: {
      certificationHash: certification.result.certificationHash,
      certificationState: "PASS",
      graphId: certification.result.graphId,
      ownershipCertified: certification.result.ownershipCertified,
      lineageCertified: certification.result.lineageCertified,
      tenantIsolationVerified: certification.result.tenantIsolationVerified,
      replayCertified: certification.result.replayDeterministic,
      authorityBounded: certification.result.authorityBounded,
      deterministic: certification.result.deterministic,
    },
    sealed: true as const,
  } as RecommendationLedgerInput["escalationCertification"];
  const ledger = sealRecommendationLedger({
    request: buildRecommendationLedgerRequest({
      graph,
      intelligence: escalation,
      verification: verificationGraph,
      certification,
      escalationCertification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<RecommendationLedgerInput, "request"> & { recommendationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    graph,
    intelligence: escalation,
    verification: verificationGraph,
    certification,
    escalationCertification,
  });
  const lineage = sealLineageReconstruction({
    request: buildLineageReconstructionRequest({
      ledger,
      graph,
      verification: verificationGraph,
      certification,
      escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"],
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<LineageReconstructionInput, "request"> & { reconstructionContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    graph,
    verification: verificationGraph,
    certification,
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
      certification,
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
    certification,
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

  return { ledger, lineage, verification, replay, escalation, graph, historyReferences };
}

function integrityInput(overrides: Partial<RecommendationIntegrityInput> = {}): RecommendationIntegrityInput {
  const base = buildIntegrityInputs();
  const request = buildRecommendationIntegrityRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies RecommendationIntegrityInput);
}

describe("recommendationIntegrityEnforcement", () => {
  it("is deterministic and reproduces integrity hashes", () => {
    const input = integrityInput();
    const first = sealRecommendationIntegrity(input);
    const second = sealRecommendationIntegrity(input);
    expect(first).toEqual(second);
    expect(first.result.integrityState).toBe("HEALTHY");
    expect(first.result.integrityHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = integrityInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "REPLAY", "EVIDENCE", "FULL"] as const;
    for (const context of contexts) {
      const scoped = integrityInput({ request: { ...base.request, integrityContext: context } });
      expect(createRecommendationIntegrityEvidencePath(scoped)).toEqual(
        createRecommendationIntegrityEvidencePath(scoped),
      );
      expect(sealRecommendationIntegrity(scoped).result.integrityHash).toBe(
        sealRecommendationIntegrity(scoped).result.integrityHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = integrityInput();
    const crossTenant = sealRecommendationIntegrity({
      ...base,
      escalation: {
        ...base.escalation,
        result: { ...base.escalation.result, tenantIsolationVerified: false },
      },
    });
    const ownershipMismatch = sealRecommendationIntegrity({
      ...base,
      request: { ...base.request, tenantId: "tenant-beta" },
    });
    expect(crossTenant.result.integrityState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces history corruption and missing history evidence", () => {
    const base = integrityInput();
    const missingHistory = sealRecommendationIntegrity({ ...base, historyReferences: [] });
    const corruptedHistory = sealRecommendationIntegrity({
      ...base,
      ledger: { ...base.ledger, entry: { ...base.ledger.entry, evidenceIds: [] } },
    });
    expect(missingHistory.result.integrityState).toBe("INVALID");
    expect(missingHistory.validation.reasonCodes).toContain("HISTORY_REFERENCES_MISSING");
    expect(corruptedHistory.validation.reasonCodes).toContain("HISTORY_CORRUPTION_DETECTED");
  });

  it("surfaces lineage corruption and keeps ordering deterministic", () => {
    const base = integrityInput();
    const lineageCorruption = sealRecommendationIntegrity({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    expect(lineageCorruption.result.integrityState).toBe("INVALID");
    expect(lineageCorruption.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("downgrades replay mismatch to LIMITED and bounded ledger degradation to DEGRADED", () => {
    const base = integrityInput();
    const replayLimited = sealRecommendationIntegrity({
      ...base,
      replay: {
        ...base.replay,
        result: { ...base.replay.result, replayIntegrity: false, replayState: "LIMITED" },
      },
    });
    const degraded = sealRecommendationIntegrity({
      ...base,
      ledger: {
        ...base.ledger,
        result: { ...base.ledger.result, ledgerState: "LIMITED" },
      },
    });
    expect(replayLimited.result.integrityState).toBe("LIMITED");
    expect(replayLimited.validation.reasonCodes).toContain("REPLAY_HASH_MISMATCH");
    expect(degraded.result.integrityState).toBe("DEGRADED");
  });

  it("invalidates evidence chain breaks, authority expansion, and integrity mutation attempts", () => {
    const base = integrityInput();
    const evidenceBroken = sealRecommendationIntegrity({
      ...base,
      replay: { ...base.replay, evidencePath: { ...base.replay.evidencePath, evidenceIds: [] } },
    });
    const authority = sealRecommendationIntegrity({
      ...base,
      authorityExpansionDetected: true,
    });
    const mutation = sealRecommendationIntegrity({
      ...base,
      integrityMutationAttempted: true,
    });
    expect(evidenceBroken.result.integrityState).toBe("INVALID");
    expect(evidenceBroken.validation.reasonCodes).toContain("EVIDENCE_CHAIN_BROKEN");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("INTEGRITY_MUTATION_DETECTED");
  });

  it("keeps execution impossible and recommendation generation absent", () => {
    const base = integrityInput();
    const execution = sealRecommendationIntegrity({ ...base, executionRequested: true });
    const workflow = sealRecommendationIntegrity({ ...base, workflowRoutingRequested: true });
    const generation = sealRecommendationIntegrity({ ...base, recommendationGenerationRequested: true });
    const repair = sealRecommendationIntegrity({ ...base, repairRequested: true });
    const healthy = sealRecommendationIntegrity(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(generation.validation.reasonCodes).toContain("RECOMMENDATION_GENERATION_DETECTED");
    expect(repair.validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.recommendationGenerationAllowed).toBe(false);
    expect(healthy.repairAuthorized).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = integrityInput();
    const before = JSON.stringify(input);
    sealRecommendationIntegrity(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
