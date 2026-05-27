import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposal replay red-team validator drift", () => {
  it("fails closed when original validator versions are unavailable", () => {
    const base = buildProposalReplayFixture();
    const fixture = buildProposalReplayFixture({
      proposalGovernanceBindingResult: Object.freeze({
        ...base.input.proposalGovernanceBindingResult,
        validatorVersionSet: Object.freeze({
          ...base.input.proposalGovernanceBindingResult.validatorVersionSet,
          replayValidatorVersion: "",
        }),
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REPLAY_VALIDATOR_VERSION_UNAVAILABLE")).toBe(true);
  });
});
