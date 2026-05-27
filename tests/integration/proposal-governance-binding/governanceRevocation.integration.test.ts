import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("proposal governance revocation integration", () => {
  it("remains revoked when revocation containment is active", () => {
    const fixture = buildProposalGovernanceBindingFixture();

    expect(fixture.input.proposalRevocationResult.status).toBe("CASCADE_COMPLETED");
    expect(fixture.result.status).toBe("REVOKED");
  });
});
