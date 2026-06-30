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
  buildOversightRequirementRequest,
  createOversightRequirementEvidencePath,
  sealEscalationIntelligence,
  sealOversightRequirement,
  type OversightRequirementInput,
} from "@/services/escalation-intelligence";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-56b", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-56b", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-56b", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-56b", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-56b",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-03T15:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

const proposalNodes = (): readonly ProposalNodeInput[] => [
  { proposalId: "proposal-a", graphId: "graph-56b", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-56b", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-56b", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildSealedIntelligence() {
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
    request: buildEscalationIntelligenceRequest({ certification, verification, inspection, topology, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" }),
    certification,
    verification,
    inspection,
    topology,
  });
  return { intelligence, certification, verification };
}

function oversightInput(overrides: Partial<OversightRequirementInput> = {}): OversightRequirementInput {
  const base = buildSealedIntelligence();
  const request = buildOversightRequirementRequest({ ...base, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies OversightRequirementInput);
}

describe("oversightRequirementAnalysis", () => {
  it("is deterministic and reproduces evidence hashes", () => {
    const input = oversightInput();
    const first = sealOversightRequirement(input);
    const second = sealOversightRequirement(input);
    expect(first).toEqual(second);
    expect(first.result.oversightRequirement).toBe("NONE");
    expect(first.result.oversightEvidenceHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = oversightInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "TOPOLOGY", "AUTHORITY", "FULL"] as const;
    for (const context of contexts) {
      const scoped = oversightInput({ request: { ...base.request, oversightContext: context } });
      expect(createOversightRequirementEvidencePath(scoped)).toEqual(createOversightRequirementEvidencePath(scoped));
      expect(sealOversightRequirement(scoped).result.oversightEvidenceHash).toBe(sealOversightRequirement(scoped).result.oversightEvidenceHash);
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = oversightInput();
    const crossTenant = sealOversightRequirement({
      ...base,
      intelligence: {
        ...base.intelligence,
        result: { ...base.intelligence.result, tenantIsolationVerified: false },
      },
    });
    const ownershipMismatch = sealOversightRequirement({
      ...base,
      certification: {
        ...base.certification,
        result: { ...base.certification.result, ownershipCertified: false },
      },
    });
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces lineage, topology, governance, and containment review states", () => {
    const base = oversightInput();
    const lineage = sealOversightRequirement({ ...base, request: { ...base.request, lineageReferences: [] } });
    const topology = sealOversightRequirement({
      ...base,
      intelligence: { ...base.intelligence, result: { ...base.intelligence.result, topologyConcern: true, escalationClassification: "REVIEW_REQUIRED" } },
    });
    const governance = sealOversightRequirement({
      ...base,
      intelligence: { ...base.intelligence, result: { ...base.intelligence.result, authorityConcern: true, escalationClassification: "HIGH_ATTENTION" } },
    });
    const containment = sealOversightRequirement({ ...base, authorityExpansionRequested: true });
    expect(lineage.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(topology.result.oversightRequirement).toBe("REVIEW");
    expect(governance.result.oversightRequirement).toBe("CONTAINMENT_REVIEW");
    expect(containment.result.oversightRequirement).toBe("CONTAINMENT_REVIEW");
  });

  it("invalidates broken evidence, hash mismatches, and mutation signals", () => {
    const base = oversightInput();
    const broken = sealOversightRequirement({
      ...base,
      intelligence: { ...base.intelligence, evidencePath: { ...base.intelligence.evidencePath, evidenceIds: [] } },
    });
    const mismatch = sealOversightRequirement({
      ...base,
      intelligence: { ...base.intelligence, result: { ...base.intelligence.result, escalationEvidenceHash: "short" } },
    });
    const mutation = sealOversightRequirement({ ...base, mutationSignalsDetected: true });
    expect(broken.validation.reasonCodes).toContain("ESCALATION_EVIDENCE_BROKEN");
    expect(mismatch.validation.reasonCodes).toContain("EVIDENCE_HASH_MISMATCH");
    expect(mutation.validation.reasonCodes).toContain("MUTATION_SIGNALS_DETECTED");
  });

  it("keeps execution impossible and oversight actions absent", () => {
    const base = oversightInput();
    const execution = sealOversightRequirement({ ...base, executionRequested: true });
    const workflow = sealOversightRequirement({ ...base, workflowRoutingRequested: true });
    const approval = sealOversightRequirement({ ...base, approvalCreationRequested: true });
    const notification = sealOversightRequirement({ ...base, notificationDispatchRequested: true });
    const containment = sealOversightRequirement({ ...base, containmentActionRequested: true });
    const healthy = sealOversightRequirement(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(approval.validation.reasonCodes).toContain("APPROVAL_CREATION_DETECTED");
    expect(notification.validation.reasonCodes).toContain("NOTIFICATION_DISPATCH_DETECTED");
    expect(containment.validation.reasonCodes).toContain("CONTAINMENT_ACTION_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.approvalCreationAllowed).toBe(false);
    expect(healthy.notificationDispatchAllowed).toBe(false);
    expect(healthy.containmentActionAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = oversightInput();
    const before = JSON.stringify(input);
    sealOversightRequirement(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
