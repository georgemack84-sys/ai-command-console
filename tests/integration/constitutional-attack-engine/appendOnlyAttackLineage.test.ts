import { describe, expect, it } from "vitest";

import { buildConstitutionalAttackFixture } from "./helpers";

describe("append-only attack lineage", () => {
  it("appends immutable attack chronology without rewriting prior entries", () => {
    const first = buildConstitutionalAttackFixture();
    const second = buildConstitutionalAttackFixture({
      createdAt: "2026-05-17T18:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(4);
    expect(second.result.replayLedger[2]?.previousHash).toBe(first.result.replayLedger[1]?.entryHash ?? null);
  });
});
