import { describe, expect, it } from "vitest";

import { buildSystemDependencyGraph } from "@/services/coordination/systemDependencyGraph";

describe("buildSystemDependencyGraph", () => {
  it("builds deterministic dependency graphs", () => {
    const graph = buildSystemDependencyGraph({
      systems: ["GOVERNANCE", "CONTAINMENT"],
      dependencies: {
        GOVERNANCE: ["CONTAINMENT"],
      },
    });

    expect(graph.GOVERNANCE).toEqual(["CONTAINMENT"]);
    expect(graph.CONTAINMENT).toEqual([]);
  });
});
