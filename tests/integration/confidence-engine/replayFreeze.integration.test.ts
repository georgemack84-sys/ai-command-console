import { describe, expect, it } from "vitest";
import { buildDeterministicConfidenceFixture } from "./helpers";

describe("confidence freeze compatibility", () => {
  it("remains cautionary and frozen under freeze containment", () => {
    const base = buildDeterministicConfidenceFixture();
    const fixture = buildDeterministicConfidenceFixture({
      proposalFreezeResult: {
        ...base.input.proposalFreezeResult,
        status: "FROZEN",
      },
    });

    expect(fixture.result.status).toBe("FROZEN");
  });
});
