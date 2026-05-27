import { describe, expect, it } from "vitest";
import { buildConstitutionalRuntimeSimulationFixture } from "./helpers";

describe("constitutional runtime simulation integration", () => {
  it("produces a passed advisory-only simulation for stable constitutional inputs", () => {
    const fixture = buildConstitutionalRuntimeSimulationFixture();

    expect(fixture.result.report.outcome).toBe("PASSED");
    expect(fixture.result.report.advisoryOnly).toBe(true);
    expect(fixture.result.report.executable).toBe(false);
    expect(fixture.result.errors).toHaveLength(0);
  });

  it("preserves append-only simulation lineage and ledger behavior", () => {
    const first = buildConstitutionalRuntimeSimulationFixture();
    const second = buildConstitutionalRuntimeSimulationFixture({
      simulationId: "constitutional-runtime-simulation-2",
      createdAt: "2026-05-19T03:01:00.000Z",
      existingLineage: first.result.lineage,
      existingReplayLedger: first.result.replayLedger,
    });

    expect(second.result.lineage.entries).toHaveLength(2);
    expect(second.result.replayLedger.length).toBeGreaterThan(first.result.replayLedger.length);
  });
});
