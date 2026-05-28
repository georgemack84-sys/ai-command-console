import { describe, expect, it } from "vitest";
import { buildPlanDiffFixture, projectDependencyDrift } from "./helpers";

describe("dependency drift projection", () => {
  it("detects edge changes and cycles", () => {
    const fixture = buildPlanDiffFixture();
    const view = projectDependencyDrift({
      baseArtifact: fixture.baseArtifact,
      targetArtifact: fixture.targetArtifact,
    });

    expect(view.cycleDetected).toBe(true);
    expect(view.addedEdges.length + view.removedEdges.length).toBeGreaterThan(0);
  });
});
