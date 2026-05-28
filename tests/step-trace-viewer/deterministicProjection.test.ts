import { describe, expect, it } from "vitest";
import { buildStepTraceFixture } from "./helpers";

describe("deterministic projection", () => {
  it("produces identical views and hashes for identical truth input", () => {
    const left = buildStepTraceFixture();
    const right = buildStepTraceFixture();

    expect(left.view).toEqual(right.view);
    expect(left.view.traceProjectionHash).toBe(right.view.traceProjectionHash);
  });
});
