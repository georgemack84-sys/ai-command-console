import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposal replay governance drift", () => {
  it("freezes when replay governance diverges from immutable proposal governance", () => {
    const base = buildProposalReplayFixture();
    const fixture = buildProposalReplayFixture({
      proposalGovernanceBindingResult: Object.freeze({
        ...base.input.proposalGovernanceBindingResult,
        snapshot: Object.freeze({
          ...base.input.proposalGovernanceBindingResult.snapshot,
          governanceSnapshotId: "governance-drift",
        }),
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.drifts.some((drift) => drift.driftType === "governance_mismatch")).toBe(true);
  });
});
