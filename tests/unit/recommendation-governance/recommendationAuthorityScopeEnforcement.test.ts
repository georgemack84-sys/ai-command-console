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
import {
  buildRecommendationAuthorityScopeRequest,
  buildRecommendationGovernanceBindingRequest,
  createRecommendationAuthorityScopeEvidencePath,
  sealRecommendationAuthorityScope,
  sealRecommendationGovernanceBinding,
  type RecommendationAuthorityScopeInput,
  type RecommendationGovernanceBindingInput,
  type SealedGovernanceReferenceRecord,
  type SealedLineageEvidenceRecord,
  type SealedOwnershipEvidenceRecord,
  type SealedReplayEvidenceRecord,
} from "@/services/recommendation-governance";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-59b", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-59b", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-59b", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-59b", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-59b",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-07T01:00:00.000Z",
    nodes,
    edges: [{
      edgeId: "edge-escalation-governance",
      graphId: "graph-59b",
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
  { proposalId: "proposal-a", graphId: "graph-59b", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-59b", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-59b", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildScopeInputs() {
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
  const observabilityCertification = sealRecommendationObservabilityCertification({
    request: buildRecommendationObservabilityCertificationRequest({
      observability,
      inspection,
      visibility,
      audit,
      ledger,
      lineage,
      verification,
      replay,
      integrity,
      certification,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      certificationScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    observability,
    inspection,
    visibility,
    audit,
    ledger,
    lineage,
    verification,
    replay,
    integrity,
    certification,
  } satisfies RecommendationObservabilityCertificationInput);

  const governanceReferences: SealedGovernanceReferenceRecord = Object.freeze({
    tenantId: "tenant-alpha",
    governanceReferences: Object.freeze(["gov:lineage", "gov:oversight", "gov:replay"]),
    governanceHash: "g".repeat(64),
    sealed: true,
    readOnly: true,
  });
  const lineageEvidence: SealedLineageEvidenceRecord = Object.freeze({
    tenantId: "tenant-alpha",
    lineageReferences: Object.freeze([
      ...lineage.evidencePath.lineageReferences,
      ...verification.evidencePath.lineageReferences,
      ...observability.evidencePath.lineageReferences,
      ...audit.evidencePath.lineageReferences,
    ].sort()),
    lineageHash: "l".repeat(64),
    sealed: true,
    readOnly: true,
  });
  const replayEvidence: SealedReplayEvidenceRecord = Object.freeze({
    tenantId: "tenant-alpha",
    replayReferences: Object.freeze([
      ...replay.evidencePath.evidenceIds,
      ...audit.evidencePath.evidenceIds,
    ].sort()),
    replayHash: "r".repeat(64),
    sealed: true,
    readOnly: true,
  });
  const ownershipEvidence: SealedOwnershipEvidenceRecord = Object.freeze({
    tenantId: "tenant-alpha",
    recommendationId: "recommendation-anchor",
    ownershipReferences: Object.freeze(["owner:tenant-alpha", "recommendation:recommendation-anchor"]),
    ownershipHash: "o".repeat(64),
    sealed: true,
    readOnly: true,
  });

  const binding = sealRecommendationGovernanceBinding({
    request: buildRecommendationGovernanceBindingRequest({
      ledger,
      lineage,
      verification,
      replay,
      integrity,
      certification,
      observability,
      inspection,
      visibility,
      audit,
      observabilityCertification,
      governanceReferences,
      lineageEvidence,
      replayEvidence,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      governanceScope: "FULL",
      requestedGovernanceReferences: ["gov:lineage", "gov:oversight", "gov:replay"],
      graphVersion: "decision-graph/v1",
    }),
    ledger,
    lineage,
    verification,
    replay,
    integrity,
    certification,
    observability,
    inspection,
    visibility,
    audit,
    observabilityCertification,
    governanceReferences,
    lineageEvidence,
    replayEvidence,
  } satisfies RecommendationGovernanceBindingInput);

  return {
    binding,
    observability,
    inspection,
    visibility,
    audit,
    ledger,
    lineage,
    verification,
    replay,
    integrity,
    certification,
    governanceReferences,
    ownershipEvidence,
    replayEvidence,
  };
}

function scopeInput(overrides: Partial<RecommendationAuthorityScopeInput> = {}): RecommendationAuthorityScopeInput {
  const base = buildScopeInputs();
  const request = buildRecommendationAuthorityScopeRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    authorityScope: "FULL_VISIBILITY",
    requestedGovernanceReferences: ["gov:lineage", "gov:oversight", "gov:replay"],
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies RecommendationAuthorityScopeInput);
}

describe("recommendationAuthorityScopeEnforcement", () => {
  it("is deterministic and reproduces authority hashes", () => {
    const input = scopeInput();
    const first = sealRecommendationAuthorityScope(input);
    const second = sealRecommendationAuthorityScope(input);
    expect(first).toEqual(second);
    expect(first.result.scopeState).toBe("WITHIN_SCOPE");
    expect(first.result.authorityHash).toHaveLength(64);
  });

  it("keeps evidence ordering reproducible across scopes", () => {
    const base = scopeInput();
    const scopes = ["OBSERVE_ONLY", "ANALYSIS_ONLY", "AUDIT_ONLY", "GOVERNANCE_ONLY", "FULL_VISIBILITY"] as const;
    for (const authorityScope of scopes) {
      const scoped = scopeInput({ request: { ...base.request, authorityScope } });
      expect(createRecommendationAuthorityScopeEvidencePath(scoped)).toEqual(
        createRecommendationAuthorityScopeEvidencePath(scoped),
      );
      expect(sealRecommendationAuthorityScope(scoped).result.authorityHash).toBe(
        sealRecommendationAuthorityScope(scoped).result.authorityHash,
      );
    }
  });

  it("blocks cross-tenant scope and ownership mismatch", () => {
    const base = scopeInput();
    const crossTenant = sealRecommendationAuthorityScope({
      ...base,
      ownershipEvidence: { ...base.ownershipEvidence, tenantId: "tenant-beta" },
    });
    const ownershipMismatch = sealRecommendationAuthorityScope({
      ...base,
      ownershipEvidence: { ...base.ownershipEvidence, recommendationId: "recommendation-other" },
    });
    expect(crossTenant.result.scopeState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_SCOPE_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces missing scope visibility as LIMITED", () => {
    const base = scopeInput();
    const limited = sealRecommendationAuthorityScope({
      ...base,
      request: { ...base.request, authorityScope: "AUDIT_ONLY", governanceReferences: [] },
    });
    expect(limited.result.scopeState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("AUTHORITY_SCOPE_MISSING");
  });

  it("surfaces governance scope mismatch as ESCALATED", () => {
    const base = scopeInput();
    const escalated = sealRecommendationAuthorityScope({
      ...base,
      request: { ...base.request, authorityScope: "OBSERVE_ONLY" },
      binding: { ...base.binding, evidencePath: { ...base.binding.evidencePath, scope: "FULL" } },
    });
    expect(escalated.result.scopeState).toBe("ESCALATED");
    expect(escalated.validation.reasonCodes).toContain("GOVERNANCE_SCOPE_MISMATCH");
  });

  it("rejects authority expansion and hidden authority", () => {
    const base = scopeInput();
    const authority = sealRecommendationAuthorityScope({ ...base, authorityExpansionDetected: true });
    const hidden = sealRecommendationAuthorityScope({ ...base, hiddenAuthorityDetected: true });
    expect(authority.result.scopeState).toBe("INVALID");
    expect(authority.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
    expect(hidden.validation.reasonCodes).toContain("HIDDEN_AUTHORITY_DETECTED");
  });

  it("blocks mutation, execution, workflow, approval, and prioritization behavior", () => {
    const base = scopeInput();
    expect(sealRecommendationAuthorityScope({ ...base, scopeMutationAttempted: true }).validation.reasonCodes).toContain("SCOPE_MUTATION_DETECTED");
    expect(sealRecommendationAuthorityScope({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealRecommendationAuthorityScope({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealRecommendationAuthorityScope({ ...base, approvalBehaviorRequested: true }).validation.reasonCodes).toContain("APPROVAL_BEHAVIOR_DETECTED");
    expect(sealRecommendationAuthorityScope({ ...base, recommendationPrioritizationRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_PRIORITIZATION_DETECTED");
  });

  it("does not mutate inputs", () => {
    const input = scopeInput();
    const before = JSON.stringify(input);
    sealRecommendationAuthorityScope(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
