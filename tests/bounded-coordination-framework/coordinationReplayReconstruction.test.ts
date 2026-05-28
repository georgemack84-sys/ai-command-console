import { describe, expect, it } from "vitest";

import { reconstructCoordinationReplay } from "@/services/bounded-coordination-framework";
import { buildBoundedCoordinationFixture } from "./helpers";

describe("coordinationReplayReconstruction", () => {
  it("reconstructs topology deterministically for replay", () => {
    const { framework } = buildBoundedCoordinationFixture();
    const replayed = reconstructCoordinationReplay(framework.topology);
    expect(replayed.rootNodeId).toBe(framework.topology.rootNodeId);
    expect(replayed.nodes.length).toBe(framework.topology.nodes.length);
  });
});
