import { describe, expect, it } from "vitest";
import { buildReplaySafeValidationTimeline } from "@/services/validation-core";
import { buildValidationFixture } from "./helpers";

describe("timeline reconstruction determinism", () => {
  it("reconstructs identical timelines from the same event set", () => {
    const fixture = buildValidationFixture();
    const left = buildReplaySafeValidationTimeline({
      treaty: fixture.context.treaty,
      validationId: fixture.request.validationId,
      events: fixture.output.events,
      generatedAt: fixture.request.submittedAt,
      reconstructedStateHash: fixture.output.result.reconstructedStateHash,
    });
    const right = buildReplaySafeValidationTimeline({
      treaty: fixture.context.treaty,
      validationId: fixture.request.validationId,
      events: fixture.output.events,
      generatedAt: fixture.request.submittedAt,
      reconstructedStateHash: fixture.output.result.reconstructedStateHash,
    });

    expect(left.timeline).toEqual(right.timeline);
  });
});
