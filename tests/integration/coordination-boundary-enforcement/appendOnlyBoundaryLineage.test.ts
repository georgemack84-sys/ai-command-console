import { describe, expect, it } from "vitest";

import { buildCoordinationBoundaryFixture } from "./helpers";

describe("append-only boundary lineage", () => {
  it("appends immutable boundary chronology without rewriting prior entries", () => {
    const first = buildCoordinationBoundaryFixture();
    const second = buildCoordinationBoundaryFixture({
      createdAt: "2026-05-17T16:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(2);
    expect(second.result.replayLedger[1]?.previousHash).toBe(first.result.replayLedger[0]?.entryHash ?? null);
  });
});
