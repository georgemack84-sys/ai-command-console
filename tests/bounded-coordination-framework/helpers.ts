import { readFileSync } from "node:fs";
import path from "node:path";

import { buildBoundedCoordinationFramework } from "@/services/bounded-coordination-framework";
import type {
  BoundedCoordinationFrameworkInput,
  CoordinationCeiling,
  CoordinationTopologyGraph,
  CoordinationTopologyNode,
} from "@/services/bounded-coordination-framework";
import { buildAutonomyAuditEpisodeFixture } from "@/tests/autonomy-audit-episode-model/helpers";

export function buildBoundedCoordinationFixture(overrides: Partial<{
  graph: CoordinationTopologyGraph;
  requestedCeiling: CoordinationCeiling;
  metadata: Readonly<Record<string, unknown>>;
  confidenceScore: number;
  previousConfidenceScore: number;
  currentState: "draft" | "validated" | "governance_review" | "approved" | "denied" | "prepared_handoff" | "archived" | "revoked";
  requestedTransition: "validate" | "submit_governance_review" | "approve" | "deny" | "prepare_handoff" | "archive" | "revoke";
}> = {}) {
  const auditFixture = buildAutonomyAuditEpisodeFixture({
    metadata: overrides.metadata,
    confidenceScore: overrides.confidenceScore,
    previousConfidenceScore: overrides.previousConfidenceScore,
    currentState: overrides.currentState,
    requestedTransition: overrides.requestedTransition,
  });
  const governanceView = auditFixture.input.governanceView;
  const authorityBoundaryId = governanceView.authorityBoundaries[0]?.authorityId ?? "authority:replay";
  const governanceSnapshotId = governanceView.policy.policySnapshotHash;
  const replayHash = auditFixture.input.replay.reconstructionHash;

  const defaultNodes: readonly CoordinationTopologyNode[] = Object.freeze([
    Object.freeze({
      nodeId: "coord-root",
      topologyType: "linear" as const,
      authorityBoundaryId,
      governanceSnapshotId,
      replayHash,
      createdAt: "2026-05-16T16:25:00.000Z",
      delegatedNodeIds: Object.freeze(["coord-child-1"]),
      escalationDepth: 0,
      estimatedDurationMs: 500,
    }),
    Object.freeze({
      nodeId: "coord-child-1",
      parentNodeId: "coord-root",
      topologyType: "linear" as const,
      authorityBoundaryId,
      governanceSnapshotId,
      replayHash,
      createdAt: "2026-05-16T16:25:01.000Z",
      delegatedNodeIds: Object.freeze([]),
      escalationDepth: 0,
      estimatedDurationMs: 500,
    }),
  ]);

  const graph: CoordinationTopologyGraph = overrides.graph ?? Object.freeze({
    graphId: "coord-graph-001",
    topologyType: "linear" as const,
    rootNodeId: "coord-root",
    nodes: defaultNodes,
    graphHash: "",
    lineageHash: "",
    derivedOnly: true as const,
  });

  const requestedCeiling: CoordinationCeiling = overrides.requestedCeiling ?? Object.freeze({
    maxDepth: 3,
    maxBranchFactor: 2,
    maxDelegations: 3,
    maxEscalationDepth: 1,
    maxWorkflowNodes: 4,
    maxCoordinationDurationMs: 10_000,
  });

  const input: BoundedCoordinationFrameworkInput = Object.freeze({
    graph,
    requestedCeiling,
    auditEpisode: auditFixture.episode,
    governanceView: auditFixture.input.governanceView,
    overrideContract: auditFixture.input.overrideContract,
    replay: auditFixture.input.replay,
    generatedAt: "2026-05-16T16:26:00.000Z",
    metadata: overrides.metadata,
  });

  return {
    auditFixture,
    input,
    framework: buildBoundedCoordinationFramework(input),
  };
}

export function loadBoundedCoordinationSources() {
  const root = path.resolve("services", "bounded-coordination-framework");
  return [
    "index.ts",
    "boundedCoordinationFramework.ts",
    "coordinationTopologyValidator.ts",
    "coordinationContainmentEngine.ts",
    "coordinationCeilingEngine.ts",
    "delegationBoundaryValidator.ts",
    "orchestrationIsolationBinder.ts",
    "coordinationReplayBinder.ts",
    "coordinationLineageLedger.ts",
    "coordinationGraphHasher.ts",
    "coordinationTopologySerializer.ts",
    "coordinationTopologyNormalizer.ts",
    "coordinationContainmentGuards.ts",
    "coordinationReplayReconstruction.ts",
    "coordinationTopologySchemas.ts",
    "coordinationErrors.ts",
  ].map((file) => ({
    path: path.join(root, file),
    content: readFileSync(path.join(root, file), "utf8"),
  }));
}
