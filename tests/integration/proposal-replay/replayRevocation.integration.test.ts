import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposal replay revocation propagation", () => {
  it("preserves active revocation containment", () => {
    const fixture = buildProposalReplayFixture();

    expect(fixture.input.proposalRevocationResult.status).toBe("CASCADE_COMPLETED");
    expect(fixture.result.status).toBe("FROZEN");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REPLAY_REVOKED")).toBe(true);
  });
});
