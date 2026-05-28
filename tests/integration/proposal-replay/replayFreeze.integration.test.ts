import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposal replay freeze propagation", () => {
  it("preserves active freeze containment", () => {
    const base = buildProposalReplayFixture();
    const fixture = buildProposalReplayFixture({
      proposalFreezeResult: Object.freeze({
        ...base.input.proposalFreezeResult,
        status: "FROZEN" as const,
      }),
    });

    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REPLAY_FROZEN")).toBe(true);
  });
});
