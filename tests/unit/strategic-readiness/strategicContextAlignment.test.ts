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
  buildStrategicContextAlignmentRequest,
  buildStrategicReadinessRequest,
  createStrategicContextAlignmentEvidencePath,
  sealStrategicContextAlignment,
  sealStrategicReadiness,
  type StrategicContextAlignmentInput,
} from "@/services/strategic-readiness";

function graphInput(overrides: Partial<DecisionGraphContractInput> = {}): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId: "graph-510b", nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: "lineage-boundary-node" },
    { nodeId: "governance-anchor", graphId: "graph-510b", nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: "lineage-governance-anchor" },
    { nodeId: "recommendation-anchor", graphId: "graph-510b", nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: "lineage-recommendation-anchor" },
    { nodeId: "escalation-anchor", graphId: "graph-510b", nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: "lineage-escalation-anchor" },
  ];
  return Object.freeze({
    graphId: "graph-510b",
    tenantId: "tenant-alpha",
    missionId: "mission-alpha",
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-11T00:00:00.000Z",
    nodes,
    edges: [{
      edgeId: "edge-escalation-governance",
      graphId: "graph-510b",
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
  { proposalId: "proposal-a", graphId: "graph-510b", tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: "lineage-proposal-a" },
];
const governanceNodes = (): readonly GovernanceNodeInput[] => [
  { governanceId: "governance-a", graphId: "graph-510b", tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: "lineage-governance-a" },
];
const escalationNodes = (): readonly EscalationNodeInput[] => [
  { escalationId: "escalation-a", graphId: "graph-510b", tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: "lineage-escalation-a" },
];

function buildAlignmentInputs() {
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

  return {
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
  };
}

function alignmentInput(overrides: Partial<StrategicContextAlignmentInput> = {}): StrategicContextAlignmentInput {
  const base = buildAlignmentInputs();
  const request = buildStrategicContextAlignmentRequest({
    ...base,
    recommendationId: "recommendation-anchor",
    tenantId: "tenant-alpha",
    alignmentScope: "FULL",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({
    request,
    ...base,
    ...overrides,
  } satisfies StrategicContextAlignmentInput);
}

describe("strategicContextAlignment", () => {
  it("is deterministic and reproduces alignment hashes", () => {
    const input = alignmentInput();
    const first = sealStrategicContextAlignment(input);
    const second = sealStrategicContextAlignment(input);
    expect(first).toEqual(second);
    expect(first.result.alignmentState).toBe("ALIGNED");
    expect(first.result.alignmentHash).toHaveLength(64);
  });

  it("keeps alignment ordering reproducible across scopes", () => {
    const base = alignmentInput();
    const scopes = ["MISSION", "OBJECTIVES", "GOVERNANCE", "RISK", "FULL"] as const;
    for (const alignmentScope of scopes) {
      const scoped = alignmentInput({ request: { ...base.request, alignmentScope } });
      expect(createStrategicContextAlignmentEvidencePath(scoped)).toEqual(
        createStrategicContextAlignmentEvidencePath(scoped),
      );
      expect(sealStrategicContextAlignment(scoped).result.alignmentHash).toBe(
        sealStrategicContextAlignment(scoped).result.alignmentHash,
      );
    }
  });

  it("surfaces unknown mission or objective context as OBSERVE", () => {
    const base = alignmentInput();
    const missingMission = sealStrategicContextAlignment({
      ...base,
      lineage: { ...base.lineage, ancestryChain: Object.freeze([]) },
    });
    const missingObjectives = sealStrategicContextAlignment({
      ...base,
      audit: { ...base.audit, result: { ...base.audit.result, exportedArtifacts: [] } },
    });
    expect(missingMission.result.alignmentState).toBe("OBSERVE");
    expect(missingMission.validation.reasonCodes).toContain("MISSION_ALIGNMENT_UNKNOWN");
    expect(missingObjectives.result.alignmentState).toBe("OBSERVE");
    expect(missingObjectives.validation.reasonCodes).toContain("OBJECTIVE_ALIGNMENT_UNKNOWN");
  });

  it("surfaces bounded risk or operational gaps as PARTIALLY_ALIGNED", () => {
    const base = alignmentInput();
    const riskLimited = sealStrategicContextAlignment({
      ...base,
      integrity: { ...base.integrity, result: { ...base.integrity.result, integrityState: "DEGRADED" } },
    });
    const operationalLimited = sealStrategicContextAlignment({
      ...base,
      readiness: { ...base.readiness, result: { ...base.readiness.result, readinessState: "LIMITED", observabilityComplete: false } },
    });
    expect(riskLimited.result.alignmentState).toBe("PARTIALLY_ALIGNED");
    expect(riskLimited.validation.reasonCodes).toContain("RISK_ALIGNMENT_INCOMPLETE");
    expect(operationalLimited.result.alignmentState).toBe("PARTIALLY_ALIGNED");
    expect(operationalLimited.validation.reasonCodes).toContain("OPERATIONAL_ALIGNMENT_INCOMPLETE");
  });

  it("blocks governance conflict, cross-tenant access, and ownership mismatch", () => {
    const base = alignmentInput();
    const governanceConflict = sealStrategicContextAlignment({
      ...base,
      governanceCertification: { ...base.governanceCertification, result: { ...base.governanceCertification.result, certificationState: "FAIL" } },
    });
    const crossTenant = sealStrategicContextAlignment({
      ...base,
      replayEvidence: { ...base.replayEvidence, tenantId: "tenant-beta" },
    });
    const ownershipMismatch = sealStrategicContextAlignment({
      ...base,
      ownershipEvidence: { ...base.ownershipEvidence, recommendationId: "recommendation-other" },
    });
    expect(governanceConflict.result.alignmentState).toBe("MISALIGNED");
    expect(governanceConflict.validation.reasonCodes).toContain("GOVERNANCE_CONFLICT_DETECTED");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_ALIGNMENT_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks mutation, execution, approval, ranking, workflow, governance execution, and authority expansion", () => {
    const base = alignmentInput();
    expect(sealStrategicContextAlignment({ ...base, alignmentMutationAttempted: true }).validation.reasonCodes).toContain("ALIGNMENT_MUTATION_DETECTED");
    expect(sealStrategicContextAlignment({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealStrategicContextAlignment({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealStrategicContextAlignment({ ...base, recommendationApprovalRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_APPROVAL_DETECTED");
    expect(sealStrategicContextAlignment({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_RANKING_DETECTED");
    expect(sealStrategicContextAlignment({ ...base, governanceExecutionRequested: true }).validation.reasonCodes).toContain("GOVERNANCE_EXECUTION_DETECTED");
    expect(sealStrategicContextAlignment({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });

  it("does not mutate inputs", () => {
    const input = alignmentInput();
    const before = JSON.stringify(input);
    sealStrategicContextAlignment(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
