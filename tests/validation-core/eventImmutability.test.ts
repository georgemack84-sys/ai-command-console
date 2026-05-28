import { describe, expect, it } from "vitest";
import { buildValidationFixture } from "./helpers";

describe("event immutability", () => {
  it("emits frozen immutable events", () => {
    const fixture = buildValidationFixture();
    expect(Object.isFrozen(fixture.output.events[0])).toBe(true);
  });
});
