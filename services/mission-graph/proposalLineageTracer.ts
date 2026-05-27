import type { MissionGraphEdge, MissionGraphNode, ProposalLineage } from "@/types/mission-graph";
import type { ProposalRecord } from "@/types/proposal-lifecycle-engine";
import type { LifecycleComputation } from "@/types/lifecycle";
import { hashMissionGraphValue } from "./graphHasher";

function buildNodeId(nodeType: MissionGraphNode["nodeType"], missionId: string, sourceReferenceId: string): string {
  return hashMissionGraphValue("mission-graph-node", { nodeType, missionId, sourceReferenceId });
}

function buildEdgeId(sourceNodeId: string, targetNodeId: string, relationshipType: MissionGraphEdge["relationshipType"]): string {
  return hashMissionGraphValue("mission-graph-edge", { sourceNodeId, targetNodeId, relationshipType });
}

export function traceProposalLineage(input: {
  missionId: string;
  proposal: ProposalRecord;
  lifecycle: LifecycleComputation;
  createdAt: string;
}): Readonly<{
  nodes: readonly MissionGraphNode[];
  edges: readonly MissionGraphEdge[];
  lineage: ProposalLineage;
}> {
  const proposalNodeId = buildNodeId("proposal", input.missionId, input.proposal.proposalId);
  const approvalNodeId = buildNodeId("approval", input.missionId, input.proposal.approval.approvalId);
  const lifecycleNodeId = buildNodeId("lifecycle", input.missionId, input.lifecycle.record.transitionId);
  const nodes = Object.freeze([
    Object.freeze({
      nodeId: proposalNodeId,
      nodeType: "proposal" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.proposal.proposalId,
    }),
    Object.freeze({
      nodeId: approvalNodeId,
      nodeType: "approval" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.proposal.approval.approvalId,
    }),
    Object.freeze({
      nodeId: lifecycleNodeId,
      nodeType: "lifecycle" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.lifecycle.record.transitionId,
    }),
  ]);
  const edges = Object.freeze([
    Object.freeze({
      edgeId: buildEdgeId(proposalNodeId, approvalNodeId, "validated_by"),
      sourceNodeId: proposalNodeId,
      targetNodeId: approvalNodeId,
      relationshipType: "validated_by" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
    Object.freeze({
      edgeId: buildEdgeId(lifecycleNodeId, proposalNodeId, "derived_from"),
      sourceNodeId: lifecycleNodeId,
      targetNodeId: proposalNodeId,
      relationshipType: "derived_from" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
  ]);
  const lineage: ProposalLineage = Object.freeze({
    lineageId: hashMissionGraphValue("proposal-lineage-id", {
      proposalId: input.proposal.proposalId,
      transitionId: input.lifecycle.record.transitionId,
    }),
    proposalId: input.proposal.proposalId,
    nodeIds: Object.freeze(nodes.map((node) => node.nodeId)),
    edgeIds: Object.freeze(edges.map((edge) => edge.edgeId)),
    proposalHash: input.proposal.proposalHash,
    lifecycleHash: input.lifecycle.record.lifecycleHash,
    lineageHash: hashMissionGraphValue("proposal-lineage", {
      proposalId: input.proposal.proposalId,
      nodeIds: nodes.map((node) => node.nodeId),
      edgeIds: edges.map((edge) => edge.edgeId),
    }),
  });
  return Object.freeze({ nodes, edges, lineage });
}
