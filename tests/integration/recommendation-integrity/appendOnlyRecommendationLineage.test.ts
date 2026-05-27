import { describe, expect, it } from "vitest";

import { buildRecommendationIntegrityFixture } from "./helpers";

describe("append-only recommendation lineage", () => {
  it("appends immutable recommendation chronology without rewriting prior entries", () => {
    const first = buildRecommendationIntegrityFixture();
    const second = buildRecommendationIntegrityFixture({
      createdAt: "2026-05-17T19:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(4);
    expect(second.result.replayLedger[2]?.previousHash).toBe(first.result.replayLedger[1]?.entryHash ?? null);
  });
});
