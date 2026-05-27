import { describe, expect, it } from "vitest";

import { buildSurvivabilityDependencyGraph } from "@/services/readiness/survivabilityDependencyGraph";

describe("buildSurvivabilityDependencyGraph", () => {
  it("preserves the governance-to-readiness dependency chain", () => {
    const graph = buildSurvivabilityDependencyGraph();

    expect(graph.nodes).toEqual(["Governance", "Containment", "Continuity", "Recovery", "Readiness"]);
    expect(graph.trace("Governance", "Readiness")).toEqual(["Governance", "Containment", "Continuity", "Recovery", "Readiness"]);
  });
});
