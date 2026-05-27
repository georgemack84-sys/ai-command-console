import { buildConstitutionalEnforcementFixture } from "@/tests/integration/constitutional-enforcement/helpers";

describe("constitutional enforcement replay", () => {
  it("reconstructs original replay-safe lineage without recomputing authority", () => {
    const fixture = buildConstitutionalEnforcementFixture();

    expect(fixture.result.replay.evidenceChain).toEqual(
      fixture.input.replayResult.episodes[0]?.evidenceReplay.normalizedEvidenceRefs,
    );
    expect(fixture.result.lineage.governanceSnapshotId).toBe(
      fixture.input.replayResult.episodes[0]?.governanceReplay.governanceSnapshotId,
    );
    expect(fixture.result.verdict.executionAuthorized).toBe(false);
  });
});
