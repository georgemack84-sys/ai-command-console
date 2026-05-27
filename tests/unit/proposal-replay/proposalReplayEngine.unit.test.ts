import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposalReplayEngine", () => {
  it("reconstructs immutable proposal history from original snapshots only", () => {
    const fixture = buildProposalReplayFixture();

    expect(fixture.result.replay.proposalId).toBe(fixture.input.proposalIntegrityResult.proposal.proposalId);
    expect(fixture.result.replay.governanceSnapshotId).toBe(fixture.input.proposalGovernanceBindingResult.snapshot.governanceSnapshotId);
    expect(fixture.result.replay.policySnapshotId).toBe(fixture.input.proposalGovernanceBindingResult.snapshot.policySnapshotId);
  });

  it("fails closed on missing proposal snapshot", () => {
    const base = buildProposalReplayFixture();
    const fixture = buildProposalReplayFixture({
      proposalIntegrityResult: Object.freeze({
        ...base.input.proposalIntegrityResult,
        snapshot: Object.freeze({
          ...base.input.proposalIntegrityResult.snapshot,
          snapshotId: "",
        }),
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REPLAY_MISSING_PROPOSAL_SNAPSHOT")).toBe(true);
  });
});
