import { describe, expect, it } from "vitest";
import { buildValidationTimeline } from "@/services/validation-core";
import { buildValidationFixture } from "./helpers";

describe("sequence collision", () => {
  it("returns VALIDATION_SEQUENCE_COLLISION for duplicate monotonic sequences", () => {
    const fixture = buildValidationFixture();
    const events = fixture.output.events.map((event, index) => index === 1 ? { ...event, monotonicSequence: 1 } : event);
    const result = buildValidationTimeline({
      validationId: fixture.request.validationId,
      events,
      generatedAt: fixture.request.submittedAt,
      reconstructedStateHash: fixture.output.result.reconstructedStateHash,
    });

    expect(result.failures.some((failure) => failure.code === "VALIDATION_SEQUENCE_COLLISION")).toBe(true);
  });
});
