import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "./helpers";

describe("controlled autonomy readiness gate integration", () => {
  it("certifies a verified readiness result without granting authority", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture();

    expect(fixture.result.record.certificationState).toBe("VERIFIED");
    expect(fixture.result.authorityContract.autonomyAuthorization).toBe(false);
    expect(fixture.result.errors).toHaveLength(0);
  });

  it("preserves append-only lineage and replay ledger behavior", () => {
    const first = buildControlledAutonomyReadinessGateFixture();
    const second = buildControlledAutonomyReadinessGateFixture({
      gateId: "gate-2",
      createdAt: "2026-05-18T19:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
