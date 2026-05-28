import { describe, expect, it } from "vitest";

import { validateSimulationLineage } from "@/services/planning/simulation";
import { buildSimulationFixture } from "@/tests/planning/simulation/helpers";

describe("lineage simulation validator", () => {
  it("accepts valid lineage", () => {
    const fixture = buildSimulationFixture();
    const validation = validateSimulationLineage(fixture);

    expect(validation.failures).toHaveLength(0);
  });

  it("fails on replay lineage fork attempts", () => {
    const fixture = buildSimulationFixture();
    fixture.versionedReplayArtifact.replayLineageInvariant.originalExecutionCompatibilityHash = "forked-hash";

    const validation = validateSimulationLineage(fixture);
    expect(validation.failures.some((failure) => failure.code === "SIMULATION_LINEAGE_DIVERGENCE")).toBe(true);
  });

  it("fails on migration lineage drift", () => {
    const fixture = buildSimulationFixture();
    (fixture.versionedReplayArtifact.migrationLineage[0] as { lineageHash: string }).lineageHash = "tampered";

    const validation = validateSimulationLineage(fixture);
    expect(validation.failures.some((failure) => failure.code === "SIMULATION_LINEAGE_DIVERGENCE")).toBe(true);
  });
});
