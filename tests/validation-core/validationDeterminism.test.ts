import { describe, expect, it } from "vitest";
import { buildValidationFixture } from "./helpers";

describe("validation determinism", () => {
  it("produces identical validation result hashes for identical input", () => {
    const left = buildValidationFixture();
    const right = buildValidationFixture();

    expect(left.output.result).toEqual(right.output.result);
    expect(left.output.result.resultHash).toBe(right.output.result.resultHash);
    expect(left.output.timeline.timelineHash).toBe(right.output.timeline.timelineHash);
  });
});
