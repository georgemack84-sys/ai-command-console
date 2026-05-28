import { describe, expect, it } from "vitest";
import { buildGovernanceDriftFixture } from "./helpers";

describe("governance drift append-only lineage", () => {
  it("appends immutable drift chronology without rewriting prior entries", () => {
    const first = buildGovernanceDriftFixture();
    const second = buildGovernanceDriftFixture({
      createdAt: "2026-05-18T13:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(4);
    expect(second.result.replayLedger[2]?.previousHash).toBe(first.result.replayLedger[1]?.entryHash ?? null);
  });
});
