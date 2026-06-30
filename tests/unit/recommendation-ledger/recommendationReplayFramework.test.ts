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
  buildRecommendationLedgerRequest,
  buildRecommendationReplayRequest,
  createRecommendationReplayEvidencePath,
  sealLineageReconstruction,
  sealRecommendationHistoryVerification,
  sealRecommendationLedger,
  sealRecommendationReplay,
  type LineageReconstructionInput,
  type RecommendationHistoryVerificationInput,
  type RecommendationLedgerInput,
  type RecommendationReplayInput,
} from "@/services/recommendation-ledger";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-57d", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-57d", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-57d", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-57d", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-57d",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-05T00:00:00.000Z",
    nodes,
    edges: [
      {
        edgeId: "edge-escalation-governance",
        graphId: "graph-57d",
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
  { proposalId: "proposal-a", graphId: "graph-57d", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];

const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-57d", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];

const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-57d", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildReplayInputs() {
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
  const ledger = sealRecommendationLedger({
    request: buildRecommendationLedgerRequest({
      graph,
      intelligence: escalation,
      verification: verificationGraph,
      certification,
      escalationCertification: {
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
      } as RecommendationLedgerInput["escalationCertification"],
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<RecommendationLedgerInput, "request"> & { recommendationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    graph,
    intelligence: escalation,
    verification: verificationGraph,
    certification,
    escalationCertification: {
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
    } as RecommendationLedgerInput["escalationCertification"],
  });
  const lineage = sealLineageReconstruction({
    request: buildLineageReconstructionRequest({
      ledger,
      graph,
      verification: verificationGraph,
      certification,
      escalationCertification: {
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
      } as LineageReconstructionInput["escalationCertification"],
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<LineageReconstructionInput, "request"> & { reconstructionContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    graph,
    verification: verificationGraph,
    certification,
    escalationCertification: {
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
    } as LineageReconstructionInput["escalationCertification"],
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

  return { ledger, lineage, verification, escalation, graph };
}

function replayInput(overrides: Partial<RecommendationReplayInput> = {}): RecommendationReplayInput {
  const base = buildReplayInputs();
  const replayReferences = [
    base.ledger.entry.ledgerEntryId,
    ...base.ledger.entry.evidenceIds,
    ...base.lineage.evidencePath.evidenceIds,
    ...base.verification.evidencePath.evidenceIds,
  ];
  const request = buildRecommendationReplayRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
    replayReferences,
  });
  return Object.freeze({
    request,
    ...base,
    replayReferences,
    ...overrides,
  } satisfies RecommendationReplayInput);
}

describe("recommendationReplayFramework", () => {
  it("is deterministic and reproduces replay hashes", () => {
    const input = replayInput();
    const first = sealRecommendationReplay(input);
    const second = sealRecommendationReplay(input);
    expect(first).toEqual(second);
    expect(first.result.replayState).toBe("REPLAYABLE");
    expect(first.result.replayHash).toHaveLength(64);
    expect(first.result.reconstructionHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = replayInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "REPLAY", "LEDGER", "FULL"] as const;
    for (const context of contexts) {
      const scoped = replayInput({ request: { ...base.request, replayContext: context } });
      expect(createRecommendationReplayEvidencePath(scoped)).toEqual(
        createRecommendationReplayEvidencePath(scoped),
      );
      expect(sealRecommendationReplay(scoped).result.replayHash).toBe(
        sealRecommendationReplay(scoped).result.replayHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = replayInput();
    const crossTenant = sealRecommendationReplay({
      ...base,
      escalation: {
        ...base.escalation,
        result: { ...base.escalation.result, tenantIsolationVerified: false },
      },
    });
    const ownershipMismatch = sealRecommendationReplay({
      ...base,
      request: { ...base.request, tenantId: "tenant-beta" },
    });
    expect(crossTenant.result.replayState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces lineage corruption and missing replay references", () => {
    const base = replayInput();
    const missingReplayReferences = sealRecommendationReplay({ ...base, replayReferences: [] });
    const lineageCorruption = sealRecommendationReplay({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    expect(missingReplayReferences.result.replayState).toBe("INVALID");
    expect(missingReplayReferences.validation.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
    expect(lineageCorruption.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("downgrades reconstruction mismatch and replay hash mismatch to LIMITED", () => {
    const base = replayInput();
    const reconstructionLimited = sealRecommendationReplay({
      ...base,
      verification: {
        ...base.verification,
        result: { ...base.verification.result, verificationState: "LIMITED" },
      },
    });
    const replayLimited = sealRecommendationReplay({
      ...base,
      ledger: {
        ...base.ledger,
        result: { ...base.ledger.result, replayable: false, ledgerState: "LIMITED" },
      },
    });
    expect(reconstructionLimited.result.replayState).toBe("LIMITED");
    expect(reconstructionLimited.validation.reasonCodes).toContain("RECONSTRUCTION_MISMATCH");
    expect(replayLimited.result.replayState).toBe("LIMITED");
    expect(replayLimited.validation.reasonCodes).toContain("REPLAY_HASH_MISMATCH");
  });

  it("invalidates evidence hash mismatch, authority expansion, and replay mutation attempts", () => {
    const base = replayInput();
    const evidence = sealRecommendationReplay({
      ...base,
      ledger: {
        ...base.ledger,
        result: { ...base.ledger.result, evidenceHash: "short-hash" },
      },
    });
    const authority = sealRecommendationReplay({
      ...base,
      authorityExpansionDetected: true,
    });
    const mutation = sealRecommendationReplay({
      ...base,
      replayMutationAttempted: true,
    });
    expect(evidence.result.replayState).toBe("INVALID");
    expect(evidence.validation.reasonCodes).toContain("EVIDENCE_HASH_MISMATCH");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("REPLAY_MUTATION_DETECTED");
  });

  it("keeps execution impossible and recommendation generation absent", () => {
    const base = replayInput();
    const execution = sealRecommendationReplay({ ...base, executionRequested: true });
    const workflow = sealRecommendationReplay({ ...base, workflowRoutingRequested: true });
    const generation = sealRecommendationReplay({ ...base, recommendationGenerationRequested: true });
    const repair = sealRecommendationReplay({ ...base, repairRequested: true });
    const healthy = sealRecommendationReplay(base);
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
    const input = replayInput();
    const before = JSON.stringify(input);
    sealRecommendationReplay(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
