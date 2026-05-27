import { buildProposalGovernanceBindingFixture } from "@/tests/integration/proposal-governance-binding/helpers";

describe("proposal governance replay integration", () => {
  it("uses original replay governance only", () => {
    const fixture = buildProposalGovernanceBindingFixture();

    expect(fixture.result.snapshot.governanceSnapshotId)
      .toBe(fixture.input.recommendationReplayResult.episodes[0]?.governanceReplay.governanceSnapshotId);
    expect(fixture.result.snapshot.policySnapshotId)
      .toBe(fixture.input.recommendationReplayResult.episodes[0]?.governanceReplay.policySnapshotId);
  });
});
