import { describe, expect, it } from "vitest";
import { buildPlanDiffFixture, projectArtifactDiff, projectReplayDrift } from "./helpers";

describe("replay drift projection", () => {
  it("detects replay-invalidating changes", () => {
    const fixture = buildPlanDiffFixture({
      comparisonMode: "PLAN_TO_REPLAY",
    });
    const artifactDiff = projectArtifactDiff({
      baseArtifact: fixture.baseArtifact,
      targetArtifact: fixture.targetArtifact,
    });
    const view = projectReplayDrift({ artifactDiff });

    expect(view.replayValid).toBe(false);
    expect(view.driftClass).toBe("REPLAY_DRIFT");
  });
});
