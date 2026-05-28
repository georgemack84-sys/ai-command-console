import { describe, expect, it } from "vitest";

import { buildDependencyGraph, createDependencyGraphFingerprint } from "@/services/planning/dependencies";

import { buildNormalizedPlan } from "./helpers";

describe("dependency graph fingerprint", () => {
  it("is stable and preserves graphHash separately", () => {
    const normalizedPlan = buildNormalizedPlan();
    const graph = buildDependencyGraph(normalizedPlan);

    const first = createDependencyGraphFingerprint(graph);
    const second = createDependencyGraphFingerprint(graph);

    expect(first).toBe(second);
    expect(graph.graphHash).toBe(normalizedPlan.validatedGraphHash);
    expect(first).not.toBe(normalizedPlan.validatedGraphHash);
  });
});
