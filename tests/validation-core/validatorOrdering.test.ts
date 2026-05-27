import { describe, expect, it } from "vitest";
import { buildValidationFixture } from "./helpers";

describe("validator ordering", () => {
  it("runs validators in deterministic order", () => {
    const fixture = buildValidationFixture();
    const started = fixture.output.events
      .filter((event) => event.eventType.endsWith(".validation.started"))
      .map((event) => event.validator);

    expect(started).toEqual([
      "schema",
      "dependency",
      "capability",
      "governance",
      "replay",
      "rollback",
      "runtime",
      "isolation",
      "integrity",
    ]);
  });
});
