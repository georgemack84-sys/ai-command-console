import { describe, expect, it } from "vitest";
import { buildRuntimeAdmissibilityFixture } from "./helpers";

describe("runtime admissibility integration", () => {
  it("certifies runtime compatibility deterministically when constitutional evidence remains intact", () => {
    const fixture = buildRuntimeAdmissibilityFixture();

    expect(fixture.result.record.classification).toBe("admissible");
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.record.failClosed).toBe(false);
  });

  it("preserves append-only runtime certification lineage and ledger behavior", () => {
    const first = buildRuntimeAdmissibilityFixture();
    const second = buildRuntimeAdmissibilityFixture({
      admissibilityId: "runtime-admissibility-2",
      createdAt: "2026-05-19T01:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
