import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity anti-emergence", () => {
  it("authority crossover is rejected", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ authorityCrossover: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_AUTHORITY_EXPANSION_DETECTED")).toBe(true);
  });
});
