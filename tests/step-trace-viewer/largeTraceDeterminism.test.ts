import { describe, expect, it } from "vitest";
import { buildStepTraceView } from "@/services/step-trace-viewer";
import { buildValidationFixture } from "@/tests/validation-core/helpers";

describe("large trace determinism", () => {
  it("remains deterministic for larger projected timelines", () => {
    const fixture = buildValidationFixture();
    const amplified = {
      ...fixture.output,
      timeline: {
        ...fixture.output.timeline,
        events: Object.freeze([
          ...fixture.output.timeline.events,
          ...fixture.output.timeline.events,
          ...fixture.output.timeline.events,
        ]),
      },
      events: Object.freeze([
        ...fixture.output.events,
        ...fixture.output.events,
        ...fixture.output.events,
      ]),
    };

    const left = buildStepTraceView({
      treaty: fixture.context.treaty,
      validation: amplified,
    });
    const right = buildStepTraceView({
      treaty: fixture.context.treaty,
      validation: amplified,
    });

    expect(left.traceProjectionHash).toBe(right.traceProjectionHash);
  });
});
