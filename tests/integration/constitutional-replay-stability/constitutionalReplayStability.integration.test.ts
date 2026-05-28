import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayStabilityFixture } from "./helpers";

describe("constitutional replay stability integration", () => {
  it("reconstructs stable historical constitutional state deterministically", () => {
    const fixture = buildConstitutionalReplayStabilityFixture();

    expect(fixture.result.record.classification).toBe("STABLE");
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.record.replayDeterministic).toBe(true);
  });

  it("preserves append-only lineage and ledger behavior", () => {
    const first = buildConstitutionalReplayStabilityFixture();
    const second = buildConstitutionalReplayStabilityFixture({
      replayId: "replay-stability-2",
      createdAt: "2026-05-18T21:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
