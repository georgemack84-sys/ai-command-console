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
  buildGovernanceEscalationRequest,
  buildOversightRequirementRequest,
  buildUncertaintyTriggeredCautionRequest,
  createGovernanceEscalationEvidencePath,
  sealEscalationIntelligence,
  sealGovernanceEscalation,
  sealOversightRequirement,
  sealUncertaintyTriggeredCaution,
  type EscalationIntelligenceInput,
  type GovernanceEscalationInput,
  type OversightRequirementInput,
  type UncertaintyTriggeredCautionInput,
} from "@/services/escalation-intelligence";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-56d", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-56d", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-56d", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-56d", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-56d",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-04T10:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((n) => n.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

const proposalNodes = (): readonly ProposalNodeInput[] => [
  { proposalId: "proposal-a", graphId: "graph-56d", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-56d", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-56d", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildSealedCaution() {
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
    } satisfies Omit<EscalationIntelligenceInput, "request"> & { escalationContext?: any; tenantId?: string; graphVersion?: string }),
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
    } satisfies Omit<OversightRequirementInput, "request"> & { oversightContext?: any; tenantId?: string; graphVersion?: string }),
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
    } satisfies Omit<UncertaintyTriggeredCautionInput, "request"> & { uncertaintyContext?: any; tenantId?: string; graphVersion?: string }),
    intelligence,
    oversight,
    verification,
    certification,
  });
  return { intelligence, oversight, caution, verification, certification };
}

function governanceInput(overrides: Partial<GovernanceEscalationInput> = {}): GovernanceEscalationInput {
  const base = buildSealedCaution();
  const request = buildGovernanceEscalationRequest({
    ...base,
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies GovernanceEscalationInput);
}

describe("governanceEscalationAnalysis", () => {
  it("is deterministic and reproduces evidence hashes", () => {
    const input = governanceInput();
    const first = sealGovernanceEscalation(input);
    const second = sealGovernanceEscalation(input);
    expect(first).toEqual(second);
    expect(first.result.governanceEscalationState).toBe("NORMAL");
    expect(first.result.governanceEvidenceHash).toHaveLength(64);
    expect(first.result.deterministic).toBe(true);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = governanceInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "TOPOLOGY", "AUTHORITY", "FULL"] as const;
    for (const context of contexts) {
      const scoped = governanceInput({ request: { ...base.request, governanceContext: context } });
      expect(createGovernanceEscalationEvidencePath(scoped)).toEqual(createGovernanceEscalationEvidencePath(scoped));
      expect(sealGovernanceEscalation(scoped).result.governanceEvidenceHash).toBe(
        sealGovernanceEscalation(scoped).result.governanceEvidenceHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = governanceInput();
    const crossTenant = sealGovernanceEscalation({
      ...base,
      caution: { ...base.caution, result: { ...base.caution.result, tenantIsolationVerified: false } },
    });
    const ownershipMismatch = sealGovernanceEscalation({
      ...base,
      certification: { ...base.certification, result: { ...base.certification.result, ownershipCertified: false } },
    });
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces governance concern, policy dependency, and authority boundary concern", () => {
    const base = governanceInput();
    const aware = sealGovernanceEscalation({
      ...base,
      intelligence: { ...base.intelligence, result: { ...base.intelligence.result, escalationClassification: "REVIEW_REQUIRED" } },
    });
    const review = sealGovernanceEscalation({
      ...base,
      oversight: { ...base.oversight, result: { ...base.oversight.result, oversightRequirement: "GOVERNANCE_REVIEW" } },
    });
    const high = sealGovernanceEscalation({
      ...base,
      authorityExpansionRequested: true,
    });
    expect(aware.result.governanceEscalationState).toBe("GOVERNANCE_REVIEW");
    expect(review.result.governanceConcern).toBe(true);
    expect(high.result.governanceEscalationState).toBe("HIGH_GOVERNANCE_ATTENTION");
    expect(high.result.authorityBoundaryConcern).toBe(true);
  });

  it("invalidates broken evidence, policy violations, and mutation signals", () => {
    const base = governanceInput();
    const broken = sealGovernanceEscalation({
      ...base,
      caution: { ...base.caution, evidencePath: { ...base.caution.evidencePath, evidenceIds: [] } },
    });
    const policy = sealGovernanceEscalation({
      ...base,
      caution: { ...base.caution, result: { ...base.caution.result, cautionState: "HIGH_CAUTION", evidenceQualityConcern: true } },
    });
    const mutation = sealGovernanceEscalation({
      ...base,
      mutationSignalsDetected: true,
    });
    expect(broken.validation.reasonCodes).toContain("GOVERNANCE_EVIDENCE_BROKEN");
    expect(policy.validation.reasonCodes).toContain("POLICY_BOUNDARY_VIOLATION");
    expect(mutation.validation.reasonCodes).toContain("MUTATION_SIGNALS_DETECTED");
  });

  it("keeps execution impossible and governance actions absent", () => {
    const base = governanceInput();
    const execution = sealGovernanceEscalation({ ...base, executionRequested: true });
    const workflow = sealGovernanceEscalation({ ...base, workflowRoutingRequested: true });
    const approval = sealGovernanceEscalation({ ...base, approvalCreationRequested: true });
    const notification = sealGovernanceEscalation({ ...base, notificationDispatchRequested: true });
    const reviewAssignment = sealGovernanceEscalation({ ...base, reviewAssignmentRequested: true });
    const governanceMutation = sealGovernanceEscalation({ ...base, governanceMutationRequested: true });
    const healthy = sealGovernanceEscalation(base);
    expect(execution.validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(workflow.validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(approval.validation.reasonCodes).toContain("APPROVAL_CREATION_DETECTED");
    expect(notification.validation.reasonCodes).toContain("NOTIFICATION_DISPATCH_DETECTED");
    expect(reviewAssignment.validation.reasonCodes).toContain("REVIEW_ASSIGNMENT_DETECTED");
    expect(governanceMutation.validation.reasonCodes).toContain("GOVERNANCE_MUTATION_DETECTED");
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.approvalCreationAllowed).toBe(false);
    expect(healthy.notificationDispatchAllowed).toBe(false);
    expect(healthy.reviewAssignmentAllowed).toBe(false);
    expect(healthy.governanceMutationAllowed).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = governanceInput();
    const before = JSON.stringify(input);
    sealGovernanceEscalation(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
