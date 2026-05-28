import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("proposal governance binding integration", () => {
  it("integrates safely with proposal state, freeze, and revocation layers", () => {
    const fixture = buildProposalGovernanceBindingFixture();

    expect(fixture.result.binding.proposalId).toBe(fixture.input.proposalStateEngineInput.transition.proposalId);
    expect(fixture.result.binding.bindingStatus).toBe("REVOKED");
    expect(fixture.result.auditLedger.length).toBeGreaterThan(0);
  });
});
