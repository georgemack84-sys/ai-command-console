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
    createdAt: "2026-06-12T00:00:00.000Z",
    nodes,
    edges: [{ edgeId: `edge-${recommendationId}-escalation-governance`, graphId, sourceNodeId: "escalation-anchor", targetNodeId: "governance-anchor", relationshipType: "ESCALATES_TO", tenantId: "tenant-alpha" }],
    lineageReferences: nodes.map((node) => node.lineageReference),
  } satisfies DecisionGraphContractInput);
}

const proposalNodes = (recommendationId: string, graphId: string): readonly ProposalNodeInput[] => [{ proposalId: `proposal-${recommendationId}`, graphId, tenantId: "tenant-alpha", proposalType: "MISSION", lineageReference: `lineage-${recommendationId}-proposal` }];
const governanceNodes = (recommendationId: string, graphId: string): readonly GovernanceNodeInput[] => [{ governanceId: `governance-${recommendationId}`, graphId, tenantId: "tenant-alpha", governanceType: "POLICY", lineageReference: `lineage-${recommendationId}-governance` }];
const escalationNodes = (recommendationId: string, graphId: string): readonly EscalationNodeInput[] => [{ escalationId: `escalation-${recommendationId}`, graphId, tenantId: "tenant-alpha", escalationType: "REVIEW", lineageReference: `lineage-${recommendationId}-escalation` }];

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
  const escalation = sealEscalationIntelligence({ request: buildEscalationIntelligenceRequest({ certification: graphCertification, verification: verificationGraph, inspection: inspectionGraph, topology, tenantId: "tenant-alpha", graphVersion: "decision-graph/v1" } satisfies Omit<EscalationIntelligenceInput, "request"> & { escalationContext?: never; tenantId?: string; graphVersion?: string }), certification: graphCertification, verification: verificationGraph, inspection: inspectionGraph, topology });
  const escalationCertification = { ...graphCertification, result: { certificationHash: graphCertification.result.certificationHash, certificationState: "PASS", graphId: graphCertification.result.graphId, ownershipCertified: graphCertification.result.ownershipCertified, lineageCertified: graphCertification.result.lineageCertified, tenantIsolationVerified: graphCertification.result.tenantIsolationVerified, replayCertified: graphCertification.result.replayDeterministic, authorityBounded: graphCertification.result.authorityBounded, deterministic: graphCertification.result.deterministic }, sealed: true as const } as RecommendationLedgerInput["escalationCertification"];
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
  const alpha = buildBundle("recommendation-alpha", "graph-512e-alpha");
  const beta = buildBundle("recommendation-beta", "graph-512e-beta");
  return Object.freeze({
    request: buildRecommendationPortfolioRequest({ portfolioId: "portfolio-alpha", tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], portfolioScope: "FULL", graphVersion: "decision-graph/v1" }),
    recommendations: Object.freeze([beta, alpha]),
    ...overrides,
  } satisfies RecommendationPortfolioInput);
}

function relationshipInput(source: RecommendationPortfolioInput): PortfolioRelationshipAnalysisInput {
  const portfolio = sealRecommendationPortfolio(source);
  return Object.freeze({ request: buildPortfolioRelationshipAnalysisRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", analysisScope: "FULL", graphVersion: "decision-graph/v1" }), portfolio, recommendations: source.recommendations } satisfies PortfolioRelationshipAnalysisInput);
}

function portfolioObservabilityInput(source: RecommendationPortfolioInput): PortfolioObservabilityInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  return Object.freeze({ request: buildPortfolioObservabilityRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", observabilityScope: "FULL", graphVersion: "decision-graph/v1" }), portfolio, relationshipAnalysis, recommendations: source.recommendations } satisfies PortfolioObservabilityInput);
}

function portfolioReplayInput(source: RecommendationPortfolioInput): PortfolioReplayInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  const observability = sealPortfolioObservability(portfolioObservabilityInput(source));
  return Object.freeze({ request: buildPortfolioReplayRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", replayScope: "FULL", replayVersion: "portfolio-replay/v1", graphVersion: "decision-graph/v1" }), portfolio, relationshipAnalysis, observability, recommendations: source.recommendations } satisfies PortfolioReplayInput);
}

function certificationInput(source: RecommendationPortfolioInput): PortfolioCertificationInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  const observability = sealPortfolioObservability(portfolioObservabilityInput(source));
  const replay = sealPortfolioReplay(portfolioReplayInput(source));
  return Object.freeze({ request: buildPortfolioCertificationRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", certificationScope: "FULL", graphVersion: "decision-graph/v1" }), portfolio, relationshipAnalysis, observability, replay, recommendations: source.recommendations } satisfies PortfolioCertificationInput);
}

function foundationInput(source: RecommendationPortfolioInput): RecommendationDependencyFoundationInput {
  return Object.freeze({
    request: buildRecommendationDependencyFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], dependencyScope: "FULL", graphVersion: "decision-graph/v1" }),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    observability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    replay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(certificationInput(source)),
    recommendations: source.recommendations,
  } satisfies RecommendationDependencyFoundationInput);
}

function analysisInput(source: RecommendationPortfolioInput): DependencyAnalysisInput {
  return Object.freeze({
    request: buildDependencyAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], analysisScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(foundationInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    observability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    replay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(certificationInput(source)),
    recommendations: source.recommendations,
  } satisfies DependencyAnalysisInput);
}

function dependencyObservabilityInput(source: RecommendationPortfolioInput): DependencyObservabilityInput {
  return Object.freeze({
    request: buildDependencyObservabilityRequest({ tenantId: "tenant-alpha", observabilityScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(foundationInput(source)),
    analysis: sealDependencyAnalysis(analysisInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    observability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    replay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(certificationInput(source)),
    recommendations: source.recommendations,
  } satisfies DependencyObservabilityInput);
}

function dependencyReplayInput(source: RecommendationPortfolioInput): DependencyReplayInput {
  return Object.freeze({
    request: buildDependencyReplayRequest({ tenantId: "tenant-alpha", replayScope: "FULL", replayVersion: "dependency-replay/v1", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(foundationInput(source)),
    analysis: sealDependencyAnalysis(analysisInput(source)),
    observability: sealDependencyObservability(dependencyObservabilityInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    portfolioObservability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(certificationInput(source)),
    recommendations: source.recommendations,
  } satisfies DependencyReplayInput);
}

function dependencyCertificationInput(overrides: Partial<DependencyCertificationInput> = {}): DependencyCertificationInput {
  const source = portfolioInput();
  return Object.freeze({
    request: buildDependencyCertificationRequest({ tenantId: "tenant-alpha", certificationScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(foundationInput(source)),
    analysis: sealDependencyAnalysis(analysisInput(source)),
    observability: sealDependencyObservability(dependencyObservabilityInput(source)),
    replay: sealDependencyReplay(dependencyReplayInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    portfolioObservability: sealPortfolioObservability(portfolioObservabilityInput(source)),
    portfolioReplay: sealPortfolioReplay(portfolioReplayInput(source)),
    certification: sealPortfolioCertification(certificationInput(source)),
    recommendations: source.recommendations,
    ...overrides,
  } satisfies DependencyCertificationInput);
}

describe("dependencyCertificationGate", () => {
  it("is deterministic and reproduces certification hashes", () => {
    const input = dependencyCertificationInput();
    const first = sealDependencyCertification(input);
    const second = sealDependencyCertification(input);
    expect(first).toEqual(second);
    expect(first.result.certificationState).toBe("PASS");
    expect(first.result.certificationHash).toHaveLength(64);
  });

  it("certifies integrity, continuity, replay, governance, and observability reproducibly", () => {
    const sealed = sealDependencyCertification(dependencyCertificationInput());
    expect(sealed.result.integrityCertified).toBe(true);
    expect(sealed.result.continuityCertified).toBe(true);
    expect(sealed.result.replayCertified).toBe(true);
    expect(sealed.result.governanceCertified).toBe(true);
    expect(sealed.result.observabilityCertified).toBe(true);
  });

  it("surfaces replay degradation and observability incompleteness as CONDITIONAL_PASS", () => {
    const base = dependencyCertificationInput();
    const replayLimited = sealDependencyCertification({
      ...base,
      replay: { ...base.replay, result: { ...base.replay.result, replayState: "LIMITED" } },
    });
    const observabilityLimited = sealDependencyCertification({
      ...base,
      observability: { ...base.observability, result: { ...base.observability.result, observabilityState: "LIMITED", dependencyReplayVisible: false } },
    });
    expect(replayLimited.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(replayLimited.validation.reasonCodes).toContain("REPLAY_DEGRADED");
    expect(observabilityLimited.result.certificationState).toBe("CONDITIONAL_PASS");
    expect(observabilityLimited.validation.reasonCodes).toContain("OBSERVABILITY_INCOMPLETE");
  });

  it("fails on integrity, continuity, lineage, replay, or governance corruption", () => {
    const base = dependencyCertificationInput();
    const brokenIntegrity = sealDependencyCertification({
      ...base,
      foundation: { ...base.foundation, result: { ...base.foundation.result, dependencyState: "INVALID" } },
    });
    const brokenContinuity = sealDependencyCertification({
      ...base,
      analysis: { ...base.analysis, result: { ...base.analysis.result, dependencyContinuityVerified: false } },
    });
    const brokenLineage = sealDependencyCertification({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], lineage: { ...base.recommendations[0].lineage, result: { ...base.recommendations[0].lineage.result, reconstructionState: "INVALID", lineageIntegrity: false } } },
        base.recommendations[1],
      ]),
    });
    const brokenReplay = sealDependencyCertification({
      ...base,
      replay: { ...base.replay, result: { ...base.replay.result, replayState: "INVALID" } },
    });
    const brokenGovernance = sealDependencyCertification({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], governanceCertification: { ...base.recommendations[0].governanceCertification, result: { ...base.recommendations[0].governanceCertification.result, certificationState: "FAIL" } } },
        base.recommendations[1],
      ]),
    });
    expect(brokenIntegrity.result.certificationState).toBe("FAIL");
    expect(brokenIntegrity.validation.reasonCodes).toContain("INTEGRITY_BROKEN");
    expect(brokenContinuity.validation.reasonCodes).toContain("CONTINUITY_BROKEN");
    expect(brokenLineage.validation.reasonCodes).toContain("LINEAGE_CORRUPTION_DETECTED");
    expect(brokenReplay.validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
    expect(brokenGovernance.validation.reasonCodes).toContain("GOVERNANCE_CORRUPTION_DETECTED");
  });

  it("blocks cross-tenant certification and ownership mismatch", () => {
    const base = dependencyCertificationInput();
    const crossTenant = sealDependencyCertification({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" } },
        base.recommendations[1],
      ]),
    });
    const ownershipMismatch = sealDependencyCertification({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" } },
        base.recommendations[1],
      ]),
    });
    expect(crossTenant.result.certificationState).toBe("FAIL");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_CERTIFICATION_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("blocks execution, mutation, ranking, prioritization, approval, and workflow routing", () => {
    const base = dependencyCertificationInput();
    expect(sealDependencyCertification({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDependencyCertification({ ...base, certificationMutationAttempted: true }).validation.reasonCodes).toContain("CERTIFICATION_MUTATION_DETECTED");
    expect(sealDependencyCertification({ ...base, recommendationRankingRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_RANKING_DETECTED");
    expect(sealDependencyCertification({ ...base, recommendationPrioritizationRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_PRIORITIZATION_DETECTED");
    expect(sealDependencyCertification({ ...base, recommendationApprovalRequested: true }).validation.reasonCodes).toContain("RECOMMENDATION_APPROVAL_DETECTED");
    expect(sealDependencyCertification({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
  });

  it("blocks authority expansion", () => {
    const base = dependencyCertificationInput();
    const expanded = sealDependencyCertification({ ...base, authorityExpansionDetected: true });
    expect(expanded.result.certificationState).toBe("FAIL");
    expect(expanded.validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
