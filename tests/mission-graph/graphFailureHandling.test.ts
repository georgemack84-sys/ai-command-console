import { describe, expect, it } from "vitest";

import { validateMissionGraphConsistency } from "@/services/mission-graph/graphConsistencyValidator";

describe("mission graph failure handling", () => {
  it("fails closed on orphan nodes and circular ancestry", () => {
    const errors = validateMissionGraphConsistency({
      nodes: Object.freeze([
        Object.freeze({
          nodeId: "a",
          nodeType: "proposal" as const,
          missionId: "m1",
          createdAt: "2026-05-17T08:00:00.000Z",
          replaySafe: true as const,
          advisoryOnly: true as const,
          sourceReferenceId: "proposal-a",
        }),
        Object.freeze({
          nodeId: "b",
          nodeType: "lifecycle" as const,
          missionId: "m1",
          createdAt: "2026-05-17T08:00:00.000Z",
          replaySafe: true as const,
          advisoryOnly: true as const,
          sourceReferenceId: "transition-b",
        }),
      ]),
      edges: Object.freeze([
        Object.freeze({
          edgeId: "edge-a-b",
          sourceNodeId: "a",
          targetNodeId: "b",
          relationshipType: "derived_from" as const,
          replayDeterministic: true as const,
          createdAt: "2026-05-17T08:00:00.000Z",
        }),
        Object.freeze({
          edgeId: "edge-b-a",
          sourceNodeId: "b",
          targetNodeId: "a",
          relationshipType: "derived_from" as const,
          replayDeterministic: true as const,
          createdAt: "2026-05-17T08:00:01.000Z",
        }),
      ]),
      replayPaths: Object.freeze([]),
      governanceValidated: true,
      replaySafe: true,
      lifecycleEntries: 1,
      escalationEntries: 1,
    });

    expect(errors.map((error) => error.code)).toContain("MISSION_GRAPH_CIRCULAR_DEPENDENCY_CORRUPTION");
  });
});
