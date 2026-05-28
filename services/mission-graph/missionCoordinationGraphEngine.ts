import type { MissionGraphInput, MissionGraphLedgerEntry, MissionGraphSnapshot, MissionGraphNode, MissionGraphEdge } from "@/types/mission-graph";
import { buildMissionGraphAuthorityContract, createMissionGraphError, enforceMissionGraphBoundary } from "./graphBoundaryEnforcer";
import { traceProposalLineage } from "./proposalLineageTracer";
import { traceEscalationLineage } from "./escalationLineageTracer";
import { buildGovernanceDependencyGraph } from "./governanceDependencyGraph";
import { buildConfidenceEvolution } from "./confidenceEvolutionEngine";
import { inspectReplayPaths } from "./replayPathInspector";
import { buildLifecycleTopology } from "./lifecycleTopologyEngine";
import { reconstructSnapshotLineage } from "./snapshotLineageReconstructor";
import { validateMissionGraphConsistency } from "./graphConsistencyValidator";
import { appendMissionGraphLedger } from "./graphAppendOnlyLedger";
import { hashMissionGraphValue } from "./graphHasher";
import { inspectMissionGraphDeterminism } from "./graphDeterminismInspector";

function dedupeNodes(nodes: readonly MissionGraphNode[]): readonly MissionGraphNode[] {
  const map = new Map<string, MissionGraphNode>();
  for (const node of nodes) {
    map.set(node.nodeId, node);
  }
  return Object.freeze(Array.from(map.values()).sort((left, right) => left.nodeId.localeCompare(right.nodeId)));
}

function dedupeEdges(edges: readonly MissionGraphEdge[]): readonly MissionGraphEdge[] {
  const map = new Map<string, MissionGraphEdge>();
  for (const edge of edges) {
    map.set(edge.edgeId, edge);
  }
  return Object.freeze(Array.from(map.values()).sort((left, right) => left.edgeId.localeCompare(right.edgeId)));
}

export function buildMissionCoordinationGraph(input: MissionGraphInput): MissionGraphSnapshot {
  const authorityContract = buildMissionGraphAuthorityContract();
  const boundary = enforceMissionGraphBoundary({
    authorityContract,
    metadata: input.metadata,
  });
  const proposalLineage = traceProposalLineage({
    missionId: input.missionId,
    proposal: input.proposal,
    lifecycle: input.lifecycle,
    createdAt: input.createdAt,
  });
  const escalationLineage = traceEscalationLineage({
    missionId: input.missionId,
    escalationRecord: input.escalationRecord,
    proposalId: input.proposal.proposalId,
    createdAt: input.createdAt,
  });
  const governanceDependencies = buildGovernanceDependencyGraph({
    missionId: input.missionId,
    proposal: input.proposal,
    lifecycle: input.lifecycle,
    freshnessEvaluation: input.freshnessEvaluation,
    escalationRecord: input.escalationRecord,
    createdAt: input.createdAt,
  });
  const confidenceEvolution = buildConfidenceEvolution({
    coordinationId: input.coordinationRecord.coordinationId,
    freshnessEvaluation: input.freshnessEvaluation,
    escalationRecord: input.escalationRecord,
    createdAt: input.createdAt,
  });
  const replayInspection = inspectReplayPaths({
    missionId: input.missionId,
    coordinationId: input.coordinationRecord.coordinationId,
    proposal: input.proposal,
    escalationRecord: input.escalationRecord,
    createdAt: input.createdAt,
  });
  const lifecycleTopology = buildLifecycleTopology({
    proposalId: input.proposal.proposalId,
    lifecycle: input.lifecycle,
    createdAt: input.createdAt,
  });
  const snapshotLineage = reconstructSnapshotLineage({
    proposal: input.proposal,
    lifecycle: input.lifecycle,
    createdAt: input.createdAt,
  });
  const nodes = dedupeNodes([
    ...proposalLineage.nodes,
    ...escalationLineage.nodes,
    ...governanceDependencies.nodes,
    ...replayInspection.nodes,
  ]);
  const edges = dedupeEdges([
    ...proposalLineage.edges,
    ...escalationLineage.edges,
    ...governanceDependencies.edges,
    ...replayInspection.edges,
  ]);
  const consistencyErrors = validateMissionGraphConsistency({
    nodes,
    edges,
    replayPaths: replayInspection.replayPaths,
    governanceValidated:
      input.escalationRecord.decision.governanceValidated
      && input.freshnessEvaluation.state.governanceCompatibility === "compatible",
    replaySafe:
      input.escalationRecord.decision.replaySafe
      && input.freshnessEvaluation.replayRevalidation.replaySafe
      && input.proposal.replayBinding.valid,
    lifecycleEntries: input.lifecycle.lineage.entries.length,
    escalationEntries: input.escalationRecord.lineage.entries.length,
  });
  const replayErrors =
    input.freshnessEvaluation.state.replayIntegrity !== "verified"
      ? [createMissionGraphError(
        "MISSION_GRAPH_REPLAY_AMBIGUITY",
        "Mission graph replay visibility cannot continue from non-verified replay integrity.",
        "freshnessEvaluation.state.replayIntegrity",
      )]
      : [];
  const snapshotId = hashMissionGraphValue("mission-graph-snapshot-id", {
    missionId: input.missionId,
    coordinationId: input.coordinationRecord.coordinationId,
    createdAt: input.createdAt,
  });
  const warnings = Object.freeze([
    ...input.proposal.warnings,
    ...input.lifecycle.warnings,
    ...input.freshnessEvaluation.warnings,
    ...input.escalationRecord.warnings,
    "Mission coordination graph remains visibility-only and never confers authority.",
  ]);
  const errors = Object.freeze([
    ...boundary.errors,
    ...consistencyErrors,
    ...replayErrors,
  ]);
  const graphHash = hashMissionGraphValue("mission-coordination-graph", {
    missionId: input.missionId,
    nodes,
    edges,
    proposalLineages: [proposalLineage.lineage],
    escalationLineages: [escalationLineage.lineage],
    governanceDependencies: governanceDependencies.dependencies,
    confidenceEvolution,
    replayPaths: replayInspection.replayPaths,
    lifecycleTopology,
    snapshotLineage,
    visibilityState: errors.length > 0 ? "frozen" : "visible",
  });
  const ledgerEntry: MissionGraphLedgerEntry = Object.freeze({
    entryId: hashMissionGraphValue("mission-graph-ledger-entry", { snapshotId, graphHash }),
    snapshotId,
    graphHash,
    createdAt: input.createdAt,
  });
  const ledger = appendMissionGraphLedger({
    existing: input.existingLedger,
    entry: ledgerEntry,
  });
  const snapshot: MissionGraphSnapshot = Object.freeze({
    snapshotId,
    missionId: input.missionId,
    nodes,
    edges,
    proposalLineages: Object.freeze([proposalLineage.lineage]),
    escalationLineages: Object.freeze([escalationLineage.lineage]),
    governanceDependencies: governanceDependencies.dependencies,
    confidenceEvolution,
    replayPaths: replayInspection.replayPaths,
    lifecycleTopology,
    snapshotLineage,
    authorityContract,
    visibilityState: errors.length > 0 ? "frozen" : "visible",
    governanceEscalationEvidence: Object.freeze([
      ...boundary.governanceEscalationEvidence,
      ...errors.map((error) => error.code),
    ]),
    warnings,
    errors,
    ledger,
    createdAt: input.createdAt,
    graphHash,
    derivedOnly: true as const,
  });
  const determinismErrors = inspectMissionGraphDeterminism(snapshot);
  return Object.freeze({
    ...snapshot,
    errors: Object.freeze([...snapshot.errors, ...determinismErrors]),
    visibilityState: snapshot.errors.length + determinismErrors.length > 0 ? "frozen" : snapshot.visibilityState,
  });
}
