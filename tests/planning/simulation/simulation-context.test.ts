import { describe, expect, it } from "vitest";

import { buildSimulationLineageContext, buildSimulationReadiness } from "@/services/planning/simulation";
import { buildSimulationFixture } from "@/tests/planning/simulation/helpers";

describe("simulation context", () => {
  it("fails closed when lineage is missing", () => {
    const fixture = buildSimulationFixture();
    fixture.versionedReplayArtifact.immutableReplayIdentityRoot.executionTruthHash = "";

    const readiness = buildSimulationReadiness(fixture);
    expect(readiness.ready).toBe(false);
    expect(readiness.failures.some((failure) => failure.code === "SIMULATION_LINEAGE_MISSING" || failure.code === "SIMULATION_LINEAGE_DIVERGENCE")).toBe(true);
  });

  it("builds deterministic lineage context from versioned replay artifact", () => {
    const fixture = buildSimulationFixture();
    const first = buildSimulationLineageContext(fixture.versionedReplayArtifact);
    const second = buildSimulationLineageContext(fixture.versionedReplayArtifact);

    expect(first).toEqual(second);
    expect(first.executionTruthHash).toBe(fixture.executionTruthPackage.executionTruthHash);
    expect(first.executionCompatibilityHash).toBe(fixture.executionCompatibilityContract.executionCompatibilityHash);
  });
});
