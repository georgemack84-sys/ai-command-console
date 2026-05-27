import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("governanceBindingEngine", () => {
  it("binds proposals to immutable original governance coordinates", () => {
    const fixture = buildProposalGovernanceBindingFixture();

    expect(fixture.result.status).toBe("REVOKED");
    expect(fixture.result.binding.immutable).toBe(true);
    expect(fixture.result.binding.governanceSnapshotId).toBe(fixture.input.proposalIntegrityResult.proposal.governanceSnapshotId);
  });

  it("fails closed on missing governance snapshot", () => {
    const base = buildProposalGovernanceBindingFixture();
    const fixture = buildProposalGovernanceBindingFixture({
      proposalIntegrityResult: Object.freeze({
        ...base.input.proposalIntegrityResult,
        proposal: Object.freeze({
          ...base.input.proposalIntegrityResult.proposal,
          governanceSnapshotId: "",
        }),
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_GOVERNANCE_BINDING_MISSING_GOVERNANCE_SNAPSHOT")).toBe(true);
  });

  it("fails closed on duplicate binding attempts", () => {
    const base = buildProposalGovernanceBindingFixture();
    const fixture = buildProposalGovernanceBindingFixture({
      existingBinding: base.result.binding,
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_GOVERNANCE_BINDING_DUPLICATE")).toBe(true);
  });
});
