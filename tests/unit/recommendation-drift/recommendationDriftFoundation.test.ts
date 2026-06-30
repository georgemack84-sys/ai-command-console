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
  buildDependencyAnalysisRequest,
  buildDependencyCertificationRequest,
  buildDependencyObservabilityRequest,
  buildDependencyReplayRequest,
  buildRecommendationDependencyFoundationRequest,
  sealDependencyAnalysis,
  sealDependencyCertification,
  sealDependencyObservability,
  sealDependencyReplay,
  sealRecommendationDependencyFoundation,
  type DependencyAnalysisInput,
  type DependencyCertificationInput,
  type DependencyObservabilityInput,
  type DependencyReplayInput,
  type RecommendationDependencyFoundationInput,
} from "@/services/recommendation-dependency";
import {
  buildImpactAnalysisRequest,
  buildImpactCertificationRequest,
  buildImpactObservabilityRequest,
  buildImpactReplayRequest,
  buildRecommendationImpactFoundationRequest,
  sealImpactAnalysis,
  sealImpactCertification,
  sealImpactObservability,
  sealImpactReplay,
  sealRecommendationImpactFoundation,
  type ImpactAnalysisInput,
  type ImpactCertificationInput,
  type ImpactObservabilityInput,
  type RecommendationImpactFoundationInput,
} from "@/services/recommendation-impact";
import {
  buildRecommendationDriftFoundationRequest,
  createRecommendationDriftEvidencePath,
  sealRecommendationDriftFoundation,
  type RecommendationDriftFoundationInput,
} from "@/services/recommendation-drift";
import {
  buildPortfolioCertificationRequest,
  buildPortfolioObservabilityRequest,
  buildPortfolioRelationshipAnalysisRequest,
  buildPortfolioReplayRequest,
  buildRecommendationPortfolioRequest,
  sealPortfolioCertification,
  sealPortfolioObservability,
  sealPortfolioRelationshipAnalysis,
  sealPortfolioReplay,
  sealRecommendationPortfolio,
  type PortfolioCertificationInput,
  type PortfolioObservabilityInput,
  type PortfolioRelationshipAnalysisInput,
  type PortfolioReplayInput,
  type RecommendationPortfolioBundle,
  type RecommendationPortfolioInput,
} from "@/services/recommendation-portfolio";
import {
  buildOperatorReviewPacketRequest,
  buildStrategicContextAlignmentRequest,
  buildStrategicReadinessCertificationRequest,
  buildStrategicReadinessReplayRequest,
  buildStrategicReadinessRequest,
  sealOperatorReviewPacket,
  sealStrategicContextAlignment,
  sealStrategicReadiness,
  sealStrategicReadinessCertification,
  sealStrategicReadinessReplay,
  type StrategicReadinessCertificationInput,
} from "@/services/strategic-readiness";

function graphInput(recommendationId: string, graphId: string): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId, nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: `lineage-${recommendationId}-boundary-node` },
    { nodeId: "governance-anchor", graphId, nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: `lineage-${recommendationId}-governance-anchor` },
    { nodeId: recommendationId, graphId, nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: `lineage-${recommendationId}-recommendation-anchor` },
    { nodeId: "escalation-anchor", graphId, nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: `lineage-${recommendationId}-escalation-anchor` },
  ];
  return Object.freeze({
    graphId,
    tenantId: "tenant-alpha",
    missionId: `mission-${recommendationId}`,
    graphVersion: "decision-graph/v1",
    createdAt: "2026-06-11T00:00:00.000Z",
    nodes,
    edges: [{
      edgeId: `edge-${recommendationId}-escalation-governance`,
      graphId,
      sourceNodeId: "escalation-anchor",
      targetNodeId: "governance-anchor",
      relationshipType: "ESCALATES_TO",
      tenantId: "tenant-alpha",
    }],
    lineageReferences: nodes.map((node) => node.lineageReference),
  } satisfies DecisionGraphContractInput);
}

const proposalNodes = (recommendationId: string, graphId: string): readonly ProposalNodeInput[] => [
  { proposalId: `proposal-${recommendationId}`, graphId, tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: `lineage-${recommendationId}-proposal` },
];
const governanceNodes = (recommendationId: string, graphId: string): readonly GovernanceNodeInput[] => [
  { governanceId: `governance-${recommendationId}`, graphId, tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: `lineage-${recommendationId}-governance` },
];
const escalationNodes = (recommendationId: string, graphId: string): readonly EscalationNodeInput[] => [
  { escalationId: `escalation-${recommendationId}`, graphId, tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: `lineage-${recommendationId}-escalation` },
];

function buildBundle(recommendationId: string, graphId: string): RecommendationPortfolioBundle {
  const graph = sealDecisionGraphContract(graphInput(recommendationId, graphId));
  const dependencyGraph = sealRecommendationDependencyGraph({ request: { ...buildRecommendationDependencyRequest({ graph }), recommendationNodeIds: [recommendationId], dependencyNodeIds: ["boundary-node", "governance-anchor"] }, graph });
  const proposalGraph = sealProposalRelationshipGraph({ request: { ...buildProposalRelationshipRequest({ graph, dependencyGraph, proposalNodes: proposalNodes(recommendationId, graphId) }), proposalNodeIds: [`proposal-${recommendationId}`], relationshipNodeIds: ["boundary-node", "governance-anchor"] }, graph, dependencyGraph, proposalNodes: proposalNodes(recommendationId, graphId) });
  const governanceGraph = sealGovernanceInfluenceGraph({ request: { ...buildGovernanceInfluenceRequest({ graph, dependencyGraph, proposalGraph, governanceNodes: governanceNodes(recommendationId, graphId) }), governanceNodeIds: [`governance-${recommendationId}`], influencedNodeIds: ["boundary-node", recommendationId] }, graph, dependencyGraph, proposalGraph, governanceNodes: governanceNodes(recommendationId, graphId) });
  const escalationGraph = sealEscalationGraph({ request: { ...buildEscalationGraphRequest({ graph, dependencyGraph, proposalGraph, governanceGraph, escalationNodes: escalationNodes(recommendationId, graphId) }), escalationNodeIds: [`escalation-${recommendationId}`], targetNodeIds: ["boundary-node", recommendationId] }, graph, dependencyGraph, proposalGraph, governanceGraph, escalationNodes: escalationNodes(recommendationId, graphId) });
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
  const ledger = sealRecommendationLedger({ request: buildRecommendationLedgerRequest({ graph, intelligence: escalation, verification: verificationGraph, certification: graphCertification, escalationCertification, recommendationId, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" } satisfies Omit<RecommendationLedgerInput, "request"> & { recommendationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), graph, intelligence: escalation, verification: verificationGraph, certification: graphCertification, escalationCertification });
  const lineage = sealLineageReconstruction({ request: buildLineageReconstructionRequest({ ledger, graph, verification: verificationGraph, certification: graphCertification, escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"], recommendationId, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" } satisfies Omit<LineageReconstructionInput, "request"> & { reconstructionContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, graph, verification: verificationGraph, certification: graphCertification, escalationCertification: escalationCertification as LineageReconstructionInput["escalationCertification"] });
  const historyReferences = [ledger.entry.ledgerEntryId, ...ledger.entry.evidenceIds, ...lineage.ancestryChain.map((node) => node.lineageReference)];
  const verification = sealRecommendationHistoryVerification({ request: buildRecommendationHistoryVerificationRequest({ ledger, lineage, escalation, graph, verification: verificationGraph, certification: graphCertification, recommendationId, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences } satisfies Omit<RecommendationHistoryVerificationInput, "request"> & { verificationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, escalation, graph, verification: verificationGraph, certification: graphCertification, historyReferences });
  const replayReferences = [ledger.entry.ledgerEntryId, ...ledger.entry.evidenceIds, ...lineage.evidencePath.evidenceIds, ...verification.evidencePath.evidenceIds];
  const replay = sealRecommendationReplay({ request: buildRecommendationReplayRequest({ ledger, lineage, verification, escalation, graph, recommendationId, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", replayReferences } satisfies Omit<RecommendationReplayInput, "request"> & { replayContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, verification, escalation, graph, replayReferences });
  const integrity = sealRecommendationIntegrity({ request: buildRecommendationIntegrityRequest({ ledger, lineage, verification, replay, escalation, graph, recommendationId, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences } satisfies Omit<RecommendationIntegrityInput, "request"> & { integrityContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, verification, replay, escalation, graph, historyReferences });
  const certification = sealRecommendationCertification({ request: buildRecommendationCertificationRequest({ ledger, lineage, verification, replay, integrity, escalation, graph, recommendationId, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", historyReferences } satisfies Omit<RecommendationCertificationInput, "request"> & { certificationContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, verification, replay, integrity, escalation, graph, historyReferences });
  const observability = sealRecommendationObservability({ request: buildRecommendationObservabilityRequest({ ledger, lineage, verification, replay, integrity, certification, escalation, graph, recommendationId, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" } satisfies Omit<RecommendationObservabilityInput, "request"> & { observabilityContext?: never; recommendationId?: string; tenantId?: string; graphVersion?: string }), ledger, lineage, verification, replay, integrity, certification, escalation, graph });
  const inspection = sealRecommendationInspection({ request: buildRecommendationInspectionRequest({ observability, ledger, lineage, verification, replay, integrity, certification, recommendationId, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1", apiVersion: "recommendation-inspection/v1" } satisfies Omit<RecommendationInspectionInput, "request"> & { inspectionScope?: never; recommendationId?: string; tenantId?: string; graphVersion?: string; apiVersion?: string }), observability, ledger, lineage, verification, replay, integrity, certification });
  const visibility = sealOperatorVisibility({ request: buildOperatorVisibilityRequest({ observability, inspection, ledger, lineage, verification, replay, integrity, certification, recommendationId, tenantId: "tenant-alpha", operatorRole: "AUDITOR", visibilityScope: "FULL", graphVersion: "decision-graph/v1" }), observability, inspection, ledger, lineage, verification, replay, integrity, certification } satisfies OperatorVisibilityInput);
  const audit = sealRecommendationAuditExport({ request: buildRecommendationAuditExportRequest({ observability, inspection, visibility, ledger, lineage, verification, replay, integrity, certification, recommendationId, tenantId: "tenant-alpha", exportScope: "FULL", exportFormat: "JSON", graphVersion: "decision-graph/v1" }), observability, inspection, visibility, ledger, lineage, verification, replay, integrity, certification } satisfies RecommendationAuditExportInput);
  const observabilityCertification = sealRecommendationObservabilityCertification({ request: buildRecommendationObservabilityCertificationRequest({ observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification, recommendationId, tenantId: "tenant-alpha", certificationScope: "FULL", graphVersion: "decision-graph/v1" }), observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification } satisfies RecommendationObservabilityCertificationInput);
  const governanceReferences: SealedGovernanceReferenceRecord = Object.freeze({ tenantId: "tenant-alpha", governanceReferences: Object.freeze([`gov:${recommendationId}:lineage`, `gov:${recommendationId}:oversight`, `gov:${recommendationId}:replay`]), governanceHash: "g".repeat(64), sealed: true, readOnly: true });
  const lineageEvidence: SealedLineageEvidenceRecord = Object.freeze({ tenantId: "tenant-alpha", lineageReferences: Object.freeze([...lineage.evidencePath.lineageReferences, ...verification.evidencePath.lineageReferences, ...observability.evidencePath.lineageReferences, ...audit.evidencePath.lineageReferences].sort()), lineageHash: "l".repeat(64), sealed: true, readOnly: true });
  const replayEvidence: SealedReplayEvidenceRecord = Object.freeze({ tenantId: "tenant-alpha", replayReferences: Object.freeze([...replay.evidencePath.evidenceIds, ...audit.evidencePath.evidenceIds].sort()), replayHash: "r".repeat(64), sealed: true, readOnly: true });
  const ownershipEvidence: SealedOwnershipEvidenceRecord = Object.freeze({ tenantId: "tenant-alpha", recommendationId, ownershipReferences: Object.freeze([`owner:tenant-alpha`, `recommendation:${recommendationId}`]), ownershipHash: "o".repeat(64), sealed: true, readOnly: true });
  const policyReferences: SealedPolicyReferenceRecord = Object.freeze({ tenantId: "tenant-alpha", policyReferences: Object.freeze([`gov:${recommendationId}:lineage`, `gov:${recommendationId}:oversight`, "policy:constraints", "policy:authority"]), policyHash: "p".repeat(64), sealed: true, readOnly: true });
  const binding = sealRecommendationGovernanceBinding({ request: buildRecommendationGovernanceBindingRequest({ ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, governanceReferences, lineageEvidence, replayEvidence, recommendationId, tenantId: "tenant-alpha", governanceScope: "FULL", requestedGovernanceReferences: [...governanceReferences.governanceReferences], graphVersion: "decision-graph/v1" }), ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, governanceReferences, lineageEvidence, replayEvidence } satisfies RecommendationGovernanceBindingInput);
  const authorityScope = sealRecommendationAuthorityScope({ request: buildRecommendationAuthorityScopeRequest({ binding, observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification, governanceReferences, ownershipEvidence, replayEvidence, recommendationId, tenantId: "tenant-alpha", authorityScope: "FULL_VISIBILITY", requestedGovernanceReferences: [...governanceReferences.governanceReferences], graphVersion: "decision-graph/v1" }), binding, observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification, governanceReferences, ownershipEvidence, replayEvidence } satisfies RecommendationAuthorityScopeInput);
  const policyVisibility = sealPolicyVisibility({ request: buildPolicyVisibilityRequest({ binding, authorityScope, observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification, governanceReferences, policyReferences, recommendationId, tenantId: "tenant-alpha", visibilityScope: "FULL", requestedGovernanceReferences: [...governanceReferences.governanceReferences], graphVersion: "decision-graph/v1" }), binding, authorityScope, observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification, governanceReferences, policyReferences } satisfies PolicyVisibilityInput);
  const governanceReplay = sealGovernanceReplay({ request: buildGovernanceReplayRequest({ binding, authorityScope, policyVisibility, observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification, governanceReferences, replayEvidence, ownershipEvidence, recommendationId, tenantId: "tenant-alpha", replayScope: "FULL", requestedGovernanceReferences: [...governanceReferences.governanceReferences], replayVersion: "governance-replay/v1", graphVersion: "decision-graph/v1" }), binding, authorityScope, policyVisibility, observability, inspection, visibility, audit, ledger, lineage, verification, replay, integrity, certification, governanceReferences, replayEvidence, ownershipEvidence } satisfies GovernanceReplayInput);
  const governanceCertification = sealGovernanceBindingCertification({ request: buildGovernanceBindingCertificationRequest({ binding, authorityScope, policyVisibility, governanceReplay, observability, inspection, audit, ledger, lineage, verification, replay, integrity, certification, governanceReferences, ownershipEvidence, replayEvidence, recommendationId, tenantId: "tenant-alpha", certificationScope: "FULL", requestedGovernanceReferences: [...governanceReferences.governanceReferences], graphVersion: "decision-graph/v1" }), binding, authorityScope, policyVisibility, governanceReplay, observability, inspection, audit, ledger, lineage, verification, replay, integrity, certification, governanceReferences, ownershipEvidence, replayEvidence } satisfies GovernanceBindingCertificationInput);
  const readiness = sealStrategicReadiness({ request: buildStrategicReadinessRequest({ ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence, recommendationId, tenantId: "tenant-alpha", readinessScope: "FULL", graphVersion: "decision-graph/v1" }), ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence });
  const alignment = sealStrategicContextAlignment({ request: buildStrategicContextAlignmentRequest({ readiness, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence, recommendationId, tenantId: "tenant-alpha", alignmentScope: "FULL", graphVersion: "decision-graph/v1" }), readiness, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence });
  const reviewPacket = sealOperatorReviewPacket({ request: buildOperatorReviewPacketRequest({ readiness, alignment, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence, recommendationId, tenantId: "tenant-alpha", packetScope: "FULL", graphVersion: "decision-graph/v1" }), readiness, alignment, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence });
  const replayFramework = sealStrategicReadinessReplay({ request: buildStrategicReadinessReplayRequest({ readiness, alignment, reviewPacket, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence, recommendationId, tenantId: "tenant-alpha", replayScope: "FULL", replayVersion: "strategic-readiness-replay/v1", graphVersion: "decision-graph/v1" }), readiness, alignment, reviewPacket, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence });
  const readinessCertificationInput = Object.freeze({ request: buildStrategicReadinessCertificationRequest({ readiness, alignment, reviewPacket, replayFramework, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence, recommendationId, tenantId: "tenant-alpha", certificationScope: "FULL", graphVersion: "decision-graph/v1" }), readiness, alignment, reviewPacket, replayFramework, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence } satisfies StrategicReadinessCertificationInput);
  const readinessCertification = sealStrategicReadinessCertification(readinessCertificationInput);
  return Object.freeze({ readiness, alignment, reviewPacket, replayFramework, readinessCertification, ledger, lineage, verification, replay, integrity, certification, observability, inspection, visibility, audit, observabilityCertification, binding, authorityScope, policyVisibility, governanceReplay, governanceCertification, governanceReferences, ownershipEvidence, replayEvidence } satisfies RecommendationPortfolioBundle);
}

function portfolioInput(overrides: Partial<RecommendationPortfolioInput> = {}): RecommendationPortfolioInput {
  const alpha = buildBundle("recommendation-alpha", "graph-513d-alpha");
  const beta = buildBundle("recommendation-beta", "graph-513d-beta");
  const request = buildRecommendationPortfolioRequest({
    portfolioId: "portfolio-alpha",
    tenantId: "tenant-alpha",
    recommendationIds: ["recommendation-beta", "recommendation-alpha"],
    portfolioScope: "FULL",
    graphVersion: "decision-graph/v1",
  });
  return Object.freeze({ request, recommendations: Object.freeze([beta, alpha]), ...overrides } satisfies RecommendationPortfolioInput);
}

function alignedPortfolioInput(): RecommendationPortfolioInput {
  const base = portfolioInput();
  return Object.freeze({
    ...base,
    recommendations: Object.freeze([
      {
        ...base.recommendations[0],
        ledger: {
          ...base.recommendations[0].ledger,
          entry: {
            ...base.recommendations[0].ledger.entry,
            lineageReferences: Object.freeze(["lineage:shared"]),
          },
        },
        lineage: {
          ...base.recommendations[0].lineage,
          evidencePath: {
            ...base.recommendations[0].lineage.evidencePath,
            lineageReferences: Object.freeze(["lineage:shared"]),
          },
        },
        governanceReferences: { ...base.recommendations[0].governanceReferences, governanceReferences: Object.freeze(["gov:shared"]) },
        replayEvidence: { ...base.recommendations[0].replayEvidence, replayReferences: Object.freeze(["replay:shared"]) },
      },
      {
        ...base.recommendations[1],
        ledger: {
          ...base.recommendations[1].ledger,
          entry: {
            ...base.recommendations[1].ledger.entry,
            lineageReferences: Object.freeze(["lineage:shared"]),
          },
        },
        lineage: {
          ...base.recommendations[1].lineage,
          evidencePath: {
            ...base.recommendations[1].lineage.evidencePath,
            lineageReferences: Object.freeze(["lineage:shared"]),
          },
        },
        governanceReferences: { ...base.recommendations[1].governanceReferences, governanceReferences: Object.freeze(["gov:shared"]) },
        replayEvidence: { ...base.recommendations[1].replayEvidence, replayReferences: Object.freeze(["replay:shared"]) },
      },
    ]),
  } satisfies RecommendationPortfolioInput);
}

function relationshipInput(source: RecommendationPortfolioInput): PortfolioRelationshipAnalysisInput {
  const portfolio = sealRecommendationPortfolio(source);
  return Object.freeze({
    request: buildPortfolioRelationshipAnalysisRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", analysisScope: "FULL", graphVersion: "decision-graph/v1" }),
    portfolio,
    recommendations: source.recommendations,
  } satisfies PortfolioRelationshipAnalysisInput);
}

function portfolioObservabilityInput(source: RecommendationPortfolioInput): PortfolioObservabilityInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  return Object.freeze({
    request: buildPortfolioObservabilityRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", observabilityScope: "FULL", graphVersion: "decision-graph/v1" }),
    portfolio,
    relationshipAnalysis,
    recommendations: source.recommendations,
  } satisfies PortfolioObservabilityInput);
}

function portfolioReplayInput(source: RecommendationPortfolioInput): PortfolioReplayInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  const observability = sealPortfolioObservability(portfolioObservabilityInput(source));
  return Object.freeze({
    request: buildPortfolioReplayRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", replayScope: "FULL", replayVersion: "portfolio-replay/v1", graphVersion: "decision-graph/v1" }),
    portfolio,
    relationshipAnalysis,
    observability,
    recommendations: source.recommendations,
  } satisfies PortfolioReplayInput);
}

function portfolioCertificationInput(source: RecommendationPortfolioInput): PortfolioCertificationInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  const observability = sealPortfolioObservability(portfolioObservabilityInput(source));
  const replay = sealPortfolioReplay(portfolioReplayInput(source));
  return Object.freeze({
    request: buildPortfolioCertificationRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", certificationScope: "FULL", graphVersion: "decision-graph/v1" }),
    portfolio,
    relationshipAnalysis,
    observability,
    replay,
    recommendations: source.recommendations,
  } satisfies PortfolioCertificationInput);
}

function dependencyFoundationInput(source: RecommendationPortfolioInput): RecommendationDependencyFoundationInput {
  return Object.freeze({
    request: buildRecommendationDependencyFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], dependencyScope: "FULL", graphVersion: "decision-graph/v1" }),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    observability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    replay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(portfolioCertificationInput(source)),
    recommendations: source.recommendations,
  } satisfies RecommendationDependencyFoundationInput);
}

function dependencyAnalysisInput(source: RecommendationPortfolioInput): DependencyAnalysisInput {
  return Object.freeze({
    request: buildDependencyAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], analysisScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    observability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    replay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(portfolioCertificationInput(source)),
    recommendations: source.recommendations,
  } satisfies DependencyAnalysisInput);
}

function dependencyObservabilityInput(source: RecommendationPortfolioInput): DependencyObservabilityInput {
  return Object.freeze({
    request: buildDependencyObservabilityRequest({ tenantId: "tenant-alpha", observabilityScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
    analysis: sealDependencyAnalysis(dependencyAnalysisInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    observability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    replay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(portfolioCertificationInput(source)),
    recommendations: source.recommendations,
  } satisfies DependencyObservabilityInput);
}

function dependencyReplayInput(source: RecommendationPortfolioInput): DependencyReplayInput {
  return Object.freeze({
    request: buildDependencyReplayRequest({ tenantId: "tenant-alpha", replayScope: "FULL", replayVersion: "dependency-replay/v1", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
    analysis: sealDependencyAnalysis(dependencyAnalysisInput(source)),
    observability: sealDependencyObservability(dependencyObservabilityInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    portfolioObservability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(portfolioCertificationInput(source)),
    recommendations: source.recommendations,
  } satisfies DependencyReplayInput);
}

function dependencyCertificationInput(source: RecommendationPortfolioInput): DependencyCertificationInput {
  return Object.freeze({
    request: buildDependencyCertificationRequest({ tenantId: "tenant-alpha", certificationScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
    analysis: sealDependencyAnalysis(dependencyAnalysisInput(source)),
    observability: sealDependencyObservability(dependencyObservabilityInput(source)),
    replay: sealDependencyReplay(dependencyReplayInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    portfolioObservability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(portfolioCertificationInput(source)),
    recommendations: source.recommendations,
  } satisfies DependencyCertificationInput);
}

function impactFoundationInput(source: RecommendationPortfolioInput): RecommendationImpactFoundationInput {
  return Object.freeze({
    request: buildRecommendationImpactFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], impactScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
    analysis: sealDependencyAnalysis(dependencyAnalysisInput(source)),
    replay: sealDependencyReplay(dependencyReplayInput(source)),
    certification: sealDependencyCertification(dependencyCertificationInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
    portfolioCertification: sealPortfolioCertification(portfolioCertificationInput(source)),
    recommendations: source.recommendations,
  } satisfies RecommendationImpactFoundationInput);
}

function impactAnalysisInput(source: RecommendationPortfolioInput): ImpactAnalysisInput {
  return Object.freeze({
    request: buildImpactAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], analysisScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationImpactFoundation(impactFoundationInput(source)),
    dependencyFoundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
    dependencyAnalysis: sealDependencyAnalysis(dependencyAnalysisInput(source)),
    dependencyReplay: sealDependencyReplay(dependencyReplayInput(source)),
    dependencyCertification: sealDependencyCertification(dependencyCertificationInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
    portfolioCertification: sealPortfolioCertification(portfolioCertificationInput(source)),
    recommendations: source.recommendations,
  } satisfies ImpactAnalysisInput);
}

function impactObservabilityInput(source: RecommendationPortfolioInput): ImpactObservabilityInput {
  return Object.freeze({
    request: buildImpactObservabilityRequest({ tenantId: "tenant-alpha", observabilityScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationImpactFoundation(impactFoundationInput(source)),
    analysis: sealImpactAnalysis(impactAnalysisInput(source)),
    dependencyFoundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
    dependencyAnalysis: sealDependencyAnalysis(dependencyAnalysisInput(source)),
    dependencyReplay: sealDependencyReplay(dependencyReplayInput(source)),
    dependencyCertification: sealDependencyCertification(dependencyCertificationInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
    portfolioCertification: sealPortfolioCertification(portfolioCertificationInput(source)),
    recommendations: source.recommendations,
  } satisfies ImpactObservabilityInput);
}

let cachedImpactCertificationInput: ImpactCertificationInput | undefined;

function impactCertificationInput(overrides: Partial<ImpactCertificationInput> = {}): ImpactCertificationInput {
  if (!cachedImpactCertificationInput) {
    const source = alignedPortfolioInput();
    cachedImpactCertificationInput = Object.freeze({
      request: buildImpactCertificationRequest({ tenantId: "tenant-alpha", certificationScope: "FULL", graphVersion: "decision-graph/v1" }),
      foundation: sealRecommendationImpactFoundation(impactFoundationInput(source)),
      analysis: sealImpactAnalysis(impactAnalysisInput(source)),
      observability: sealImpactObservability(impactObservabilityInput(source)),
      replay: sealImpactReplay({
        request: buildImpactReplayRequest({ tenantId: "tenant-alpha", replayScope: "FULL", replayVersion: "impact-replay/v1", graphVersion: "decision-graph/v1" }),
        foundation: sealRecommendationImpactFoundation(impactFoundationInput(source)),
        analysis: sealImpactAnalysis(impactAnalysisInput(source)),
        observability: sealImpactObservability(impactObservabilityInput(source)),
        dependencyFoundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
        dependencyAnalysis: sealDependencyAnalysis(dependencyAnalysisInput(source)),
        dependencyReplay: sealDependencyReplay(dependencyReplayInput(source)),
        dependencyCertification: sealDependencyCertification(dependencyCertificationInput(source)),
        portfolio: sealRecommendationPortfolio(source),
        relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
        portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
        portfolioCertification: sealPortfolioCertification(portfolioCertificationInput(source)),
        recommendations: source.recommendations,
      }),
      dependencyFoundation: sealRecommendationDependencyFoundation(dependencyFoundationInput(source)),
      dependencyAnalysis: sealDependencyAnalysis(dependencyAnalysisInput(source)),
      dependencyReplay: sealDependencyReplay(dependencyReplayInput(source)),
      dependencyCertification: sealDependencyCertification(dependencyCertificationInput(source)),
      portfolio: sealRecommendationPortfolio(source),
      relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
      portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
      portfolioCertification: sealPortfolioCertification(portfolioCertificationInput(source)),
      recommendations: source.recommendations,
    } satisfies ImpactCertificationInput);
  }
  return Object.freeze({ ...cachedImpactCertificationInput, ...overrides } satisfies ImpactCertificationInput);
}

let cachedDriftFoundationInput: RecommendationDriftFoundationInput | undefined;

function driftFoundationInput(overrides: Partial<RecommendationDriftFoundationInput> = {}): RecommendationDriftFoundationInput {
  if (!cachedDriftFoundationInput) {
    const impactInput = impactCertificationInput();
    const impactCertification = sealImpactCertification(impactInput);
    cachedDriftFoundationInput = Object.freeze({
      request: buildRecommendationDriftFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], driftScope: "FULL", graphVersion: "decision-graph/v1" }),
      baselineImpactFoundation: impactInput.foundation,
      currentImpactFoundation: impactInput.foundation,
      baselineImpactAnalysis: impactInput.analysis,
      currentImpactAnalysis: impactInput.analysis,
      baselineImpactObservability: impactInput.observability,
      currentImpactObservability: impactInput.observability,
      baselineImpactReplay: impactInput.replay,
      currentImpactReplay: impactInput.replay,
      baselineImpactCertification: impactCertification,
      currentImpactCertification: impactCertification,
      baselineDependencyFoundation: impactInput.dependencyFoundation,
      currentDependencyFoundation: impactInput.dependencyFoundation,
      baselineDependencyAnalysis: impactInput.dependencyAnalysis,
      currentDependencyAnalysis: impactInput.dependencyAnalysis,
      baselineDependencyReplay: impactInput.dependencyReplay,
      currentDependencyReplay: impactInput.dependencyReplay,
      baselineDependencyCertification: impactInput.dependencyCertification,
      currentDependencyCertification: impactInput.dependencyCertification,
      baselinePortfolio: impactInput.portfolio,
      currentPortfolio: impactInput.portfolio,
      baselineRelationshipAnalysis: impactInput.relationshipAnalysis,
      currentRelationshipAnalysis: impactInput.relationshipAnalysis,
      baselinePortfolioReplay: impactInput.portfolioReplay,
      currentPortfolioReplay: impactInput.portfolioReplay,
      baselinePortfolioCertification: impactInput.portfolioCertification,
      currentPortfolioCertification: impactInput.portfolioCertification,
      baselineRecommendations: impactInput.recommendations,
      currentRecommendations: impactInput.recommendations,
    } satisfies RecommendationDriftFoundationInput);
  }
  return Object.freeze({ ...cachedDriftFoundationInput, ...overrides } satisfies RecommendationDriftFoundationInput);
}

describe("recommendationDriftFoundation", () => {
  it("is deterministic and reproduces drift graph hashes", () => {
    const input = driftFoundationInput();
    const first = sealRecommendationDriftFoundation(input);
    const second = sealRecommendationDriftFoundation(input);
    expect(first).toEqual(second);
    expect(first.result.driftState).toBe("STABLE");
    expect(first.result.driftGraphHash).toHaveLength(64);
  });

  it("keeps drift ordering deterministic", () => {
    const input = driftFoundationInput();
    const reversed = driftFoundationInput({
      baselineRecommendations: Object.freeze([...input.baselineRecommendations].reverse()),
      currentRecommendations: Object.freeze([...input.currentRecommendations].reverse()),
    });
    expect(sealRecommendationDriftFoundation(reversed)).toEqual(sealRecommendationDriftFoundation(input));
    expect(createRecommendationDriftEvidencePath(input, sealRecommendationDriftFoundation(input).drifts)).toEqual(
      createRecommendationDriftEvidencePath(input, sealRecommendationDriftFoundation(input).drifts),
    );
  });

  it("stays STABLE when baseline equals current and creates no drift records", () => {
    const sealed = sealRecommendationDriftFoundation(driftFoundationInput());
    expect(sealed.result.driftState).toBe("STABLE");
    expect(sealed.drifts).toEqual([]);
    expect(sealed.result.driftsCreated).toBe(0);
  });

  it("detects evidence, lineage, governance, replay, and readiness drift reproducibly", () => {
    const base = driftFoundationInput();
    const currentRecommendations = Object.freeze([
      {
        ...base.currentRecommendations[0],
        ledger: {
          ...base.currentRecommendations[0].ledger,
          entry: {
            ...base.currentRecommendations[0].ledger.entry,
            evidenceIds: Object.freeze(["evidence:drifted"]),
            lineageReferences: Object.freeze(["lineage:drifted"]),
          },
        },
        lineage: {
          ...base.currentRecommendations[0].lineage,
          evidencePath: {
            ...base.currentRecommendations[0].lineage.evidencePath,
            lineageReferences: Object.freeze(["lineage:drifted"]),
          },
        },
        governanceReferences: {
          ...base.currentRecommendations[0].governanceReferences,
          governanceReferences: Object.freeze(["gov:drifted"]),
        },
        replayEvidence: {
          ...base.currentRecommendations[0].replayEvidence,
          replayReferences: Object.freeze(["replay:drifted"]),
        },
        reviewPacket: {
          ...base.currentRecommendations[0].reviewPacket,
          result: {
            ...base.currentRecommendations[0].reviewPacket.result,
            packetHash: "z".repeat(64),
          },
        },
      },
      base.currentRecommendations[1],
    ]);
    const drifted = sealRecommendationDriftFoundation({
      ...base,
      currentRecommendations,
    });
    expect(drifted.result.driftState).toBe("DRIFT_DETECTED");
    expect(drifted.result.evidenceDriftsDetected).toBeGreaterThan(0);
    expect(drifted.result.lineageDriftsDetected).toBeGreaterThan(0);
    expect(drifted.result.governanceDriftsDetected).toBeGreaterThan(0);
    expect(drifted.result.replayDriftsDetected).toBeGreaterThan(0);
    expect(drifted.result.readinessDriftsDetected).toBeGreaterThan(0);
  });

  it("detects portfolio, dependency, and impact drift reproducibly", () => {
    const base = driftFoundationInput();
    const drifted = sealRecommendationDriftFoundation({
      ...base,
      currentPortfolio: {
        ...base.currentPortfolio,
        result: {
          ...base.currentPortfolio.result,
          portfolioHash: "p".repeat(64),
        },
      },
      currentDependencyFoundation: {
        ...base.currentDependencyFoundation,
        result: {
          ...base.currentDependencyFoundation.result,
          dependencyGraphHash: "d".repeat(64),
        },
      },
      currentImpactFoundation: {
        ...base.currentImpactFoundation,
        result: {
          ...base.currentImpactFoundation.result,
          impactGraphHash: "i".repeat(64),
        },
      },
    });
    expect(drifted.result.driftState).toBe("DRIFT_DETECTED");
    expect(drifted.result.portfolioDriftsDetected).toBeGreaterThan(0);
    expect(drifted.result.dependencyDriftsDetected).toBeGreaterThan(0);
    expect(drifted.result.impactDriftsDetected).toBeGreaterThan(0);
  });

  it("surfaces missing baseline or current references as OBSERVE", () => {
    const base = driftFoundationInput();
    const missingBaseline = sealRecommendationDriftFoundation({
      ...base,
      baselineRecommendations: Object.freeze([base.baselineRecommendations[0]]),
    });
    const missingCurrent = sealRecommendationDriftFoundation({
      ...base,
      currentRecommendations: Object.freeze([base.currentRecommendations[0]]),
    });
    expect(missingBaseline.result.driftState).toBe("OBSERVE");
    expect(missingCurrent.result.driftState).toBe("OBSERVE");
  });

  it("blocks cross-tenant drift and ownership mismatch", () => {
    const base = driftFoundationInput();
    const crossTenant = sealRecommendationDriftFoundation({
      ...base,
      currentRecommendations: Object.freeze([
        { ...base.currentRecommendations[0], replayEvidence: { ...base.currentRecommendations[0].replayEvidence, tenantId: "tenant-beta" } },
        base.currentRecommendations[1],
      ]),
    });
    const ownershipMismatch = sealRecommendationDriftFoundation({
      ...base,
      currentRecommendations: Object.freeze([
        { ...base.currentRecommendations[0], ownershipEvidence: { ...base.currentRecommendations[0].ownershipEvidence, recommendationId: "recommendation-other" } },
        base.currentRecommendations[1],
      ]),
    });
    expect(crossTenant.result.driftState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_DRIFT_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("fails invalid on governance corruption, replay corruption, execution, mutation, approval, prioritization, repair, and authority expansion", () => {
    const base = driftFoundationInput();
    expect(sealRecommendationDriftFoundation({
      ...base,
      currentRecommendations: Object.freeze([
        { ...base.currentRecommendations[0], governanceCertification: { ...base.currentRecommendations[0].governanceCertification, result: { ...base.currentRecommendations[0].governanceCertification.result, certificationState: "FAIL" } } },
        base.currentRecommendations[1],
      ]),
    }).validation.reasonCodes).toContain("GOVERNANCE_CORRUPTION_DETECTED");
    expect(sealRecommendationDriftFoundation({
      ...base,
      currentImpactReplay: { ...base.currentImpactReplay, result: { ...base.currentImpactReplay.result, replayState: "ESCALATED" } },
    }).validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
    expect(sealRecommendationDriftFoundation({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealRecommendationDriftFoundation({ ...base, driftMutationAttempted: true }).validation.reasonCodes).toContain("DRIFT_MUTATION_DETECTED");
    expect(sealRecommendationDriftFoundation({ ...base, approvalRequested: true }).validation.reasonCodes).toContain("APPROVAL_DETECTED");
    expect(sealRecommendationDriftFoundation({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealRecommendationDriftFoundation({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealRecommendationDriftFoundation({ ...base, repairRequested: true }).validation.reasonCodes).toContain("REPAIR_DETECTED");
    expect(sealRecommendationDriftFoundation({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
