import { describe, expect, it } from "vitest";

import { classifyRecursiveLoops } from "@/services/coordination-containment/recursiveLoopClassifier";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("classifyRecursiveLoops", () => {
  it("detects cyclic coordination growth", () => {
    const fixture = buildMissionGraphFixture();
    const cycleEdge = Object.freeze({
      ...fixture.snapshot.edges[0],
      edgeId: `${fixture.snapshot.edges[0].edgeId}-cycle`,
      sourceNodeId: fixture.snapshot.edges[0].targetNodeId,
      targetNodeId: fixture.snapshot.edges[0].sourceNodeId,
    });
    const signal = classifyRecursiveLoops({
      ...fixture.snapshot,
      edges: Object.freeze([...fixture.snapshot.edges, cycleEdge]),
    });

    expect(signal.recursive).toBe(true);
  });
});
