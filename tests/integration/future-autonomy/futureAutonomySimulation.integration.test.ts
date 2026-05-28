import { describe, expect, it } from "vitest";
import { buildFutureAutonomyFixture } from "./helpers";

describe("future autonomy simulation integration", () => {
  it("produces append-only lineage and replay ledger entries", () => {
    const first = buildFutureAutonomyFixture();
    const second = buildFutureAutonomyFixture({
      createdAt: "2026-05-18T14:05:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(first.result.lineage.entries).toHaveLength(1);
    expect(second.result.lineage.entries).toHaveLength(2);
    expect(first.result.replayLedger).toHaveLength(2);
    expect(second.result.replayLedger).toHaveLength(4);
    expect(second.result.replayLedger[1]?.entryHash).toBe(second.result.replayLedger[2]?.previousHash);
  });

  it("keeps the result advisory-only and non-authoritative", () => {
    const fixture = buildFutureAutonomyFixture();

    expect(fixture.result.result.advisoryOnly).toBe(true);
    expect(fixture.result.result.authorityGranted).toBe(false);
    expect(fixture.result.result.orchestrationAllowed).toBe(false);
    expect(fixture.result.result.runtimeMutationAllowed).toBe(false);
  });
});
