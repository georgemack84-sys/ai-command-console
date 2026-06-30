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
  buildGovernanceBindingCertificationRequest,
  buildGovernanceReplayRequest,
  buildPolicyVisibilityRequest,
  buildRecommendationAuthorityScopeRequest,
  buildRecommendationGovernanceBindingRequest,
  sealGovernanceBindingCertification,
  sealGovernanceReplay,
  sealPolicyVisibility,
  sealRecommendationAuthorityScope,
  sealRecommendationGovernanceBinding,
  type GovernanceBindingCertificationInput,
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
import {
  buildOperatorReviewPacketRequest,
  buildStrategicContextAlignmentRequest,
  buildStrategicReadinessRequest,
  createOperatorReviewPacketEvidencePath,
  sealOperatorReviewPacket,
  sealStrategicContextAlignment,
  sealStrategicReadiness,
  type OperatorReviewPacketInput,
} from "@/services/strategic-readiness";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-510c", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-510c", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-510c", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-510c", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-510c",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-11T00:00:00.000Z",
    nodes,
    edges: [{
      edgeId: "edge-escalation-governance",
      graphId: "graph-510c",
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
  { proposalId: "proposal-a", graphId: "graph-510c", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-510c", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-510c", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildPacketInputs() {
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
    certification: graphCertification,
    verification: verificationGraph,
    inspection: inspectionGraph,
    topology,
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
  const governanceReplay = sealGovernanceReplay({
    request: buildGovernanceReplayRequest({
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
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      replayScope: "FULL",
      requestedGovernanceReferences: ["gov:lineage", "gov:oversight", "gov:replay"],
      replayVersion: "governance-replay/v1",
      graphVersion: "decision-graph/v1",
    }),
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
  } satisfies GovernanceReplayInput);
  const governanceCertification = sealGovernanceBindingCertification({
    request: buildGovernanceBindingCertificationRequest({
      binding,
      authorityScope,
      policyVisibility,
      governanceReplay,
      observability,
      inspection,
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
      certificationScope: "FULL",
      requestedGovernanceReferences: ["gov:lineage", "gov:oversight", "gov:replay"],
      graphVersion: "decision-graph/v1",
    }),
    binding,
    authorityScope,
    policyVisibility,
    governanceReplay,
    observability,
    inspection,
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
  } satisfies GovernanceBindingCertificationInput);
  const readiness = sealStrategicReadiness({
    request: buildStrategicReadinessRequest({
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
      binding,
      authorityScope,
      policyVisibility,
      governanceReplay,
      governanceCertification,
      governanceReferences,
      ownershipEvidence,
      replayEvidence,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      readinessScope: "FULL",
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
    binding,
    authorityScope,
    policyVisibility,
    governanceReplay,
    governanceCertification,
    governanceReferences,
    ownershipEvidence,
    replayEvidence,
  });
  const alignment = sealStrategicContextAlignment({
    request: buildStrategicContextAlignmentRequest({
      readiness,
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
      binding,
      authorityScope,
      policyVisibility,
      governanceReplay,
      governanceCertification,
      governanceReferences,
      ownershipEvidence,
      replayEvidence,
      recommendationId: "recommendation-anchor",
      tenantId: "tenant-alpha",
      alignmentScope: "FULL",
      graphVersion: "decision-graph/v1",
    }),
    readiness,
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
    binding,
    authorityScope,
    policyVisibility,
    governanceReplay,
    governanceCertification,
    governanceReferences,
    ownershipEvidence,
    replayEvidence,
  });

  return {
    readiness,
    alignment,
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
    binding,
    authorityScope,
    policyVisibility,
    governanceReplay,
    governanceCertification,
    governanceReferences,
    ownershipEvidence,
    replayEvidence,
  };
}

function packetInput(overrides: Partial<OperatorReviewPacketInput> = {}): OperatorReviewPacketInput {
  const base = buildPacketInputs();
  const request = buildOperatorReviewPacketRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    packetScope: "FULL",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies OperatorReviewPacketInput);
}

describe("operatorReviewPacket", () => {
  it("is deterministic and reproduces packet hashes", () => {
    const input = packetInput();
    const first = sealOperatorReviewPacket(input);
    const second = sealOperatorReviewPacket(input);
    expect(first).toEqual(second);
    expect(first.result.packetState).toBe("READY_FOR_REVIEW");
    expect(first.result.packetHash).toHaveLength(64);
  });

  it("keeps packet assembly ordering reproducible across scopes", () => {
    const base = packetInput();
    const scopes = ["SUMMARY", "READINESS", "ALIGNMENT", "GOVERNANCE", "FULL"] as const;
    for (const packetScope of scopes) {
      const scoped = packetInput({ request: { ...base.request, packetScope } });
      expect(createOperatorReviewPacketEvidencePath(scoped)).toEqual(
        createOperatorReviewPacketEvidencePath(scoped),
      );
      expect(sealOperatorReviewPacket(scoped).result.packetHash).toBe(
        sealOperatorReviewPacket(scoped).result.packetHash,
      );
    }
  });

  it("surfaces missing readiness or alignment as OBSERVE", () => {
    const base = packetInput();
    const missingReadiness = sealOperatorReviewPacket({
      ...base,
      readiness: { ...base.readiness, result: { ...base.readiness.result, readinessState: "NOT_READY" } },
    });
    const missingAlignment = sealOperatorReviewPacket({
      ...base,
      alignment: { ...base.alignment, result: { ...base.alignment.result, alignmentState: "MISALIGNED" } },
    });
    expect(missingReadiness.result.packetState).toBe("OBSERVE");
    expect(missingReadiness.validation.reasonCodes).toContain("READINESS_MISSING");
    expect(missingAlignment.result.packetState).toBe("OBSERVE");
    expect(missingAlignment.validation.reasonCodes).toContain("ALIGNMENT_MISSING");
  });

  it("surfaces missing replay coverage as LIMITED", () => {
    const base = packetInput();
    const limited = sealOperatorReviewPacket({
      ...base,
      replayEvidence: { ...base.replayEvidence, replayReferences: Object.freeze([]) },
    });
    expect(limited.result.packetState).toBe("LIMITED");
    expect(limited.validation.reasonCodes).toContain("REPLAY_REFERENCES_MISSING");
  });

  it("preserves governance and certification context reproducibly", () => {
    const input = packetInput();
    const sealed = sealOperatorReviewPacket(input);
    expect(sealed.result.governanceIncluded).toBe(true);
    expect(sealed.result.certificationIncluded).toBe(true);
    expect(sealed.validation.reasonCodes).toContain("GOVERNANCE_CONTEXT_PRESERVED");
    expect(sealed.validation.reasonCodes).toContain("CERTIFICATION_INCLUDED");
  });

  it("blocks cross-tenant packets and ownership mismatch", () => {
    const base = packetInput();
    const crossTenant = sealOperatorReviewPacket({
      ...base,
      replayEvidence: { ...base.replayEvidence, tenantId: "tenant-beta" },
    });
    const ownershipMismatch = sealOperatorReviewPacket({
      ...base,
      ownershipEvidence: { ...base.ownershipEvidence, recommendationId: "recommendation-other" },
    });
    expect(crossTenant.result.packetState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_PACKET_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks mutation, execution, approval, ranking, workflow, governance execution, and authority expansion", () => {
    const base = packetInput();
    expect(sealOperatorReviewPacket({ ...base, packetMutationAttempted: true }).validation.reasonCodes).toContain("PACKET_MUTATION_DETECTED");
    expect(sealOperatorReviewPacket({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealOperatorReviewPacket({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealOperatorReviewPacket({ ...base, recommendationApprovalRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_APPROVAL_DETECTED");
    expect(sealOperatorReviewPacket({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_RANKING_DETECTED");
    expect(sealOperatorReviewPacket({ ...base, governanceExecutionRequested: true }).validation.reasonCodes).toContain("GOVERNANCE_EXECUTION_DETECTED");
    expect(sealOperatorReviewPacket({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("does not mutate inputs", () => {
    const input = packetInput();
    const before = JSON.stringify(input);
    sealOperatorReviewPacket(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
