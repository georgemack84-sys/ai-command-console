import type { DeterministicReplayInput, ReplayDependencyGraph, ReplayDependencyNode, ReplayDependencyEdge } from "./types/deterministicReplayTypes";
import { hashReplayValue } from "./replayHashEngine";

export function buildReplayDependencyGraph(input: DeterministicReplayInput): ReplayDependencyGraph {
  const request = input.request;
  const nodes: ReplayDependencyNode[] = [
    ...request.evidenceSnapshotIds.map((snapshotId) => ({
      nodeId: `evidence:${snapshotId}`,
      nodeType: "evidence" as const,
      snapshotId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId, nodeType: "evidence" }),
    })),
    {
      nodeId: `governance:${request.governanceSnapshotId}`,
      nodeType: "governance",
      snapshotId: request.governanceSnapshotId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId: request.governanceSnapshotId, nodeType: "governance" }),
    },
    ...request.validatorSnapshotIds.map((snapshotId) => ({
      nodeId: `validator:${snapshotId}`,
      nodeType: "validator" as const,
      snapshotId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId, nodeType: "validator" }),
    })),
    ...request.policySnapshotIds.map((snapshotId) => ({
      nodeId: `policy:${snapshotId}`,
      nodeType: "policy" as const,
      snapshotId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId, nodeType: "policy" }),
    })),
    ...request.approvalDependencyIds.map((snapshotId) => ({
      nodeId: `approval:${snapshotId}`,
      nodeType: "approval" as const,
      snapshotId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId, nodeType: "approval" }),
    })),
    {
      nodeId: `scoring:${request.scoringSnapshotId}`,
      nodeType: "scoring",
      snapshotId: request.scoringSnapshotId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId: request.scoringSnapshotId, nodeType: "scoring" }),
    },
    {
      nodeId: `confidence:${request.confidenceSnapshotId}`,
      nodeType: "confidence",
      snapshotId: request.confidenceSnapshotId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId: request.confidenceSnapshotId, nodeType: "confidence" }),
    },
    ...request.suppressionSnapshotIds.map((snapshotId) => ({
      nodeId: `suppression:${snapshotId}`,
      nodeType: "suppression" as const,
      snapshotId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId, nodeType: "suppression" }),
    })),
    {
      nodeId: `recommendation:${request.recommendationId}`,
      nodeType: "recommendation",
      snapshotId: request.recommendationId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId: request.recommendationId, nodeType: "recommendation" }),
    },
    {
      nodeId: `replay:${request.replayId}`,
      nodeType: "replay",
      snapshotId: request.replayId,
      deterministicHash: hashReplayValue("replay-dependency-node", { snapshotId: request.replayId, nodeType: "replay" }),
    },
  ];

  const edges: ReplayDependencyEdge[] = [
    ...request.evidenceSnapshotIds.map((snapshotId) => ({
      from: `evidence:${snapshotId}`,
      to: `recommendation:${request.recommendationId}`,
      relation: "depends_on" as const,
      deterministicHash: hashReplayValue("replay-dependency-edge", { from: snapshotId, relation: "depends_on" }),
    })),
    {
      from: `governance:${request.governanceSnapshotId}`,
      to: `recommendation:${request.recommendationId}`,
      relation: "validated_by",
      deterministicHash: hashReplayValue("replay-dependency-edge", { from: request.governanceSnapshotId, relation: "validated_by" }),
    },
    ...request.suppressionSnapshotIds.map((snapshotId) => ({
      from: `suppression:${snapshotId}`,
      to: `recommendation:${request.recommendationId}`,
      relation: "suppressed_by" as const,
      deterministicHash: hashReplayValue("replay-dependency-edge", { from: snapshotId, relation: "suppressed_by" }),
    })),
    {
      from: `recommendation:${request.recommendationId}`,
      to: `replay:${request.replayId}`,
      relation: "reconstructed_by",
      deterministicHash: hashReplayValue("replay-dependency-edge", { from: request.recommendationId, relation: "reconstructed_by" }),
    },
  ];

  return Object.freeze({
    nodes: Object.freeze(nodes),
    edges: Object.freeze(edges),
    graphHash: hashReplayValue("replay-dependency-graph", {
      nodes,
      edges,
    }),
  });
}
