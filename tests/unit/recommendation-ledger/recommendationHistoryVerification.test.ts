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
  buildRecommendationHistoryVerificationRequest,
  buildRecommendationLedgerRequest,
  createRecommendationHistoryVerificationEvidencePath,
  sealLineageReconstruction,
  sealRecommendationHistoryVerification,
  sealRecommendationLedger,
  type LineageReconstructionInput,
  type RecommendationHistoryVerificationInput,
  type RecommendationLedgerInput,
} from "@/services/recommendation-ledger";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-57c", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-57c", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-57c", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-57c", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-57c",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-04T16:00:00.000Z",
    nodes,
    edges: [
      {
        edgeId: "edge-escalation-governance",
        graphId: "graph-57c",
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
  { proposalId: "proposal-a", graphId: "graph-57c", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-57c", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-57c", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildVerificationInputs() {
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
  const lineage = sealLineageReconstruction({
    request: buildLineageReconstructionRequest({
      ledger,
      graph,
      verification,
      certification,
      escalationCertification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      graphVersion: "decision-graph/v1",
    } satisfies Omit<LineageReconstructionInput, "request"> & { reconstructionContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }),
    ledger,
    graph,
    verification,
    certification,
    escalationCertification,
  });
  return { ledger, lineage, escalation: intelligence, graph, verification, certification };
}

function verificationInput(overrides: Partial<RecommendationHistoryVerificationInput> = {}): RecommendationHistoryVerificationInput {
  const base = buildVerificationInputs();
  const historyReferences = [
    base.ledger.entry.ledgerEntryId,
    ...base.ledger.entry.evidenceIds,
    ...base.lineage.ancestryChain.map((node) => node.lineageReference),
  ];
  const request = buildRecommendationHistoryVerificationRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    historyReferences,
    ...overrides,
  } satisfies RecommendationHistoryVerificationInput);
}

describe("recommendationHistoryVerification", () => {
  it("is deterministic and reproduces verification hashes", () => {
    const input = verificationInput();
    const first = sealRecommendationHistoryVerification(input);
    const second = sealRecommendationHistoryVerification(input);
    expect(first).toEqual(second);
    expect(first.result.verificationState).toBe("VERIFIED");
    expect(first.result.verificationHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = verificationInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "REPLAY", "LEDGER", "FULL"] as const;
    for (const context of contexts) {
      const scoped = verificationInput({ request: { ...base.request, verificationContext: context } });
      expect(createRecommendationHistoryVerificationEvidencePath(scoped)).toEqual(
        createRecommendationHistoryVerificationEvidencePath(scoped),
      );
      expect(sealRecommendationHistoryVerification(scoped).result.verificationHash).toBe(
        sealRecommendationHistoryVerification(scoped).result.verificationHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = verificationInput();
    const crossTenant = sealRecommendationHistoryVerification({
      ...base,
      escalation: {
        ...base.escalation,
        result: { ...base.escalation.result, tenantIsolationVerified: false },
      },
    });
    const ownershipMismatch = sealRecommendationHistoryVerification({
      ...base,
      request: { ...base.request, tenantId: "tenant-beta" },
    });
    expect(crossTenant.result.verificationState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces missing history references, ledger corruption, and lineage corruption", () => {
    const base = verificationInput();
    const missingHistory = sealRecommendationHistoryVerification({ ...base, historyReferences: [] });
    const ledgerCorruption = sealRecommendationHistoryVerification({
      ...base,
      ledger: { ...base.ledger, entry: { ...base.ledger.entry, evidenceIds: [] } },
    });
    const lineageCorruption = sealRecommendationHistoryVerification({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    expect(missingHistory.validation.reasonCodes).toContain("HISTORY_REFERENCES_MISSING");
    expect(ledgerCorruption.validation.reasonCodes).toContain("LEDGER_CORRUPTION_DETECTED");
    expect(lineageCorruption.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
  });

  it("downgrades replay mismatch to LIMITED", () => {
    const base = verificationInput();
    const limited = sealRecommendationHistoryVerification({
      ...base,
      ledger: { ...base.ledger, result: { ...base.ledger.result, replayable: false, ledgerState: "LIMITED" } },
    });
    expect(limited.result.verificationState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_MISMATCH_DETECTED");
  });

  it("invalidates evidence hash mismatch, authority expansion, and mutation attempts", () => {
    const base = verificationInput();
    const evidence = sealRecommendationHistoryVerification({
      ...base,
      ledger: {
        ...base.ledger,
        result: { ...base.ledger.result, evidenceHash: "short-hash" },
      },
    });
    const authority = sealRecommendationHistoryVerification({
      ...base,
      authorityExpansionDetected: true,
    });
    const mutation = sealRecommendationHistoryVerification({
      ...base,
      verificationMutationAttempted: true,
    });
    expect(evidence.result.verificationState).toBe("INVALID");
    expect(evidence.validation.reasonCodes).toContain("EVIDENCE_HASH_MISMATCH");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("VERIFICATION_MUTATION_DETECTED");
  });

  it("keeps execution impossible and recommendation generation absent", () => {
    const base = verificationInput();
    const execution = sealRecommendationHistoryVerification({ ...base, executionRequested: true });
    const workflow = sealRecommendationHistoryVerification({ ...base, workflowRoutingRequested: true });
    const generation = sealRecommendationHistoryVerification({ ...base, recommendationGenerationRequested: true });
    const repair = sealRecommendationHistoryVerification({ ...base, repairRequested: true });
    const healthy = sealRecommendationHistoryVerification(base);
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
    const input = verificationInput();
    const before = JSON.stringify(input);
    sealRecommendationHistoryVerification(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
