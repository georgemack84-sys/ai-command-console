import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("proposal replay red-team dependency inference", () => {
  it("fails closed when immutable dependency lineage is missing", () => {
    const base = buildProposalReplayFixture();
    const fixture = buildProposalReplayFixture({
      proposalStateEngineResult: Object.freeze({
        ...base.input.proposalStateEngineResult,
        lineage: Object.freeze({
          ...base.input.proposalStateEngineResult.lineage,
          dependencyLineageIds: [],
        }),
      }),
      proposalFreezeResult: Object.freeze({
        ...base.input.proposalFreezeResult,
        freezeRecord: Object.freeze({
          ...base.input.proposalFreezeResult.freezeRecord,
          dependencySnapshotIds: [],
        }),
      }),
    });

    expect(fixture.result.status).toBe("FAILED_CLOSED");
    expect(fixture.result.errors.some((error) => error.code === "PROPOSAL_REPLAY_DEPENDENCY_SNAPSHOT_MISSING")).toBe(true);
  });
});
