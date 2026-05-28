import { describe, expect, it } from "vitest";
import { projectReplayComparison } from "./helpers";
import { buildReplayFixture } from "./helpers";

describe("replay comparison determinism", () => {
  it("produces identical comparison views for identical replay inputs", () => {
    const fixture = buildReplayFixture();

    const left = projectReplayComparison(fixture.input);
    const right = projectReplayComparison(fixture.input);

    expect(right).toEqual(left);
    expect(right.comparisonHash).toBe(left.comparisonHash);
  });
});
