import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity governance", () => {
  it("governance drift fails closed", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ governanceSubstitution: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_GOVERNANCE_DRIFT_DETECTED")).toBe(true);
  });
});
