import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposal replay red-team authority expansion", () => {
  it("freezes on replay-time authority expansion attempts", () => {
    const base = buildProposalReplayFixture();
    const fixture = buildProposalReplayFixture({
      proposalGovernanceBindingResult: Object.freeze({
        ...base.input.proposalGovernanceBindingResult,
        authorityBoundary: Object.freeze({
          ...base.input.proposalGovernanceBindingResult.authorityBoundary,
          allowedScopes: Object.freeze(["proposal.review", "runtime.execute"]),
        }),
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.drifts.some((drift) => drift.driftType === "authority_mismatch")).toBe(true);
  });
});
