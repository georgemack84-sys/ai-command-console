import { describe, expect, it } from "vitest";

import { buildCoordinationReplayFixture } from "./helpers";

describe("coordination replay append-only lineage", () => {
  it("preserves append-only replay ledger chronology", () => {
    const first = buildCoordinationReplayFixture();
    const second = buildCoordinationReplayFixture({
      createdAt: "2026-05-17T13:05:00.000Z",
      existingLedger: first.result.ledger,
    });

    expect(first.result.ledger.entries).toHaveLength(5);
    expect(second.result.ledger.entries.length).toBeGreaterThan(first.result.ledger.entries.length);
    expect(second.result.ledger.entries[0]?.entryId).toBe(first.result.ledger.entries[0]?.entryId);
  });
});
