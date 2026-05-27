import { describe, expect, it } from "vitest";
import { buildProposalIntegrityFixture } from "@/tests/integration/proposal-integrity/helpers";

describe("proposal integrity fail-closed unit", () => {
  it("approval ambiguity fails closed", () => {
    const fixture = buildProposalIntegrityFixture({
      metadata: Object.freeze({ approvalAmbiguity: true }),
    });
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_APPROVAL_DEPENDENCY_INVALID")).toBe(true);
  });
});
