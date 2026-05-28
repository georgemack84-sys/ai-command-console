import type { MissionGraphEdge, MissionGraphNode, EscalationLineage } from "@/types/mission-graph";
import type { GovernanceAwareEscalationRecord } from "@/types/escalation";
import { hashMissionGraphValue } from "./graphHasher";

function buildNodeId(nodeType: MissionGraphNode["nodeType"], missionId: string, sourceReferenceId: string): string {
  return hashMissionGraphValue("mission-graph-node", { nodeType, missionId, sourceReferenceId });
}

function buildEdgeId(sourceNodeId: string, targetNodeId: string, relationshipType: MissionGraphEdge["relationshipType"]): string {
  return hashMissionGraphValue("mission-graph-edge", { sourceNodeId, targetNodeId, relationshipType });
}

export function traceEscalationLineage(input: {
  missionId: string;
  escalationRecord: GovernanceAwareEscalationRecord;
  proposalId: string;
  createdAt: string;
}): Readonly<{
  nodes: readonly MissionGraphNode[];
  edges: readonly MissionGraphEdge[];
  lineage: EscalationLineage;
}> {
  const escalationNodeId = buildNodeId("escalation", input.missionId, input.escalationRecord.decision.escalationId);
  const confidenceNodeId = buildNodeId("confidence", input.missionId, input.escalationRecord.confidenceProfile.profileId);
  const proposalNodeId = buildNodeId("proposal", input.missionId, input.proposalId);
  const nodes = Object.freeze([
    Object.freeze({
      nodeId: escalationNodeId,
      nodeType: "escalation" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.escalationRecord.decision.escalationId,
    }),
    Object.freeze({
      nodeId: confidenceNodeId,
      nodeType: "confidence" as const,
      missionId: input.missionId,
      createdAt: input.createdAt,
      replaySafe: true as const,
      advisoryOnly: true as const,
      sourceReferenceId: input.escalationRecord.confidenceProfile.profileId,
    }),
  ]);
  const edges = Object.freeze([
    Object.freeze({
      edgeId: buildEdgeId(escalationNodeId, confidenceNodeId, "triggered_by"),
      sourceNodeId: escalationNodeId,
      targetNodeId: confidenceNodeId,
      relationshipType: "triggered_by" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
    Object.freeze({
      edgeId: buildEdgeId(escalationNodeId, proposalNodeId, "escalated_from"),
      sourceNodeId: escalationNodeId,
      targetNodeId: proposalNodeId,
      relationshipType: "escalated_from" as const,
      replayDeterministic: true as const,
      createdAt: input.createdAt,
    }),
  ]);
  const lineage: EscalationLineage = Object.freeze({
    lineageId: hashMissionGraphValue("escalation-lineage-id", {
      escalationId: input.escalationRecord.decision.escalationId,
      coordinationId: input.escalationRecord.decision.coordinationId,
    }),
    coordinationId: input.escalationRecord.decision.coordinationId,
    escalationId: input.escalationRecord.decision.escalationId,
    state: input.escalationRecord.decision.resultingState,
    severity: input.escalationRecord.decision.severity,
    nodeIds: Object.freeze([
      escalationNodeId,
      confidenceNodeId,
    ]),
    edgeIds: Object.freeze(edges.map((edge) => edge.edgeId)),
    lineageHash: hashMissionGraphValue("escalation-lineage", {
      escalationId: input.escalationRecord.decision.escalationId,
      state: input.escalationRecord.decision.resultingState,
      severity: input.escalationRecord.decision.severity,
    }),
  });
  return Object.freeze({ nodes, edges, lineage });
}
