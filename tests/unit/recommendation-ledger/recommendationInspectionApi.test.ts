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
  buildRecommendationInspectionRequest,
  buildRecommendationIntegrityRequest,
  buildRecommendationLedgerRequest,
  buildRecommendationObservabilityRequest,
  buildRecommendationReplayRequest,
  createRecommendationInspectionEvidencePath,
  sealLineageReconstruction,
  sealRecommendationCertification,
  sealRecommendationHistoryVerification,
  sealRecommendationInspection,
  sealRecommendationIntegrity,
  sealRecommendationLedger,
  sealRecommendationObservability,
  sealRecommendationReplay,
  type LineageReconstructionInput,
  type RecommendationCertificationInput,
  type RecommendationHistoryVerificationInput,
  type RecommendationInspectionInput,
  type RecommendationIntegrityInput,
  type RecommendationLedgerInput,
  type RecommendationObservabilityInput,
  type RecommendationReplayInput,
} from "@/services/recommendation-ledger";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-58b", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-58b", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-58b", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-58b", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-58b",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-06T02:00:00.000Z",
    nodes,
    edges: [{
      edgeId: "edge-escalation-governance",
      graphId: "graph-58b",
      sourceNodeId: "escalation-anchor",
      targetNodeId: "governance-anchor",
      relationshipType: "ESCALATES_TO",
      tenantId: "tenant-alpha",
    }],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

const proposalNodes = (): readonly ProposalNodeInput[] => [
  { proposalId: "proposal-a", graphId: "graph-58b", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-58b", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-58b", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildInspectionInputs() {
  const graph = sealDecisionGraphContract(graphInput());
  const dependencyGraph = sealRecommendationDependencyGraph({
    request: { ...buildRecommendationDependencyRequest({ graph }), recommendationNodeIds: ["recommendation-anchor"], dependencyNodeIds: ["boundary-node", "governance-anchor"] },
    graph,
  });
  const proposalGraph = sealProposalRelationshipGraph({
    request: { ...buildProposalRelationshipRequest({ graph, dependencyGraph, proposalNodes: proposalNodes() }), proposalNodeIds: ["proposal-a"], relationshipNodeIds: ["boundary-node", "governance-anchor"] },
    graph, dependencyGraph, proposalNodes: proposalNodes(),
  });
  const governanceGraph = sealGovernanceInfluenceGraph({
    request: { ...buildGovernanceInfluenceRequest({ graph, dependencyGraph, proposalGraph, governanceNodes: governanceNodes() }), governanceNodeIds: ["governance-a"], influencedNodeIds: ["boundary-node", "recommendation-anchor"] },
    graph, dependencyGraph, proposalGraph, governanceNodes: governanceNodes(),
  });
  const escalationGraph = sealEscalationGraph({
    request: { ...buildEscalationGraphRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationNodes: escalationNodes() }), escalationNodeIds: ["escalation-a"], targetNodeIds: ["boundary-node", "recommendation-anchor"] },
    graph, dependencyGraph, proposalGraph, governanceGraph, escalationNodes: escalationNodes(),
  });
  const topology = sealReplayableGraphTopology({
    request: buildReplayableGraphTopologyRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph }),
    graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph,
  });
  const inspection = sealGraphInspection({
    request: buildGraphInspectionRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology }),
    graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology,
  });
  const verificationGraph = sealGraphIntegrityVerification({
    request: buildGraphIntegrityVerificationRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection }),
    graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection,
  });
  const graphCertification = sealDecisionGraphCertification({
    request: buildDecisionGraphCertificationRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection, verification: verificationGraph }),
    graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection, verification: verificationGraph,
  } satisfies DecisionGraphCertificationInput);
  const escalation = sealEscalationIntelligence({
    request: buildEscalationIntelligenceRequest({
      certification: graphCertification, verification: verificationGraph, inspection, topology, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1",
    } satisfies Omit<EscalationIntelligenceInput, "request"> & { escalationContext?: never; tenantId?: string; graphVersion?: string }),
    certification: graphCertification, verification: verificationGraph, inspection, topology,
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
      graph, intelligence: escalation, verification: verificationGraph, certification: graphCertification, escalationCertification,
      recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1",
    } satisfies Omit<RecommendationLedgerInput, "request"> & { recommendationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    graph, intelligence: escalation, verification: verificationGraph, certification: graphCertification, escalationCertification,
  });
  const lineage = sealLineageReconstruction({
    request: buildLineageReconstructionRequest({
      ledger, graph, verification: verificationGraph, certification: graphCertification,
      escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"],
      recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1",
    } satisfies Omit<LineageReconstructionInput, "request"> & { reconstructionContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger, graph, verification: verificationGraph, certification: graphCertification,
    escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"],
  });
  const historyReferences = [ledger.entry.ledgerEntryId, ...ledger.entry.evidenceIds, ...lineage.ancestryChain.map((node) => node.lineageReference)];
  const verification = sealRecommendationHistoryVerification({
    request: buildRecommendationHistoryVerificationRequest({
      ledger, lineage, escalation, graph, verification: verificationGraph, certification: graphCertification,
      recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences,
    } satisfies Omit<RecommendationHistoryVerificationInput, "request"> & { verificationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger, lineage, escalation, graph, verification: verificationGraph, certification: graphCertification, historyReferences,
  });
  const replayReferences = [ledger.entry.ledgerEntryId, ...ledger.entry.evidenceIds, ...lineage.evidencePath.evidenceIds, ...verification.evidencePath.evidenceIds];
  const replay = sealRecommendationReplay({
    request: buildRecommendationReplayRequest({
      ledger, lineage, verification, escalation, graph, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", replayReferences,
    } satisfies Omit<RecommendationReplayInput, "request"> & { replayContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger, lineage, verification, escalation, graph, replayReferences,
  });
  const integrity = sealRecommendationIntegrity({
    request: buildRecommendationIntegrityRequest({
      ledger, lineage, verification, replay, escalation, graph, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences,
    } satisfies Omit<RecommendationIntegrityInput, "request"> & { integrityContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger, lineage, verification, replay, escalation, graph, historyReferences,
  });
  const certification = sealRecommendationCertification({
    request: buildRecommendationCertificationRequest({
      ledger, lineage, verification, replay, integrity, escalation, graph, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences,
    } satisfies Omit<RecommendationCertificationInput, "request"> & { certificationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger, lineage, verification, replay, integrity, escalation, graph, historyReferences,
  });
  const observability = sealRecommendationObservability({
    request: buildRecommendationObservabilityRequest({
      ledger, lineage, verification, replay, integrity, certification, escalation, graph, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1",
    } satisfies Omit<RecommendationObservabilityInput, "request"> & { observabilityContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger, lineage, verification, replay, integrity, certification, escalation, graph,
  });

  return { observability, ledger, lineage, verification, replay, integrity, certification };
}

function inspectionInput(overrides: Partial<RecommendationInspectionInput> = {}): RecommendationInspectionInput {
  const base = buildInspectionInputs();
  const request = buildRecommendationInspectionRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
    apiVersion: "recommendation-inspection/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies RecommendationInspectionInput);
}

describe("recommendationInspectionApi", () => {
  it("is deterministic and reproduces inspection hashes", () => {
    const input = inspectionInput();
    const first = sealRecommendationInspection(input);
    const second = sealRecommendationInspection(input);
    expect(first).toEqual(second);
    expect(first.result.inspectionState).toBe("AVAILABLE");
    expect(first.result.inspectionHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across scopes", () => {
    const base = inspectionInput();
    const scopes = ["SUMMARY", "LINEAGE", "REPLAY", "INTEGRITY", "CERTIFICATION", "FULL"] as const;
    for (const scope of scopes) {
      const scoped = inspectionInput({ request: { ...base.request, inspectionScope: scope } });
      expect(createRecommendationInspectionEvidencePath(scoped)).toEqual(createRecommendationInspectionEvidencePath(scoped));
      expect(sealRecommendationInspection(scoped).result.inspectionHash).toBe(sealRecommendationInspection(scoped).result.inspectionHash);
    }
  });

  it("blocks cross-tenant access and ownership mismatch", () => {
    const base = inspectionInput();
    const crossTenant = sealRecommendationInspection({
      ...base,
      observability: { ...base.observability, result: { ...base.observability.result, tenantIsolationVerified: false } },
    });
    const ownershipMismatch = sealRecommendationInspection({
      ...base,
      certification: { ...base.certification, result: { ...base.certification.result, ownershipCertified: false } },
    });
    expect(crossTenant.result.inspectionState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ACCESS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("enforces scope and escalates invalid visibility scope", () => {
    const base = inspectionInput();
    const escalated = sealRecommendationInspection({
      ...base,
      request: { ...base.request, inspectionScope: "REPLAY", lineageReferences: [] },
    });
    expect(escalated.result.inspectionState).toBe("ESCALATED");
    expect(escalated.validation.reasonCodes).toContain("SCOPE_VIOLATION_ESCALATED");
  });

  it("surfaces replay absence as LIMITED", () => {
    const base = inspectionInput();
    const limited = sealRecommendationInspection({
      ...base,
      observability: { ...base.observability, result: { ...base.observability.result, replayVisible: false, observabilityState: "LIMITED" } },
    });
    expect(limited.result.inspectionState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_VISIBILITY_LIMITED");
  });

  it("enforces api versioning", () => {
    const base = inspectionInput();
    const invalidVersion = sealRecommendationInspection({
      ...base,
      request: { ...base.request, apiVersion: "recommendation-inspection/v2" },
    });
    expect(invalidVersion.result.inspectionState).toBe("INVALID");
    expect(invalidVersion.validation.reasonCodes).toContain("API_VERSION_INVALID");
  });

  it("keeps execution impossible and write behavior absent", () => {
    const base = inspectionInput();
    const execution = sealRecommendationInspection({ ...base, executionRequested: true });
    const write = sealRecommendationInspection({ ...base, writeRequested: true });
    const mutation = sealRecommendationInspection({ ...base, inspectionMutationAttempted: true });
    const healthy = sealRecommendationInspection(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(write.validation.reasonCodes).toContain("WRITE_BEHAVIOR_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("INSPECTION_MUTATION_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.writeAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = inspectionInput();
    const before = JSON.stringify(input);
    sealRecommendationInspection(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
