import { describe, expect, it } from "vitest";

import { buildSimulationReadiness, createSimulationAdapterRegistry, orchestrateSimulation } from "@/services/planning/simulation";
import { buildSimulationFixture } from "@/tests/planning/simulation/helpers";

describe("simulation red team", () => {
  it("fails on compatibility hash substitution", () => {
    const fixture = buildSimulationFixture();
    (fixture.executionCompatibilityContract as { executionCompatibilityHash: string }).executionCompatibilityHash = "substituted";

    const readiness = buildSimulationReadiness(fixture);
    expect(readiness.ready).toBe(false);
  });

  it("fails on replay anchor corruption", () => {
    const fixture = buildSimulationFixture();
    (fixture.versionedReplayArtifact.replayAuditResult as { replaySnapshotHash?: string }).replaySnapshotHash = "corrupted";

    const readiness = buildSimulationReadiness(fixture);
    expect(readiness.failures.some((failure) => failure.code === "SIMULATION_LINEAGE_DIVERGENCE")).toBe(true);
  });

  it("fails closed for unsupported adapters", () => {
    const fixture = buildSimulationFixture();
    fixture.normalizedPlan.steps[0]!.action = {
      tool: "non_simulatable",
      operation: "run",
      parameters: {},
    };

    const result = orchestrateSimulation({
      ...fixture,
      adapterRegistry: createSimulationAdapterRegistry(),
    });

    expect(result.result.failures.some((failure) => failure.code === "SIMULATION_UNSUPPORTED_TOOL")).toBe(true);
  });

  it("fails on stale snapshot contamination", () => {
    const fixture = buildSimulationFixture();
    (fixture.versionedReplayArtifact.replayAuditResult as { planHash: string }).planHash = "stale-plan-hash";

    const readiness = buildSimulationReadiness(fixture);
    expect(readiness.ready).toBe(false);
  });
});
