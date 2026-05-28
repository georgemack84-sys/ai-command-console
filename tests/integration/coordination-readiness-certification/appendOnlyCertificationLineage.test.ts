import { describe, expect, it } from "vitest";

import { buildCoordinationReadinessFixture } from "./helpers";

describe("append-only certification lineage", () => {
  it("appends immutable certification chronology without rewriting prior entries", () => {
    const first = buildCoordinationReadinessFixture();
    const second = buildCoordinationReadinessFixture({
      createdAt: "2026-05-17T17:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(2);
    expect(second.result.replayLedger[1]?.previousHash).toBe(first.result.replayLedger[0]?.entryHash ?? null);
  });
});
