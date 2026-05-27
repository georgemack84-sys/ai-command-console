import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "./helpers";

describe("proposal approval integration", () => {
  it("frozen proposals cannot progress", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ proposalFrozen: true }),
    });
    expect(fixture.result.status).toBe("frozen");
  });
});
