import { describe, expect, it } from "vitest";
import { buildAdversarialTelemetryFixture } from "./helpers";

describe("adversarial telemetry integration", () => {
  it("produces append-only lineage and replay ledger entries", () => {
    const first = buildAdversarialTelemetryFixture();
    const second = buildAdversarialTelemetryFixture({
      createdAt: "2026-05-18T16:05:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(first.result.lineage.entries).toHaveLength(1);
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(first.result.replayLedger).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(4);
    expect(second.result.replayLedger[1]?.entryHash).toBe(second.result.replayLedger[2]?.previousHash);
  });

  it("keeps telemetry advisory-only and non-authoritative", () => {
    const fixture = buildAdversarialTelemetryFixture();

    expect(fixture.result.authorityContract.executionAuthority).toBe(false);
    expect(fixture.result.authorityContract.orchestrationAuthority).toBe(false);
    expect(fixture.result.authorityContract.runtimeMutationAuthority).toBe(false);
  });
});
