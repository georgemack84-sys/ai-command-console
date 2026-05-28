import { describe, expect, it } from "vitest";
import { buildStepTraceFixture } from "./helpers";

describe("no mutation behavior", () => {
  it("never mutates source input objects", () => {
    const fixture = buildStepTraceFixture();
    const before = JSON.parse(JSON.stringify(fixture.request));

    buildStepTraceFixture();

    expect(fixture.request).toEqual(before);
  });
});
