import { describe, expect, it } from "vitest";
import { buildStepTraceFixture, projectForensics } from "./helpers";

describe("forensic projection", () => {
  it("surfaces forensic explanations without invention", () => {
    const fixture = buildStepTraceFixture();
    const projected = projectForensics(fixture.validationFixture.output);

    expect(projected.projection?.explanationHash).toBe(
      fixture.validationFixture.output.forensics.explanationHash,
    );
  });
});
