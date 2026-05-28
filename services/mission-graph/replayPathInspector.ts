import type { MissionGraphEdge, MissionGraphNode, ReplayPath } from "@/types/mission-graph";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import { hashMissionGraphValue } from "./graphHasher";

function buildNodeId(nodeType: MissionGraphNode["nodeType"], missionId: string, sourceReferenceId: string): string {
  return hashMissionGraphValue("mission-graph-node", { nodeType, missionId, sourceReferenceId });
}

function buildEdgeId(sourceNodeId: string, targetNodeId: string, relationshipType: MissionGraphEdge["relationshipType"]): string {
  return hashMissionGraphValue("mission-graph-edge", { sourceNodeId, targetNodeId, relationshipType });
}

export function inspectReplayPaths(input: {
  missionId: string;
  coordinationId: string;
  proposal: ProposalRecord;
  escalationRecord: GovernanceAwareEscalationRecord;
  createdAt: string;
}): Readonly<{
  nodes: readonly MissionGraphNode[];
  edges: readonly MissionGraphEdge[];
  replayPaths: readonly ReplayPath[];
}> {
  const replayNodeId = buildNodeId("replay", input.missionId, input.proposal.replayBinding.reconstructionHash);
  const snapshotNodeId = buildNodeId("snapshot", input.missionId, input.proposal.replayBinding.snapshotLineageHash);
  const proposalNodeId = buildNodeId("proposal", input.missionId, input.proposal.proposalId);
  const nodes = Object.freeze([
    Object.freeze({
      nodeId: replayNodeId,
      nodeType: "replay" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.proposal.replayBinding.reconstructionHash,
    }),
    Object.freeze({
      nodeId: snapshotNodeId,
      nodeType: "snapshot" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.proposal.replayBinding.snapshotLineageHash,
    }),
  ]);
  const edges = Object.freeze([
    Object.freeze({
      edgeId: buildEdgeId(replayNodeId, proposalNodeId, "replayed_from"),
      sourceNodeId: replayNodeId,
      targetNodeId: proposalNodeId,
      relationshipType: "replayed_from" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
    Object.freeze({
      edgeId: buildEdgeId(snapshotNodeId, replayNodeId, "snapshot_of"),
      sourceNodeId: snapshotNodeId,
      targetNodeId: replayNodeId,
      relationshipType: "snapshot_of" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
  ]);
  const replayPaths = Object.freeze([
    Object.freeze({
      pathId: hashMissionGraphValue("mission-graph-replay-path", {
        coordinationId: input.coordinationId,
        replayGraphHash: input.escalationRecord.replayGraph.graphHash,
      }),
      coordinationId: input.coordinationId,
      nodeIds: Object.freeze([snapshotNodeId, replayNodeId, proposalNodeId]),
      sourceHashes: Object.freeze([
        input.proposal.replayBinding.reconstructionHash,
        input.proposal.replayBinding.snapshotLineageHash,
        input.escalationRecord.replayGraph.graphHash,
      ]),
      replaySafe: true as const,
      historicalOnly: true as const,
      createdAt: input.createdAt,
      pathHash: hashMissionGraphValue("mission-graph-replay-path-hash", {
        coordinationId: input.coordinationId,
        nodeIds: [snapshotNodeId, replayNodeId, proposalNodeId],
      }),
    }),
  ]);
  return Object.freeze({ nodes, edges, replayPaths });
}
