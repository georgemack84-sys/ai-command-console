import { describe, expect, it } from "vitest";
import { buildStepTraceFixture } from "./helpers";

describe("reuse validation core", () => {
  it("reuses 4.4A outputs instead of duplicating timeline, replay, causality, or forensics truth", () => {
    const fixture = buildStepTraceFixture();

    expect(fixture.view.timeline.timelineId).toBe(fixture.validationFixture.output.timeline.timelineId);
    expect(fixture.view.stateView.reconstructedStateHash).toBe(fixture.validationFixture.output.result.reconstructedStateHash);
    expect(fixture.view.forensicView?.explanationHash).toBe(fixture.validationFixture.output.forensics.explanationHash);
  });
});
