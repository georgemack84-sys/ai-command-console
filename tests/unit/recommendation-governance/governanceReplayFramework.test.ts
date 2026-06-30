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
  buildGovernanceReplayRequest,
  buildPolicyVisibilityRequest,
  buildRecommendationAuthorityScopeRequest,
  buildRecommendationGovernanceBindingRequest,
  createGovernanceReplayEvidencePath,
  sealGovernanceReplay,
  sealPolicyVisibility,
  sealRecommendationAuthorityScope,
  sealRecommendationGovernanceBinding,
  type GovernanceReplayInput,
  type PolicyVisibilityInput,
  type RecommendationAuthorityScopeInput,
  type RecommendationGovernanceBindingInput,
  type SealedGovernanceReferenceRecord,
  type SealedLineageEvidenceRecord,
  type SealedOwnershipEvidenceRecord,
  type SealedPolicyReferenceRecord,
  type SealedReplayEvidenceRecord,
} from "@/services/recommendation-governance";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-59d", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-59d", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-59d", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-59d", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-59d",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-07T03:00:00.000Z",
    nodes,
    edges: [{
      edgeId: "edge-escalation-governance",
      graphId: "graph-59d",
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
  { proposalId: "proposal-a", graphId: "graph-59d", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-59d", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-59d", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildReplayInputs() {
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
  const policyReferences: SealedPolicyReferenceRecord = Object.freeze({
    tenantId: "tenant-alpha",
    policyReferences: Object.freeze(["gov:lineage", "gov:oversight", "policy:constraints", "policy:authority"]),
    policyHash: "p".repeat(64),
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
      observabilityCertification: {} as never,
      governanceReferences,
      lineageEvidence,
      replayEvidence,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      governanceScope: "FULL",
      requestedGovernanceReferences: ["gov:lineage", "gov:oversight", "gov:replay"],
      graphVersion: "decision-graph/v1",
    } as Omit<RecommendationGovernanceBindingInput, "request"> & { recommendationId?: string; tenantId?: string; governanceScope?: never; requestedGovernanceReferences?: readonly string[]; graphVersion?: string }),
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
    observabilityCertification: sealRecommendationObservabilityCertification({
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
    } satisfies RecommendationObservabilityCertificationInput),
    governanceReferences,
    lineageEvidence,
    replayEvidence,
  } satisfies RecommendationGovernanceBindingInput);

  const authorityScope = sealRecommendationAuthorityScope({
    request: buildRecommendationAuthorityScopeRequest({
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
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      authorityScope: "FULL_VISIBILITY",
      requestedGovernanceReferences: ["gov:lineage", "gov:oversight", "gov:replay"],
      graphVersion: "decision-graph/v1",
    }),
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
  } satisfies RecommendationAuthorityScopeInput);

  const policyVisibility = sealPolicyVisibility({
    request: buildPolicyVisibilityRequest({
      binding,
      authorityScope,
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
      policyReferences,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      visibilityScope: "FULL",
      requestedGovernanceReferences: ["gov:lineage", "gov:oversight", "gov:replay"],
      graphVersion: "decision-graph/v1",
    }),
    binding,
    authorityScope,
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
    policyReferences,
  } satisfies PolicyVisibilityInput);

  return {
    binding,
    authorityScope,
    policyVisibility,
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
    replayEvidence,
    ownershipEvidence,
  };
}

function replayInput(overrides: Partial<GovernanceReplayInput> = {}): GovernanceReplayInput {
  const base = buildReplayInputs();
  const request = buildGovernanceReplayRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    replayScope: "FULL",
    requestedGovernanceReferences: ["gov:lineage", "gov:oversight", "gov:replay"],
    replayVersion: "governance-replay/v1",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies GovernanceReplayInput);
}

describe("governanceReplayFramework", () => {
  it("is deterministic and reproduces replay and reconstruction hashes", () => {
    const input = replayInput();
    const first = sealGovernanceReplay(input);
    const second = sealGovernanceReplay(input);
    expect(first).toEqual(second);
    expect(first.result.replayState).toBe("REPLAYABLE");
    expect(first.result.replayHash).toHaveLength(64);
    expect(first.result.reconstructionHash).toHaveLength(64);
  });

  it("keeps replay evidence ordering reproducible across scopes", () => {
    const base = replayInput();
    const scopes = ["BINDINGS", "AUTHORITY", "POLICY", "LINEAGE", "FULL"] as const;
    for (const replayScope of scopes) {
      const scoped = replayInput({ request: { ...base.request, replayScope } });
      expect(createGovernanceReplayEvidencePath(scoped)).toEqual(createGovernanceReplayEvidencePath(scoped));
      expect(sealGovernanceReplay(scoped).result.replayHash).toBe(sealGovernanceReplay(scoped).result.replayHash);
      expect(sealGovernanceReplay(scoped).result.reconstructionHash).toBe(sealGovernanceReplay(scoped).result.reconstructionHash);
    }
  });

  it("blocks cross-tenant replay and ownership mismatch", () => {
    const base = replayInput();
    const crossTenant = sealGovernanceReplay({
      ...base,
      replayEvidence: { ...base.replayEvidence, tenantId: "tenant-beta" },
    });
    const ownershipMismatch = sealGovernanceReplay({
      ...base,
      ownershipEvidence: { ...base.ownershipEvidence, recommendationId: "recommendation-other" },
    });
    expect(crossTenant.result.replayState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_REPLAY_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("surfaces missing governance references and replay artifacts as LIMITED", () => {
    const base = replayInput();
    const missingGovernance = sealGovernanceReplay({
      ...base,
      request: { ...base.request, governanceReferences: ["gov:missing"] },
    });
    const missingReplay = sealGovernanceReplay({
      ...base,
      replayEvidence: { ...base.replayEvidence, replayReferences: [] },
    });
    expect(missingGovernance.result.replayState).toBe("LIMITED");
    expect(missingGovernance.validation.reasonCodes).toContain("GOVERNANCE_REFERENCES_MISSING");
    expect(missingReplay.result.replayState).toBe("LIMITED");
    expect(missingReplay.validation.reasonCodes).toContain("REPLAY_ARTIFACTS_MISSING");
  });

  it("surfaces reconstruction and replay hash concerns as ESCALATED", () => {
    const base = replayInput();
    const broken = sealGovernanceReplay({
      ...base,
      policyVisibility: { ...base.policyVisibility, result: { ...base.policyVisibility.result, policiesVisible: false, visibilityState: "LIMITED" } },
    });
    const hashMismatch = sealGovernanceReplay({
      ...base,
      ownershipEvidence: { ...base.ownershipEvidence, ownershipHash: "short-hash" },
    });
    expect(broken.result.replayState).toBe("ESCALATED");
    expect(broken.validation.reasonCodes).toContain("RECONSTRUCTION_BROKEN");
    expect(hashMismatch.validation.reasonCodes).toContain("REPLAY_HASH_MISMATCH");
  });

  it("rejects replay mutation, hidden replay state, and authority expansion", () => {
    const base = replayInput();
    expect(sealGovernanceReplay({ ...base, replayMutationAttempted: true }).validation.reasonCodes).toContain("REPLAY_MUTATION_DETECTED");
    expect(sealGovernanceReplay({ ...base, hiddenReplayStateDetected: true }).validation.reasonCodes).toContain("HIDDEN_REPLAY_STATE_DETECTED");
    expect(sealGovernanceReplay({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("blocks execution, workflow, approval, policy execution, and prioritization behavior", () => {
    const base = replayInput();
    expect(sealGovernanceReplay({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealGovernanceReplay({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealGovernanceReplay({ ...base, approvalBehaviorRequested: true }).validation.reasonCodes).toContain("APPROVAL_BEHAVIOR_DETECTED");
    expect(sealGovernanceReplay({ ...base, policyExecutionRequested: true }).validation.reasonCodes).toContain("POLICY_EXECUTION_DETECTED");
    expect(sealGovernanceReplay({ ...base, recommendationPrioritizationRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_PRIORITIZATION_DETECTED");
  });

  it("does not mutate inputs", () => {
    const input = replayInput();
    const before = JSON.stringify(input);
    sealGovernanceReplay(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
