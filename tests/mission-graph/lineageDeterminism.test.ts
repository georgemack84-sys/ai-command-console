import { describe, expect, it } from "vitest";

import { buildMissionGraphFixture } from "./helpers";

describe("mission graph lineage determinism", () => {
  it("preserves append-only deterministic ledger ordering", () => {
    const first = buildMissionGraphFixture();
    const second = buildMissionGraphFixture({
      createdAt: "2026-05-17T08:10:00.000Z",
    });

    expect(first.snapshot.ledger.entries).toHaveLength(1);
    expect(second.snapshot.ledger.entries).toHaveLength(1);
    expect(first.snapshot.proposalLineages[0]?.lineageHash).toBeTruthy();
    expect(first.snapshot.escalationLineages[0]?.lineageHash).toBeTruthy();
  });
});
