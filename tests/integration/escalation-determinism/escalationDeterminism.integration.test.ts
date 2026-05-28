import { describe, expect, it } from "vitest";
import { buildEscalationDeterminismFixture } from "./helpers";

describe("escalation determinism integration", () => {
  it("reconstructs stable escalation behavior deterministically", () => {
    const fixture = buildEscalationDeterminismFixture();

    expect(fixture.result.record.oversightState).toBe("stable");
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.record.failClosed).toBe(false);
  });

  it("preserves append-only escalation lineage and ledger behavior", () => {
    const first = buildEscalationDeterminismFixture();
    const second = buildEscalationDeterminismFixture({
      escalationId: "escalation-determinism-2",
      createdAt: "2026-05-18T23:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
