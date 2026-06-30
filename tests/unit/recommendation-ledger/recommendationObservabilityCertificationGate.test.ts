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
  buildOperatorVisibilityRequest,
  buildRecommendationAuditExportRequest,
  buildRecommendationCertificationRequest,
  buildRecommendationHistoryVerificationRequest,
  buildRecommendationInspectionRequest,
  buildRecommendationIntegrityRequest,
  buildRecommendationLedgerRequest,
  buildRecommendationObservabilityCertificationRequest,
  buildRecommendationObservabilityRequest,
  buildRecommendationReplayRequest,
  createRecommendationObservabilityCertificationEvidencePath,
  sealLineageReconstruction,
  sealOperatorVisibility,
  sealRecommendationAuditExport,
  sealRecommendationCertification,
  sealRecommendationHistoryVerification,
  sealRecommendationInspection,
  sealRecommendationIntegrity,
  sealRecommendationLedger,
  sealRecommendationObservability,
  sealRecommendationObservabilityCertification,
  sealRecommendationReplay,
  type LineageReconstructionInput,
  type OperatorVisibilityInput,
  type RecommendationAuditExportInput,
  type RecommendationCertificationInput,
  type RecommendationHistoryVerificationInput,
  type RecommendationInspectionInput,
  type RecommendationIntegrityInput,
  type RecommendationLedgerInput,
  type RecommendationObservabilityCertificationInput,
  type RecommendationObservabilityInput,
  type RecommendationReplayInput,
} from "@/services/recommendation-ledger";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-58e", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-58e", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-58e", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-58e", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-58e",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-06T05:00:00.000Z",
    nodes,
    edges: [{
      edgeId: "edge-escalation-governance",
      graphId: "graph-58e",
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
  { proposalId: "proposal-a", graphId: "graph-58e", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-58e", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-58e", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildCertificationInputs() {
  const graph = sealDecisionGraphContract(graphInput());
  const dependencyGraph = sealRecommendationDependencyGraph({ request: { ...buildRecommendationDependencyRequest({ graph }), recommendationNodeIds: ["recommendation-anchor"], dependencyNodeIds: ["boundary-node", "governance-anchor"] }, graph });
  const proposalGraph = sealProposalRelationshipGraph({ request: { ...buildProposalRelationshipRequest({ graph, dependencyGraph, proposalNodes: proposalNodes() }), proposalNodeIds: ["proposal-a"], relationshipNodeIds: ["boundary-node", "governance-anchor"] }, graph, dependencyGraph, proposalNodes: proposalNodes() });
  const governanceGraph = sealGovernanceInfluenceGraph({ request: { ...buildGovernanceInfluenceRequest({ graph, dependencyGraph, proposalGraph, governanceNodes: governanceNodes() }), governanceNodeIds: ["governance-a"], influencedNodeIds: ["boundary-node", "recommendation-anchor"] }, graph, dependencyGraph, proposalGraph, governanceNodes: governanceNodes() });
  const escalationGraph = sealEscalationGraph({ request: { ...buildEscalationGraphRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationNodes: escalationNodes() }), escalationNodeIds: ["escalation-a"], targetNodeIds: ["boundary-node", "recommendation-anchor"] }, graph, dependencyGraph, proposalGraph, governanceGraph, escalationNodes: escalationNodes() });
  const topology = sealReplayableGraphTopology({ request: buildReplayableGraphTopologyRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph }), graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph });
  const inspectionGraph = sealGraphInspection({ request: buildGraphInspectionRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology }), graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology });
  const verificationGraph = sealGraphIntegrityVerification({ request: buildGraphIntegrityVerificationRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection: inspectionGraph }), graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection: inspectionGraph });
  const graphCertification = sealDecisionGraphCertification({ request: buildDecisionGraphCertificationRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection: inspectionGraph, verification: verificationGraph }), graph, dependencyGraph, proposalGraph, governanceGraph, escalationGraph, topology, inspection: inspectionGraph, verification: verificationGraph } satisfies DecisionGraphCertificationInput);
  const escalation = sealEscalationIntelligence({
    request: buildEscalationIntelligenceRequest({ certification: graphCertification, verification: verificationGraph, inspection: inspectionGraph, topology, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" } satisfies Omit<EscalationIntelligenceInput, "request"> & { escalationContext?: never; tenantId?: string; graphVersion?: string }),
    certification: graphCertification, verification: verificationGraph, inspection: inspectionGraph, topology,
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
  const ledger = sealRecommendationLedger({ request: buildRecommendationLedgerRequest({ graph, intelligence: escalation, verification: verificationGraph, certification: graphCertification, escalationCertification, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" } satisfies Omit<RecommendationLedgerInput, "request"> & { recommendationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), graph, intelligence: escalation, verification: verificationGraph, certification: graphCertification, escalationCertification });
  const lineage = sealLineageReconstruction({ request: buildLineageReconstructionRequest({ ledger, graph, verification: verificationGraph, certification: graphCertification, escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"], recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" } satisfies Omit<LineageReconstructionInput, "request"> & { reconstructionContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, graph, verification: verificationGraph, certification: graphCertification, escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"] });
  const historyReferences = [ledger.entry.ledgerEntryId, ...ledger.entry.evidenceIds, ...lineage.ancestryChain.map((node) => node.lineageReference)];
  const verification = sealRecommendationHistoryVerification({ request: buildRecommendationHistoryVerificationRequest({ ledger, lineage, escalation, graph, verification: verificationGraph, certification: graphCertification, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences } satisfies Omit<RecommendationHistoryVerificationInput, "request"> & { verificationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, escalation, graph, verification: verificationGraph, certification: graphCertification, historyReferences });
  const replayReferences = [ledger.entry.ledgerEntryId, ...ledger.entry.evidenceIds, ...lineage.evidencePath.evidenceIds, ...verification.evidencePath.evidenceIds];
  const replay = sealRecommendationReplay({ request: buildRecommendationReplayRequest({ ledger, lineage, verification, escalation, graph, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", replayReferences } satisfies Omit<RecommendationReplayInput, "request"> & { replayContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, verification, escalation, graph, replayReferences });
  const integrity = sealRecommendationIntegrity({ request: buildRecommendationIntegrityRequest({ ledger, lineage, verification, replay, escalation, graph, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences } satisfies Omit<RecommendationIntegrityInput, "request"> & { integrityContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, verification, replay, escalation, graph, historyReferences });
  const certification = sealRecommendationCertification({ request: buildRecommendationCertificationRequest({ ledger, lineage, verification, replay, integrity, escalation, graph, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences } satisfies Omit<RecommendationCertificationInput, "request"> & { certificationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, verification, replay, integrity, escalation, graph, historyReferences });
  const observability = sealRecommendationObservability({ request: buildRecommendationObservabilityRequest({ ledger, lineage, verification, replay, integrity, certification, escalation, graph, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" } satisfies Omit<RecommendationObservabilityInput, "request"> & { observabilityContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, verification, replay, integrity, certification, escalation, graph });
  const inspection = sealRecommendationInspection({ request: buildRecommendationInspectionRequest({ observability, ledger, lineage, verification, replay, integrity, certification, recommendationId: "recommendation-anchor", tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", apiVersion: "recommendation-inspection/v1" } satisfies Omit<RecommendationInspectionInput, "request"> & { inspectionScope?: never; recommendationId?: string; tenantId?: string; graphVersion?: string; apiVersion?: string }), observability, ledger, lineage, verification, replay, integrity, certification });
  const visibility = sealOperatorVisibility({
    request: buildOperatorVisibilityRequest({
      observability,
      inspection,
      ledger,
      lineage,
      verification,
      replay,
      integrity,
      certification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      operatorRole: "AUDITOR",
      visibilityScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    observability,
    inspection,
    ledger,
    lineage,
    verification,
    replay,
    integrity,
    certification,
  } satisfies OperatorVisibilityInput);
  const audit = sealRecommendationAuditExport({
    request: buildRecommendationAuditExportRequest({
      observability,
      inspection,
      visibility,
      ledger,
      lineage,
      verification,
      replay,
      integrity,
      certification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      exportScope: "FULL",
      exportFormat: "JSON",
      graphVersion: "decision-graph/v1",
    }),
    observability,
    inspection,
    visibility,
    ledger,
    lineage,
    verification,
    replay,
    integrity,
    certification,
  } satisfies RecommendationAuditExportInput);

  return { observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification };
}

function certificationInput(overrides: Partial<RecommendationObservabilityCertificationInput> = {}): RecommendationObservabilityCertificationInput {
  const base = buildCertificationInputs();
  const request = buildRecommendationObservabilityCertificationRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    certificationScope: "FULL",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies RecommendationObservabilityCertificationInput);
}

describe("recommendationObservabilityCertificationGate", () => {
  it("is deterministic and reproduces certification hashes", () => {
    const input = certificationInput();
    const first = sealRecommendationObservabilityCertification(input);
    const second = sealRecommendationObservabilityCertification(input);
    expect(first).toEqual(second);
    expect(first.result.certificationState).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across scopes", () => {
    const base = certificationInput();
    const scopes = ["VISIBILITY", "INSPECTION", "AUDIT", "REPLAY", "FULL"] as const;
    for (const certificationScope of scopes) {
      const scoped = certificationInput({ request: { ...base.request, certificationScope } });
      expect(createRecommendationObservabilityCertificationEvidencePath(scoped)).toEqual(
        createRecommendationObservabilityCertificationEvidencePath(scoped),
      );
      expect(sealRecommendationObservabilityCertification(scoped).result.certificationHash).toBe(
        sealRecommendationObservabilityCertification(scoped).result.certificationHash,
      );
    }
  });

  it("fails on cross-tenant access and ownership mismatch", () => {
    const base = certificationInput();
    const crossTenant = sealRecommendationObservabilityCertification({
      ...base,
      audit: { ...base.audit, result: { ...base.audit.result, tenantIsolationVerified: false } },
    });
    const ownershipMismatch = sealRecommendationObservabilityCertification({
      ...base,
      certification: { ...base.certification, result: { ...base.certification.result, ownershipCertified: false } },
    });
    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_CERTIFICATION_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("fails on visibility, inspection, operator boundary, and audit integrity breaks", () => {
    const base = certificationInput();
    expect(
      sealRecommendationObservabilityCertification({
        ...base,
        observability: { ...base.observability, result: { ...base.observability.result, observabilityState: "INVALID" } },
      }).validation.reasonCodes,
    ).toContain("VISIBILITY_INTEGRITY_BROKEN");
    expect(
      sealRecommendationObservabilityCertification({
        ...base,
        inspection: { ...base.inspection, result: { ...base.inspection.result, inspectionState: "INVALID" } },
      }).validation.reasonCodes,
    ).toContain("INSPECTION_INTEGRITY_BROKEN");
    expect(
      sealRecommendationObservabilityCertification({
        ...base,
        visibility: { ...base.visibility, validation: { ...base.visibility.validation, authorityBounded: false } },
      }).validation.reasonCodes,
    ).toContain("OPERATOR_VISIBILITY_BOUNDARY_BROKEN");
    expect(
      sealRecommendationObservabilityCertification({
        ...base,
        audit: { ...base.audit, result: { ...base.audit.result, exportState: "INVALID" } },
      }).validation.reasonCodes,
    ).toContain("AUDIT_INTEGRITY_BROKEN");
  });

  it("produces CONDITIONAL_PASS for bounded replay visibility degradation", () => {
    const base = certificationInput();
    const degraded = sealRecommendationObservabilityCertification({
      ...base,
      observability: { ...base.observability, result: { ...base.observability.result, replayVisible: false, observabilityState: "LIMITED" } },
      inspection: { ...base.inspection, result: { ...base.inspection.result, replayVisible: false, inspectionState: "LIMITED" } },
      audit: { ...base.audit, result: { ...base.audit.result, replayIncluded: false, exportState: "LIMITED" } },
      replay: { ...base.replay, result: { ...base.replay.result, replayIntegrity: false, replayState: "LIMITED" } },
    });
    expect(degraded.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(degraded.validation.reasonCodes).toContain("REPLAY_VISIBILITY_UNAVAILABLE");
  });

  it("fails on mutation attempts, authority expansion, and broken evidence chain", () => {
    const base = certificationInput();
    expect(
      sealRecommendationObservabilityCertification({ ...base, certificationMutationAttempted: true }).validation.reasonCodes,
    ).toContain("CERTIFICATION_MUTATION_DETECTED");
    expect(
      sealRecommendationObservabilityCertification({ ...base, visibilityMutationAttempted: true }).validation.reasonCodes,
    ).toContain("VISIBILITY_MUTATION_DETECTED");
    expect(
      sealRecommendationObservabilityCertification({ ...base, auditMutationAttempted: true }).validation.reasonCodes,
    ).toContain("AUDIT_MUTATION_DETECTED");
    expect(
      sealRecommendationObservabilityCertification({ ...base, authorityExpansionDetected: true }).validation.reasonCodes,
    ).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(
      sealRecommendationObservabilityCertification({
        ...base,
        audit: { ...base.audit, evidencePath: { ...base.audit.evidencePath, evidenceIds: [] } },
      }).validation.reasonCodes,
    ).toContain("EVIDENCE_CHAIN_BROKEN");
  });

  it("keeps execution impossible and control behavior absent", () => {
    const base = certificationInput();
    expect(
      sealRecommendationObservabilityCertification({ ...base, executionRequested: true }).validation.reasonCodes,
    ).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(
      sealRecommendationObservabilityCertification({ ...base, workflowRoutingRequested: true }).validation.reasonCodes,
    ).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(
      sealRecommendationObservabilityCertification({ ...base, recommendationGenerationRequested: true }).validation.reasonCodes,
    ).toContain("RECOMMENDATION_GENERATION_DETECTED");
    expect(
      sealRecommendationObservabilityCertification({ ...base, approvalCreationRequested: true }).validation.reasonCodes,
    ).toContain("APPROVAL_CREATION_DETECTED");
    expect(
      sealRecommendationObservabilityCertification({ ...base, repairRequested: true }).validation.reasonCodes,
    ).toContain("REPAIR_DETECTED");
    const healthy = sealRecommendationObservabilityCertification(base);
    expect(healthy.executionAuthorized).toBe(false);
    expect(healthy.workflowRoutingAllowed).toBe(false);
    expect(healthy.recommendationGenerationAllowed).toBe(false);
    expect(healthy.approvalCreationAllowed).toBe(false);
    expect(healthy.repairAuthorized).toBe(false);
    expect(healthy.authorityMutationAllowed).toBe(false);
    expect(healthy.controlSurfacePresent).toBe(false);
  });

  it("does not mutate inputs", () => {
    const input = certificationInput();
    const before = JSON.stringify(input);
    sealRecommendationObservabilityCertification(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
