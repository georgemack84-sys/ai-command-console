import type {
  RecommendationLineageEdge,
  RecommendationLineageGraph,
  RecommendationLineageInput,
  RecommendationLineageNode,
} from "./recommendationLineageStateTypes";
import { hashRecommendationLineageValue } from "./lineageGraphHasher";

export function buildLineageGraph(input: RecommendationLineageInput): RecommendationLineageGraph {
  const evidenceNodes: RecommendationLineageNode[] = input.evidenceSnapshots.map((snapshot) => Object.freeze({
    nodeId: `evidence:${snapshot.snapshotId}`,
    nodeType: "evidence" as const,
    snapshotId: snapshot.snapshotId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", snapshot),
  }));
  const governanceNode: RecommendationLineageNode = Object.freeze({
    nodeId: `governance:${input.constitutionalReadinessResult.record.governanceSnapshotId}`,
    nodeType: "governance",
    snapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", {
      snapshotId: input.constitutionalReadinessResult.record.governanceSnapshotId,
      nodeType: "governance",
    }),
  });
  const scoringNode: RecommendationLineageNode = Object.freeze({
    nodeId: `scoring:${input.scoringSnapshot.scoringSnapshotId}`,
    nodeType: "scoring",
    snapshotId: input.scoringSnapshot.scoringSnapshotId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", input.scoringSnapshot),
  });
  const policyNode: RecommendationLineageNode = Object.freeze({
    nodeId: `policy:${input.policySnapshot.policySnapshotId}`,
    nodeType: "policy",
    snapshotId: input.policySnapshot.policySnapshotId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", input.policySnapshot),
  });
  const approvalNode: RecommendationLineageNode = Object.freeze({
    nodeId: `approval:${input.approvalSnapshot.approvalSnapshotId}`,
    nodeType: "approval",
    snapshotId: input.approvalSnapshot.approvalSnapshotId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", input.approvalSnapshot),
  });
  const recommendationNode: RecommendationLineageNode = Object.freeze({
    nodeId: `recommendation:${input.recommendationId}`,
    nodeType: "recommendation",
    snapshotId: input.recommendationId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", {
      recommendationId: input.recommendationId,
      summary: input.decisionIntentBoundaryResult.artifact.summary,
    }),
  });
  const escalationNode: RecommendationLineageNode = Object.freeze({
    nodeId: `escalation:${input.escalationDeterminismResult.record.escalationId}`,
    nodeType: "escalation",
    snapshotId: input.escalationDeterminismResult.record.escalationId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", {
      escalationId: input.escalationDeterminismResult.record.escalationId,
      oversightState: input.escalationDeterminismResult.record.oversightState,
    }),
  });
  const interventionNode: RecommendationLineageNode = Object.freeze({
    nodeId: `intervention:${input.humanSupremacyResult.record.supremacyId}`,
    nodeType: "intervention",
    snapshotId: input.humanSupremacyResult.record.supremacyId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", {
      supremacyId: input.humanSupremacyResult.record.supremacyId,
      operatorReviewRequired: input.decisionIntentBoundaryResult.artifact.operatorReviewRequired,
    }),
  });
  const replayNode: RecommendationLineageNode = Object.freeze({
    nodeId: `replay:${input.constitutionalReplayResult.record.replayId}`,
    nodeType: "replay",
    snapshotId: input.constitutionalReplayResult.record.replayId,
    deterministicHash: hashRecommendationLineageValue("recommendation-lineage-node", {
      replayId: input.constitutionalReplayResult.record.replayId,
      replaySnapshotId: input.constitutionalReadinessResult.record.replaySnapshotId,
    }),
  });

  const nodes = Object.freeze([
    ...evidenceNodes,
    governanceNode,
    scoringNode,
    policyNode,
    approvalNode,
    recommendationNode,
    escalationNode,
    interventionNode,
    replayNode,
  ]);

  const edges: RecommendationLineageEdge[] = [];
  for (const evidenceNode of evidenceNodes) {
    edges.push(Object.freeze({
      from: evidenceNode.nodeId,
      to: governanceNode.nodeId,
      relation: "depends_on",
      deterministicHash: hashRecommendationLineageValue("recommendation-lineage-edge", {
        from: evidenceNode.nodeId,
        to: governanceNode.nodeId,
        relation: "depends_on",
      }),
    }));
  }
  for (const relation of [
    [governanceNode.nodeId, scoringNode.nodeId, "validated_by"],
    [scoringNode.nodeId, policyNode.nodeId, "depends_on"],
    [policyNode.nodeId, approvalNode.nodeId, "depends_on"],
    [approvalNode.nodeId, recommendationNode.nodeId, "depends_on"],
    [recommendationNode.nodeId, escalationNode.nodeId, "escalated_by"],
    [escalationNode.nodeId, interventionNode.nodeId, "reviewed_by"],
    [interventionNode.nodeId, replayNode.nodeId, "replayed_by"],
  ] as const) {
    edges.push(Object.freeze({
      from: relation[0],
      to: relation[1],
      relation: relation[2],
      deterministicHash: hashRecommendationLineageValue("recommendation-lineage-edge", relation),
    }));
  }

  return Object.freeze({
    nodes,
    edges: Object.freeze(edges),
    graphHash: hashRecommendationLineageValue("recommendation-lineage-graph", {
      nodes,
      edges,
    }),
  });
}
