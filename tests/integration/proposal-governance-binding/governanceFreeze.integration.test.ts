import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("proposal governance freeze integration", () => {
  it("fails closed when freeze containment already failed closed", () => {
    const base = buildProposalGovernanceBindingFixture();
    const fixture = buildProposalGovernanceBindingFixture({
      proposalFreezeResult: Object.freeze({
        ...base.input.proposalFreezeResult,
        status: "FAILED_CLOSED" as const,
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_GOVERNANCE_BINDING_FAIL_CLOSED")).toBe(true);
  });
});
