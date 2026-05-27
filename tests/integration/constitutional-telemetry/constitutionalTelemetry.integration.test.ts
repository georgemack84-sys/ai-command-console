import { describe, expect, it } from "vitest";
import { buildConstitutionalTelemetryFixture } from "./helpers";

describe("constitutional telemetry integration", () => {
  it("reconstructs stable constitutional visibility deterministically", () => {
    const fixture = buildConstitutionalTelemetryFixture();

    expect(fixture.result.record.telemetryState).toBe("stable");
    expect(fixture.result.errors).toHaveLength(0);
    expect(fixture.result.record.failClosed).toBe(false);
  });

  it("preserves append-only telemetry lineage and ledger behavior", () => {
    const first = buildConstitutionalTelemetryFixture();
    const second = buildConstitutionalTelemetryFixture({
      telemetryId: "constitutional-telemetry-2",
      createdAt: "2026-05-19T02:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
