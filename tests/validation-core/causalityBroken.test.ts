import { describe, expect, it } from "vitest";
import { resolveValidationCausality } from "@/services/validation-core";
import { buildValidationFixture } from "./helpers";

describe("causality broken", () => {
  it("returns VALIDATION_CAUSALITY_BROKEN for invalid parent/root linkage", () => {
    const fixture = buildValidationFixture();
    const events = fixture.output.events.map((event, index) => index === 1 ? { ...event, parentEventId: "missing-parent" } : event);
    const result = resolveValidationCausality(events);

    expect(result.valid).toBe(false);
    expect(result.failureCode).toBe("VALIDATION_CAUSALITY_BROKEN");
  });
});
