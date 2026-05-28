import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "./helpers";

describe("proposal replay integration", () => {
  it("replay substitution fails closed", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ presentStateSubstitution: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_SYNTHETIC_ANCESTRY_DETECTED")).toBe(true);
  });
});
