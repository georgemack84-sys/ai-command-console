import { loadProposalReplaySnapshots } from "@/services/proposal-replay/replaySnapshotLoader";
import { buildProposalReplayFixture } from "@/tests/integration/proposal-replay/helpers";

describe("replaySnapshotLoader", () => {
  it("loads immutable snapshot bundles deterministically", () => {
    const fixture = buildProposalReplayFixture();
    const result = loadProposalReplaySnapshots(fixture.input);

    expect(result.errors).toHaveLength(0);
    expect(result.snapshotBundle.governanceSnapshot.governanceSnapshotId).toBe(fixture.input.proposalGovernanceBindingResult.snapshot.governanceSnapshotId);
  });
});
