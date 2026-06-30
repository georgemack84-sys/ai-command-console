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
  buildEscalationReplayRequest,
  buildGovernanceEscalationRequest,
  buildOversightRequirementRequest,
  buildUncertaintyTriggeredCautionRequest,
  createEscalationReplayEvidencePath,
  sealEscalationIntelligence,
  sealEscalationReplay,
  sealGovernanceEscalation,
  sealOversightRequirement,
  sealUncertaintyTriggeredCaution,
  type EscalationIntelligenceInput,
  type EscalationReplayInput,
  type GovernanceEscalationInput,
  type OversightRequirementInput,
  type UncertaintyTriggeredCautionInput,
} from "@/services/escalation-intelligence";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-56e", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-56e", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-56e", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-56e", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-56e",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-04T11:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

const proposalNodes = (): readonly ProposalNodeInput[] => [
  { proposalId: "proposal-a", graphId: "graph-56e", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];

const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-56e", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];

const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-56e", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildSealedGovernance() {
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
  return { intelligence, oversight, caution, governance, verification, certification };
}

function replayInput(overrides: Partial<EscalationReplayInput> = {}): EscalationReplayInput {
  const base = buildSealedGovernance();
  const request = buildEscalationReplayRequest({
    ...base,
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies EscalationReplayInput);
}

describe("escalationReplayFramework", () => {
  it("is deterministic and reproduces replay hashes", () => {
    const input = replayInput();
    const first = sealEscalationReplay(input);
    const second = sealEscalationReplay(input);
    expect(first).toEqual(second);
    expect(first.result.replayState).toBe("REPLAYABLE");
    expect(first.result.replayHash).toHaveLength(64);
    expect(first.result.reconstructionHash).toHaveLength(64);
  });

  it("keeps replay ordering reproducible across contexts", () => {
    const base = replayInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "TOPOLOGY", "AUTHORITY", "FULL"] as const;
    for (const context of contexts) {
      const scoped = replayInput({ request: { ...base.request, replayContext: context } });
      expect(createEscalationReplayEvidencePath(scoped)).toEqual(createEscalationReplayEvidencePath(scoped));
      expect(sealEscalationReplay(scoped).result.reconstructionHash).toBe(
        sealEscalationReplay(scoped).result.reconstructionHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = replayInput();
    const crossTenant = sealEscalationReplay({
      ...base,
      governance: { ...base.governance, result: { ...base.governance.result, tenantIsolationVerified: false } },
    });
    const ownershipMismatch = sealEscalationReplay({
      ...base,
      certification: { ...base.certification, result: { ...base.certification.result, ownershipCertified: false } },
    });
    expect(crossTenant.result.replayState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces bounded degradation, replay drift, and reconstruction mismatch", () => {
    const base = replayInput();
    const limited = sealEscalationReplay({
      ...base,
      caution: { ...base.caution, result: { ...base.caution.result, cautionState: "CAUTION", uncertaintyDetected: true } },
    });
    const drift = sealEscalationReplay({
      ...base,
      verification: { ...base.verification, result: { ...base.verification.result, deterministicReplayVerified: false } },
    });
    const mismatch = sealEscalationReplay({
      ...base,
      certification: { ...base.certification, result: { ...base.certification.result, certificationStatus: "CONDITIONAL_PASS" } },
    });
    expect(limited.result.replayState).toBe("LIMITED");
    expect(drift.result.replayState).toBe("ESCALATED");
    expect(drift.validation.reasonCodes).toContain("REPLAY_DRIFT_DETECTED");
    expect(mismatch.result.replayState).toBe("ESCALATED");
    expect(mismatch.validation.reasonCodes).toContain("RECONSTRUCTION_MISMATCH");
  });

  it("invalidates lineage corruption and broken evidence chains", () => {
    const base = replayInput();
    const lineage = sealEscalationReplay({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    const broken = sealEscalationReplay({
      ...base,
      governance: { ...base.governance, evidencePath: { ...base.governance.evidencePath, evidenceIds: [] } },
    });
    expect(lineage.result.replayState).toBe("INVALID");
    expect(lineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(broken.validation.reasonCodes).toContain("EVIDENCE_CHAIN_BROKEN");
  });

  it("keeps execution impossible and escalation actions absent", () => {
    const base = replayInput();
    const execution = sealEscalationReplay({ ...base, executionRequested: true });
    const workflow = sealEscalationReplay({ ...base, workflowRoutingRequested: true });
    const approval = sealEscalationReplay({ ...base, approvalCreationRequested: true });
    const notification = sealEscalationReplay({ ...base, notificationDispatchRequested: true });
    const mutation = sealEscalationReplay({ ...base, governanceMutationRequested: true });
    const repair = sealEscalationReplay({ ...base, repairRequested: true });
    const healthy = sealEscalationReplay(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(approval.validation.reasonCodes).toContain("APPROVAL_CREATION_DETECTED");
    expect(notification.validation.reasonCodes).toContain("NOTIFICATION_DISPATCH_DETECTED");
    expect(mutation.validation.reasonCodes).toContain("GOVERNANCE_MUTATION_DETECTED");
    expect(repair.validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.approvalCreationAllowed).toBe(false);
    expect(healthy.notificationDispatchAllowed).toBe(false);
    expect(healthy.governanceMutationAllowed).toBe(false);
    expect(healthy.repairAuthorized).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = replayInput();
    const before = JSON.stringify(input);
    sealEscalationReplay(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
