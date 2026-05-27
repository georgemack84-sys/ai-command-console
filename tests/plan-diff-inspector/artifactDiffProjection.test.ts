import { describe, expect, it } from "vitest";
import { buildPlanDiffFixture, projectArtifactDiff } from "./helpers";

describe("artifact diff projection", () => {
  it("detects deterministic structural diff paths", () => {
    const fixture = buildPlanDiffFixture();
    const view = projectArtifactDiff({
      baseArtifact: fixture.baseArtifact,
      targetArtifact: fixture.targetArtifact,
    });

    expect(view.visibleDiffCount).toBeGreaterThan(0);
    expect(view.changedPaths).toEqual([...view.changedPaths].sort((left, right) => left.localeCompare(right)));
  });
});
