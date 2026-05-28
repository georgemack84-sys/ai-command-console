import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationTopology, validateBoundedOrchestrationTopology } from "@/services/bounded-orchestration-framework";
import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("bounded orchestration topology", () => {
  it("builds a static bounded topology", () => {
    const fixture = buildBoundedOrchestrationFixture();
    expect(buildBoundedOrchestrationTopology(fixture.orchestrationInput)).toMatchObject({
      routeTarget: fixture.routingResult.target,
      staticTopology: true,
      breadth: 1,
    });
  });

  it("rejects orchestration graph inflation", () => {
    const errors = validateBoundedOrchestrationTopology({
      routeTarget: "human_review",
      staticTopology: true,
      depth: 6,
      breadth: 5,
      graphNodeCount: 9,
      lineageExpansion: 13,
      delegationCount: 4,
    });
    expect(errors).toEqual(expect.arrayContaining([
      "topology.depth",
      "topology.breadth",
      "topology.graphNodeCount",
      "topology.lineageExpansion",
      "topology.delegationCount",
    ]));
  });
});
