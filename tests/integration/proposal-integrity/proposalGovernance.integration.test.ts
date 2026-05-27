import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "./helpers";

describe("proposal governance integration", () => {
  it("governance substitution fails closed", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ governanceSubstitution: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_GOVERNANCE_DRIFT_DETECTED")).toBe(true);
  });
});
