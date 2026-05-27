import { describe, expect, it } from "vitest";
import { buildStepTraceFixture, projectReplayView } from "./helpers";

describe("replay projection", () => {
  it("projects replay lineage from existing replay artifacts only", () => {
    const fixture = buildStepTraceFixture();
    const projected = projectReplayView({
      treaty: fixture.validationFixture.context.treaty,
      validation: fixture.validationFixture.output,
    });

    expect(projected.projection?.replaySource).toBe(
      fixture.validationFixture.context.treaty.manifest.replaySnapshotHash,
    );
  });
});
