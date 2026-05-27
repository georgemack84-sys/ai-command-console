import { describe, expect, it } from "vitest";
import { buildValidationTimeline } from "@/services/validation-core";
import { buildValidationFixture } from "./helpers";

describe("timeline gap detection", () => {
  it("returns VALIDATION_TIMELINE_GAP when an event sequence is missing", () => {
    const fixture = buildValidationFixture();
    const events = fixture.output.events.filter((event) => event.monotonicSequence !== 2);
    const result = buildValidationTimeline({
      validationId: fixture.request.validationId,
      events,
      generatedAt: fixture.request.submittedAt,
      reconstructedStateHash: fixture.output.result.reconstructedStateHash,
    });

    expect(result.failures[0]?.code).toBe("VALIDATION_TIMELINE_GAP");
  });
});
