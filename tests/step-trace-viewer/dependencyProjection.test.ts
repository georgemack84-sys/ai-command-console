import { describe, expect, it } from "vitest";
import { buildStepTraceFixture, projectDependencyGraph } from "./helpers";

describe("dependency projection", () => {
  it("keeps stable nodes and edges and leaves invalid graph state visible", () => {
    const fixture = buildStepTraceFixture();
    const projection = projectDependencyGraph(fixture.validationFixture.output);

    expect([...projection.projection.nodes].map((node) => node.nodeId)).toEqual(
      [...projection.projection.nodes].map((node) => node.nodeId).sort((a, b) => a.localeCompare(b)),
    );
    expect(projection.projection.visibleNodeCount).toBeGreaterThan(0);
    expect(projection.projection.visibleEdgeCount).toBeGreaterThan(0);
  });
});
