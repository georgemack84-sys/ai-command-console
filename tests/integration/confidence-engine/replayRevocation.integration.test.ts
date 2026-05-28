import { describe, expect, it } from "vitest";
import { buildDeterministicConfidenceFixture } from "./helpers";

describe("confidence revocation compatibility", () => {
  it("remains contained under revocation", () => {
    const base = buildDeterministicConfidenceFixture();
    const fixture = buildDeterministicConfidenceFixture({
      proposalRevocationResult: {
        ...base.input.proposalRevocationResult,
        status: "REVOKED",
      },
    });

    expect(fixture.result.status).toBe("FROZEN");
  });
});
