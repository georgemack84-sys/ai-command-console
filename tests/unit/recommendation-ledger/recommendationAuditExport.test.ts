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
  buildRecommendationObservabilityRequest,
  buildRecommendationReplayRequest,
  createRecommendationAuditExportEvidencePath,
  sealLineageReconstruction,
  sealOperatorVisibility,
  sealRecommendationAuditExport,
  sealRecommendationCertification,
  sealRecommendationHistoryVerification,
  sealRecommendationInspection,
  sealRecommendationIntegrity,
  sealRecommendationLedger,
  sealRecommendationObservability,
  sealRecommendationReplay,
  type LineageReconstructionInput,
  type OperatorVisibilityInput,
  type RecommendationAuditExportInput,
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
    { nodeId: "boundary-node", graphId: "graph-58d", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-58d", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-58d", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-58d", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-58d",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-06T04:00:00.000Z",
    nodes,
    edges: [{
      edgeId: "edge-escalation-governance",
      graphId: "graph-58d",
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
  { proposalId: "proposal-a", graphId: "graph-58d", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-58d", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-58d", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildExportInputs() {
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

  return { observability, inspection, visibility, ledger, lineage, verification, replay, integrity, certification };
}

function exportInput(overrides: Partial<RecommendationAuditExportInput> = {}): RecommendationAuditExportInput {
  const base = buildExportInputs();
  const request = buildRecommendationAuditExportRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    exportScope: "FULL",
    exportFormat: "JSON",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies RecommendationAuditExportInput);
}

describe("recommendationAuditExport", () => {
  it("is deterministic and reproduces export hashes", () => {
    const input = exportInput();
    const first = sealRecommendationAuditExport(input);
    const second = sealRecommendationAuditExport(input);
    expect(first).toEqual(second);
    expect(first.result.exportState).toBe("EXPORTED");
    expect(first.result.exportHash).toHaveLength(64);
  });

  it("keeps artifact packaging deterministic across scopes and formats", () => {
    const base = exportInput();
    const scopes = ["SUMMARY", "LINEAGE", "REPLAY", "INTEGRITY", "CERTIFICATION", "FULL"] as const;
    const formats = ["JSON", "NDJSON", "BUNDLE"] as const;
    for (const exportScope of scopes) {
      for (const exportFormat of formats) {
        const scoped = exportInput({ request: { ...base.request, exportScope, exportFormat } });
        expect(createRecommendationAuditExportEvidencePath(scoped)).toEqual(createRecommendationAuditExportEvidencePath(scoped));
        expect(sealRecommendationAuditExport(scoped).result.exportHash).toBe(sealRecommendationAuditExport(scoped).result.exportHash);
      }
    }
  });

  it("blocks cross-tenant access and ownership mismatch", () => {
    const base = exportInput();
    const crossTenant = sealRecommendationAuditExport({
      ...base,
      observability: { ...base.observability, result: { ...base.observability.result, tenantIsolationVerified: false } },
    });
    const ownershipMismatch = sealRecommendationAuditExport({
      ...base,
      certification: { ...base.certification, result: { ...base.certification.result, ownershipCertified: false } },
    });
    expect(crossTenant.result.exportState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_EXPORT_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("escalates when export scope exceeds granted visibility", () => {
    const base = exportInput();
    const escalated = sealRecommendationAuditExport({
      ...base,
      request: { ...base.request, exportScope: "FULL" },
      visibility: {
        ...base.visibility,
        result: { ...base.visibility.result, permittedScopes: ["SUMMARY"], visibilityState: "VISIBLE" },
      },
    });
    expect(escalated.result.exportState).toBe("ESCALATED");
    expect(escalated.validation.reasonCodes).toContain("EXPORT_SCOPE_ESCALATED");
  });

  it("limits replay, lineage, and certification exports when those projections are unavailable", () => {
    const base = exportInput();
    const replayLimited = sealRecommendationAuditExport({
      ...base,
      request: { ...base.request, exportScope: "REPLAY" },
      observability: { ...base.observability, result: { ...base.observability.result, replayVisible: false, observabilityState: "LIMITED" } },
      inspection: { ...base.inspection, result: { ...base.inspection.result, replayVisible: false, inspectionState: "LIMITED" } },
    });
    const lineageLimited = sealRecommendationAuditExport({
      ...base,
      request: { ...base.request, exportScope: "LINEAGE" },
      observability: { ...base.observability, result: { ...base.observability.result, lineageVisible: false, observabilityState: "ESCALATED" } },
      inspection: { ...base.inspection, result: { ...base.inspection.result, lineageVisible: false, inspectionState: "ESCALATED" } },
    });
    const certificationLimited = sealRecommendationAuditExport({
      ...base,
      request: { ...base.request, exportScope: "CERTIFICATION" },
      observability: { ...base.observability, result: { ...base.observability.result, certificationVisible: false, observabilityState: "LIMITED" } },
      inspection: { ...base.inspection, result: { ...base.inspection.result, certificationVisible: false, inspectionState: "LIMITED" } },
    });
    expect(replayLimited.result.exportState).toBe("LIMITED");
    expect(replayLimited.validation.reasonCodes).toContain("REPLAY_UNAVAILABLE_LIMITED");
    expect(lineageLimited.result.exportState).toBe("LIMITED");
    expect(lineageLimited.validation.reasonCodes).toContain("LINEAGE_UNAVAILABLE_LIMITED");
    expect(certificationLimited.result.exportState).toBe("LIMITED");
    expect(certificationLimited.validation.reasonCodes).toContain("CERTIFICATION_UNAVAILABLE_LIMITED");
  });

  it("rejects unsupported export formats", () => {
    const base = exportInput();
    const invalid = sealRecommendationAuditExport({
      ...base,
      request: { ...base.request, exportFormat: "XML" as never },
    });
    expect(invalid.result.exportState).toBe("INVALID");
    expect(invalid.validation.reasonCodes).toContain("EXPORT_FORMAT_INVALID");
  });

  it("blocks mutation, repair, workflow, approval, execution, and authority expansion behavior", () => {
    const base = exportInput();
    expect(sealRecommendationAuditExport({ ...base, exportMutationAttempted: true }).validation.reasonCodes).toContain("EXPORT_MUTATION_DETECTED");
    expect(sealRecommendationAuditExport({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealRecommendationAuditExport({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealRecommendationAuditExport({ ...base, approvalCreationRequested: true }).validation.reasonCodes).toContain("APPROVAL_CREATION_DETECTED");
    expect(sealRecommendationAuditExport({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealRecommendationAuditExport({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("does not mutate inputs", () => {
    const input = exportInput();
    const before = JSON.stringify(input);
    sealRecommendationAuditExport(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
