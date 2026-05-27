import { describe, expect, it } from "vitest";

import { buildEscalationAwareCoordinationFixture } from "./helpers";

describe("escalation-aware coordination lineage", () => {
  it("preserves append-only escalation lineage and replay ledger", () => {
    const first = buildEscalationAwareCoordinationFixture();
    const second = buildEscalationAwareCoordinationFixture({
      createdAt: "2026-05-17T14:05:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(first.result.lineage.entries).toHaveLength(1);
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
