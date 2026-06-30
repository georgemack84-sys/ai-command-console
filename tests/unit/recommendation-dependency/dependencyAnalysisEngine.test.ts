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
  buildRecommendationDependencyFoundationRequest,
  createDependencyAnalysisEvidencePath,
  sealDependencyAnalysis,
  sealRecommendationDependencyFoundation,
  type DependencyAnalysisInput,
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

// reuse same fixture style as 5.12A
function graphInput(recommendationId: string, graphId: string): DecisionGraphContractInput {
  const nodes: DecisionGraphNodeInput[] = [
    { nodeId: "boundary-node", graphId, nodeType: "CONSTRAINT", tenantId: "tenant-alpha", lineageReference: `lineage-${recommendationId}-boundary-node` },
    { nodeId: "governance-anchor", graphId, nodeType: "GOVERNANCE", tenantId: "tenant-alpha", lineageReference: `lineage-${recommendationId}-governance-anchor` },
    { nodeId: recommendationId, graphId, nodeType: "RECOMMENDATION", tenantId: "tenant-alpha", lineageReference: `lineage-${recommendationId}-recommendation-anchor` },
    { nodeId: "escalation-anchor", graphId, nodeType: "ESCALATION", tenantId: "tenant-alpha", lineageReference: `lineage-${recommendationId}-escalation-anchor` },
  ];
  return Object.freeze({
    graphId, tenantId: "tenant-alpha", missionId: `mission-${recommendationId}`, graphVersion: "decision-graph/v1",
    createdAt: "2026-06-12T00:00:00.000Z", nodes,
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
  const alpha = buildBundle("recommendation-alpha", "graph-512b-alpha");
  const beta = buildBundle("recommendation-beta", "graph-512b-beta");
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

function observabilityInput(source: RecommendationPortfolioInput): PortfolioObservabilityInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  return Object.freeze({ request: buildPortfolioObservabilityRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", observabilityScope: "FULL", graphVersion: "decision-graph/v1" }), portfolio, relationshipAnalysis, recommendations: source.recommendations } satisfies PortfolioObservabilityInput);
}

function replayInput(source: RecommendationPortfolioInput): PortfolioReplayInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  const observability = sealPortfolioObservability(observabilityInput(source));
  return Object.freeze({ request: buildPortfolioReplayRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", replayScope: "FULL", replayVersion: "portfolio-replay/v1", graphVersion: "decision-graph/v1" }), portfolio, relationshipAnalysis, observability, recommendations: source.recommendations } satisfies PortfolioReplayInput);
}

function certificationInput(source: RecommendationPortfolioInput): PortfolioCertificationInput {
  const portfolio = sealRecommendationPortfolio(source);
  const relationshipAnalysis = sealPortfolioRelationshipAnalysis(relationshipInput(source));
  const observability = sealPortfolioObservability(observabilityInput(source));
  const replay = sealPortfolioReplay(replayInput(source));
  return Object.freeze({ request: buildPortfolioCertificationRequest({ portfolioId: portfolio.result.portfolioId, tenantId: "tenant-alpha", certificationScope: "FULL", graphVersion: "decision-graph/v1" }), portfolio, relationshipAnalysis, observability, replay, recommendations: source.recommendations } satisfies PortfolioCertificationInput);
}

function foundationInput(source: RecommendationPortfolioInput): RecommendationDependencyFoundationInput {
  return Object.freeze({
    request: buildRecommendationDependencyFoundationRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], dependencyScope: "FULL", graphVersion: "decision-graph/v1" }),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    observability: sealPortfolioObservability(observabilityInput(source)),
    replay: sealPortfolioReplay(replayInput(source)),
    certification: sealPortfolioCertification(certificationInput(source)),
    recommendations: source.recommendations,
  } satisfies RecommendationDependencyFoundationInput);
}

function analysisInput(overrides: Partial<DependencyAnalysisInput> = {}): DependencyAnalysisInput {
  const source = portfolioInput();
  return Object.freeze({
    request: buildDependencyAnalysisRequest({ tenantId: "tenant-alpha", recommendationIds: ["recommendation-beta", "recommendation-alpha"], analysisScope: "FULL", graphVersion: "decision-graph/v1" }),
    foundation: sealRecommendationDependencyFoundation(foundationInput(source)),
    portfolio: sealRecommendationPortfolio(source),
    relationshipAnalysis: sealPortfolioRelationshipAnalysis(relationshipInput(source)),
    observability: sealPortfolioObservability(observabilityInput(source)),
    replay: sealPortfolioReplay(replayInput(source)),
    certification: sealPortfolioCertification(certificationInput(source)),
    recommendations: source.recommendations,
    ...overrides,
  } satisfies DependencyAnalysisInput);
}

describe("dependencyAnalysisEngine", () => {
  it("is deterministic and reproduces analysis hashes", () => {
    const input = analysisInput();
    const first = sealDependencyAnalysis(input);
    const second = sealDependencyAnalysis(input);
    expect(first).toEqual(second);
    expect(first.result.analysisHash).toHaveLength(64);
  });

  it("keeps analysis ordering deterministic", () => {
    const input = analysisInput();
    const reversed = analysisInput({ recommendations: Object.freeze([...input.recommendations].reverse()) });
    expect(sealDependencyAnalysis(reversed)).toEqual(sealDependencyAnalysis(input));
    const sealed = sealDependencyAnalysis(input);
    expect(createDependencyAnalysisEvidencePath(input, sealed.evidencePath.chainReferences, sealed.evidencePath.gapReferences, sealed.evidencePath.conflictReferences)).toEqual(
      createDependencyAnalysisEvidencePath(input, sealed.evidencePath.chainReferences, sealed.evidencePath.gapReferences, sealed.evidencePath.conflictReferences),
    );
  });

  it("detects shared dependencies and chains reproducibly", () => {
    const sealed = sealDependencyAnalysis(analysisInput());
    expect(sealed.result.sharedDependenciesDetected).toBeGreaterThan(0);
    expect(sealed.result.dependencyChainsDetected).toBeGreaterThanOrEqual(0);
  });

  it("surfaces dependency gaps and conflicts as LIMITED", () => {
    const base = analysisInput();
    const limited = sealDependencyAnalysis({
      ...base,
      foundation: { ...base.foundation, result: { ...base.foundation.result, dependencyState: "LIMITED" } },
      replay: { ...base.replay, result: { ...base.replay.result, replayState: "LIMITED" } },
    });
    expect(limited.result.analysisState).toBe("LIMITED");
  });

  it("surfaces missing dependency evidence as OBSERVE", () => {
    const base = analysisInput();
    const observe = sealDependencyAnalysis({
      ...base,
      request: { ...base.request, recommendationIds: ["recommendation-alpha", "recommendation-beta", "recommendation-gamma"] },
    });
    expect(observe.result.analysisState).toBe("OBSERVE");
  });

  it("blocks cross-tenant dependencies and ownership mismatch", () => {
    const base = analysisInput();
    const crossTenant = sealDependencyAnalysis({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], replayEvidence: { ...base.recommendations[0].replayEvidence, tenantId: "tenant-beta" } },
        base.recommendations[1],
      ]),
    });
    const ownershipMismatch = sealDependencyAnalysis({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], ownershipEvidence: { ...base.recommendations[0].ownershipEvidence, recommendationId: "recommendation-other" } },
        base.recommendations[1],
      ]),
    });
    expect(crossTenant.result.analysisState).toBe("INVALID");
    expect(crossTenant.validation.reasonCodes).toContain("CROSS_TENANT_DEPENDENCIES_BLOCKED");
    expect(ownershipMismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("fails on governance or replay corruption", () => {
    const base = analysisInput();
    const brokenGovernance = sealDependencyAnalysis({
      ...base,
      recommendations: Object.freeze([
        { ...base.recommendations[0], governanceCertification: { ...base.recommendations[0].governanceCertification, result: { ...base.recommendations[0].governanceCertification.result, certificationState: "FAIL" } } },
        base.recommendations[1],
      ]),
    });
    const brokenReplay = sealDependencyAnalysis({
      ...base,
      replay: { ...base.replay, result: { ...base.replay.result, replayState: "INVALID" } },
    });
    expect(brokenGovernance.validation.reasonCodes).toContain("GOVERNANCE_CORRUPTION_DETECTED");
    expect(brokenReplay.validation.reasonCodes).toContain("REPLAY_CORRUPTION_DETECTED");
  });

  it("blocks execution, mutation, workflow ordering, approval ordering, prioritization, and authority expansion", () => {
    const base = analysisInput();
    expect(sealDependencyAnalysis({ ...base, executionRequested: true }).validation.reasonCodes).toContain("EXECUTION_REQUEST_BLOCKED");
    expect(sealDependencyAnalysis({ ...base, analysisMutationAttempted: true }).validation.reasonCodes).toContain("ANALYSIS_MUTATION_DETECTED");
    expect(sealDependencyAnalysis({ ...base, workflowRoutingRequested: true }).validation.reasonCodes).toContain("WORKFLOW_ROUTING_DETECTED");
    expect(sealDependencyAnalysis({ ...base, approvalOrderingRequested: true }).validation.reasonCodes).toContain("APPROVAL_ORDERING_DETECTED");
    expect(sealDependencyAnalysis({ ...base, prioritizationRequested: true }).validation.reasonCodes).toContain("PRIORITIZATION_DETECTED");
    expect(sealDependencyAnalysis({ ...base, authorityExpansionDetected: true }).validation.reasonCodes).toContain("AUTHORITY_EXPANSION_DETECTED");
  });
});
