import { describe, expect, it } from "vitest";
import { buildStepTraceFixture } from "./helpers";

describe("projection hash integrity", () => {
  it("changes the traceProjectionHash when visible projection state changes", () => {
    const base = buildStepTraceFixture();
    const withoutEvidence = buildStepTraceFixture({ includeEvidence: false });

    expect(base.view.traceProjectionHash).not.toBe(withoutEvidence.view.traceProjectionHash);
  });
});
