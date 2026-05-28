import { describe, expect, it } from "vitest";
import { buildStepTraceFixture, projectTimeline } from "./helpers";

describe("timeline projection", () => {
  it("preserves deterministic event ordering", () => {
    const fixture = buildStepTraceFixture();
    const projected = projectTimeline(fixture.validationFixture.output);

    expect(projected.events.map((event) => event.eventId)).toEqual(
      fixture.validationFixture.output.timeline.events,
    );
  });
});
