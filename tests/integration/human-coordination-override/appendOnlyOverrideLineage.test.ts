import { describe, expect, it } from "vitest";

import { buildHumanCoordinationOverrideFixture } from "./helpers";

describe("append-only human override lineage", () => {
  it("appends immutable override chronology without rewriting prior entries", () => {
    const first = buildHumanCoordinationOverrideFixture();
    const second = buildHumanCoordinationOverrideFixture({
      createdAt: "2026-05-17T15:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.lineage.entries[0]?.overrideId).toBe(first.result.record.overrideId);
    expect(second.result.replayLedger).toHaveLength(2);
    expect(second.result.replayLedger[1]?.previousHash).toBe(first.result.replayLedger[0]?.entryHash ?? null);
  });
});
