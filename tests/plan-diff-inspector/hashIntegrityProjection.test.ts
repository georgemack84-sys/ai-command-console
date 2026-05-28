import { describe, expect, it } from "vitest";
import { buildPlanDiffFixture, projectHashIntegrity } from "./helpers";

describe("hash integrity projection", () => {
  it("surfaces changed or invalid declared hash-like fields without repair", () => {
    const fixture = buildPlanDiffFixture();
    const view = projectHashIntegrity({
      baseArtifact: fixture.baseArtifact,
      targetArtifact: fixture.targetArtifact,
    });

    expect(view.hashMismatch).toBe(true);
    expect(view.changedHashPaths.length).toBeGreaterThan(0);
  });
});
