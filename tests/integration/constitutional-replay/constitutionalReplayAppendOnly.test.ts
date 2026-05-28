import { describe, expect, it } from "vitest";
import { buildConstitutionalReplayFixture } from "./helpers";

describe("constitutional replay append-only lineage", () => {
  it("appends immutable replay chronology without rewriting prior entries", () => {
    const first = buildConstitutionalReplayFixture();
    const second = buildConstitutionalReplayFixture({
      createdAt: "2026-05-18T12:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(4);
    expect(second.result.replayLedger[2]?.previousHash).toBe(first.result.replayLedger[1]?.entryHash ?? null);
  });
});
