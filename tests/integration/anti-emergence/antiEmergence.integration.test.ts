import { describe, expect, it } from "vitest";
import { buildAntiEmergenceFixture } from "./helpers";

describe("anti-emergence containment integration", () => {
  it("certifies contained historical state deterministically", () => {
    const fixture = buildAntiEmergenceFixture();

    expect(fixture.result.record.classification).toBe("contained");
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.record.failClosed).toBe(false);
  });

  it("preserves append-only emergence lineage and ledger behavior", () => {
    const first = buildAntiEmergenceFixture();
    const second = buildAntiEmergenceFixture({
      containmentId: "anti-emergence-2",
      createdAt: "2026-05-19T00:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
