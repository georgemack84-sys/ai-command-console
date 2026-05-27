import { validateProposalReplayDrift } from "@/services/proposal-replay/replayDriftValidator";
import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("replayDriftValidator", () => {
  it("emits governance drift records for governance mismatches", () => {
    const fixture = buildProposalReplayFixture();
    const drifts = validateProposalReplayDrift({
      replayInput: fixture.input,
      replay: fixture.result.replay,
      errors: Object.freeze([{
        code: "PROPOSAL_REPLAY_GOVERNANCE_MISMATCH",
        message: "drift",
        path: "governance",
      }]),
    });

    expect(drifts[0]?.driftType).toBe("governance_mismatch");
    expect(drifts[0]?.frozen).toBe(true);
  });
});
