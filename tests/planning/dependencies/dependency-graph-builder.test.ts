import { describe, expect, it } from "vitest";

import { buildDependencyGraph } from "@/services/planning/dependencies";

import { buildNormalizedPlan } from "./helpers";

describe("dependency graph builder", () => {
  it("builds a deterministic graph and preserves graphHash", () => {
    const normalizedPlan = buildNormalizedPlan();
    const graph = buildDependencyGraph(normalizedPlan);

    expect(graph.planId).toBe(normalizedPlan.planId);
    expect(graph.graphHash).toBe(normalizedPlan.validatedGraphHash);
    expect(graph.nodes).toHaveLength(normalizedPlan.steps.length);
    expect(graph.edges).toEqual([
      { from: normalizedPlan.steps[0]!.id, to: normalizedPlan.steps[1]!.id, edgeType: "depends_on" },
    ]);
  });
});
