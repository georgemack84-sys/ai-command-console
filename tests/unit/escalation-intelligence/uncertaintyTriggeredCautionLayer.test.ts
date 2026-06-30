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
  buildUncertaintyTriggeredCautionRequest,
  createUncertaintyTriggeredCautionEvidencePath,
  sealEscalationIntelligence,
  sealOversightRequirement,
  sealUncertaintyTriggeredCaution,
  type EscalationIntelligenceInput,
  type OversightRequirementInput,
  type UncertaintyTriggeredCautionInput,
} from "@/services/escalation-intelligence";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-56c", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-56c", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-56c", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-56c", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];

  return Object.freeze({
    graphId: "graph-56c",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-04T09:00:00.000Z",
    nodes,
    edges: [],
    lineageReferences: nodes.map((node) => node.lineageReference),
    ...overrides,
  } satisfies DecisionGraphContractInput);
}

const proposalNodes = (): readonly ProposalNodeInput[] => [
  { proposalId: "proposal-a", graphId: "graph-56c", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-56c", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-56c", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildSealedOversight() {
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
    } satisfies Omit<EscalationIntelligenceInput, "request"> & {
      escalationContext?: any;
      tenantId?: string;
      graphVersion?: string;
    }),
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
    } satisfies Omit<OversightRequirementInput, "request"> & {
      oversightContext?: any;
      tenantId?: string;
      graphVersion?: string;
    }),
    intelligence,
    certification,
    verification,
  });

  return { intelligence, oversight, verification, certification };
}

function cautionInput(overrides: Partial<UncertaintyTriggeredCautionInput> = {}): UncertaintyTriggeredCautionInput {
  const base = buildSealedOversight();
  const request = buildUncertaintyTriggeredCautionRequest({
    ...base,
    tenantId: "tenant-alpha",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies UncertaintyTriggeredCautionInput);
}

describe("uncertaintyTriggeredCautionLayer", () => {
  it("is deterministic and reproduces caution hashes", () => {
    const input = cautionInput();
    const first = sealUncertaintyTriggeredCaution(input);
    const second = sealUncertaintyTriggeredCaution(input);

    expect(first).toEqual(second);
    expect(first.result.cautionState).toBe("NORMAL");
    expect(first.result.cautionEvidenceHash).toHaveLength(64);
    expect(first.result.deterministic).toBe(true);
  });

  it("keeps evidence ordering reproducible across contexts", () => {
    const base = cautionInput();
    const contexts = ["OWNERSHIP", "LINEAGE", "TOPOLOGY", "AUTHORITY", "FULL"] as const;

    for (const context of contexts) {
      const scoped = cautionInput({
        request: { ...base.request, uncertaintyContext: context },
      });
      expect(createUncertaintyTriggeredCautionEvidencePath(scoped)).toEqual(createUncertaintyTriggeredCautionEvidencePath(scoped));
      expect(sealUncertaintyTriggeredCaution(scoped).result.cautionEvidenceHash).toBe(
        sealUncertaintyTriggeredCaution(scoped).result.cautionEvidenceHash,
      );
    }
  });

  it("blocks cross-tenant evidence and ownership mismatch", () => {
    const base = cautionInput();
    const crossTenant = sealUncertaintyTriggeredCaution({
      ...base,
      intelligence: {
        ...base.intelligence,
        result: { ...base.intelligence.result, tenantIsolationVerified: false },
      },
    });
    const ownershipMismatch = sealUncertaintyTriggeredCaution({
      ...base,
      certification: {
        ...base.certification,
        result: { ...base.certification.result, ownershipCertified: false },
      },
    });

    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ARTIFACTS_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces uncertainty, ambiguity, evidence degradation, and authority concern", () => {
    const base = cautionInput();
    const uncertainty = sealUncertaintyTriggeredCaution({
      ...base,
      intelligence: {
        ...base.intelligence,
        result: { ...base.intelligence.result, escalationClassification: "REVIEW_REQUIRED", topologyConcern: true },
      },
    });
    const ambiguity = sealUncertaintyTriggeredCaution({
      ...base,
      request: { ...base.request, lineageReferences: [] },
    });
    const authority = sealUncertaintyTriggeredCaution({
      ...base,
      authorityExpansionRequested: true,
    });

    expect(uncertainty.result.cautionState).toBe("LIMITED");
    expect(uncertainty.result.uncertaintyDetected).toBe(true);
    expect(uncertainty.result.evidenceQualityConcern).toBe(true);
    expect(ambiguity.validation.reasonCodes).toContain("LINEAGE_REFERENCES_MISSING");
    expect(ambiguity.result.ambiguityDetected).toBe(true);
    expect(authority.result.cautionState).toBe("HIGH_CAUTION");
    expect(authority.result.authorityConcern).toBe(true);
  });

  it("invalidates broken evidence, hash mismatches, and mutation signals", () => {
    const base = cautionInput();
    const broken = sealUncertaintyTriggeredCaution({
      ...base,
      oversight: {
        ...base.oversight,
        evidencePath: { ...base.oversight.evidencePath, evidenceIds: [] },
      },
    });
    const mismatch = sealUncertaintyTriggeredCaution({
      ...base,
      intelligence: {
        ...base.intelligence,
        result: { ...base.intelligence.result, escalationEvidenceHash: "short" },
      },
    });
    const mutation = sealUncertaintyTriggeredCaution({
      ...base,
      mutationSignalsDetected: true,
    });

    expect(broken.validation.reasonCodes).toContain("EVIDENCE_CHAIN_BROKEN");
    expect(mismatch.validation.reasonCodes).toContain("EVIDENCE_HASH_MISMATCH");
    expect(mutation.validation.reasonCodes).toContain("MUTATION_SIGNALS_DETECTED");
  });

  it("keeps execution impossible and authority unchanged", () => {
    const base = cautionInput();
    const execution = sealUncertaintyTriggeredCaution({ ...base, executionRequested: true });
    const workflow = sealUncertaintyTriggeredCaution({ ...base, workflowRoutingRequested: true });
    const approval = sealUncertaintyTriggeredCaution({ ...base, approvalCreationRequested: true });
    const notification = sealUncertaintyTriggeredCaution({ ...base, notificationDispatchRequested: true });
    const containment = sealUncertaintyTriggeredCaution({ ...base, containmentActionRequested: true });
    const healthy = sealUncertaintyTriggeredCaution(base);

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
    const input = cautionInput();
    const before = JSON.stringify(input);

    sealUncertaintyTriggeredCaution(input);

    expect(JSON.stringify(input)).toBe(before);
  });
});
