import { describe, expect, it } from "vitest";

import { buildApprovalConflictFixture } from "./helpers";

describe("append-only approval conflict lineage", () => {
  it("appends immutable conflict chronology without rewriting prior entries", () => {
    const first = buildApprovalConflictFixture();
    const second = buildApprovalConflictFixture({
      createdAt: "2026-05-17T20:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(4);
    expect(second.result.replayLedger[2]?.previousHash).toBe(first.result.replayLedger[1]?.entryHash ?? null);
  });
});
