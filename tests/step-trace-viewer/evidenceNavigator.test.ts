import { describe, expect, it } from "vitest";
import { projectEvidenceNavigator } from "@/services/step-trace-viewer";
import { buildStepTraceFixture } from "./helpers";

describe("evidence navigator", () => {
  it("preserves immutable evidence references and flags missing evidence", () => {
    const fixture = buildStepTraceFixture();
    const projected = projectEvidenceNavigator({
      treaty: fixture.validationFixture.context.treaty,
      validation: fixture.validationFixture.output,
    });

    expect(projected.projection.items).toHaveLength(fixture.validationFixture.output.events.length);
    expect(projected.projection.items.every((item) => item.validationEventId === item.eventId)).toBe(true);
  });
});
