import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposal replay red-team governance substitution", () => {
  it("fails closed on latest governance substitution attempts", () => {
    const fixture = buildProposalReplayFixture({
      metadata: Object.freeze({
        attempt: "latest governance substitution",
      }),
      proposalGovernanceBindingResult: Object.freeze({
        ...buildProposalReplayFixture().input.proposalGovernanceBindingResult,
        snapshot: Object.freeze({
          ...buildProposalReplayFixture().input.proposalGovernanceBindingResult.snapshot,
          governanceSnapshotId: "latest-governance",
        }),
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.errors.length).toBeGreaterThan(0);
  });
});
