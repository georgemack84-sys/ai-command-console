import { describe, expect, it } from "vitest";

import { buildSimulationReadiness, orchestrateSimulation } from "@/services/planning/simulation";
import { buildSimulationFixture } from "@/tests/planning/simulation/helpers";

describe("simulation orchestrator", () => {
  it("produces deterministic results for identical input", () => {
    const fixture = buildSimulationFixture();

    const first = orchestrateSimulation(fixture);
    const second = orchestrateSimulation(fixture);

    expect(first.result).toEqual(second.result);
  });

  it("keeps hashes stable across object key reordering", () => {
    const fixture = buildSimulationFixture();
    fixture.normalizedPlan.steps[0]!.inputs = {
      autonomySensitivity: "safe",
      rollbackCapability: "full",
      targetEnvironment: "local",
      compatibility: fixture.normalizedPlan.steps[0]!.inputs.compatibility,
    };

    const first = buildSimulationReadiness(buildSimulationFixture());
    const second = buildSimulationReadiness(fixture);

    expect(second.derivedSimulationHash).toBe(first.derivedSimulationHash);
  });

  it("changes derived result when semantic content changes", () => {
    const fixture = buildSimulationFixture();
    const first = buildSimulationReadiness(fixture);
    fixture.normalizedPlan.steps[1]!.inputs.targetEnvironment = "production";

    const second = buildSimulationReadiness(fixture);
    expect(second.derivedSimulationHash).not.toBe(first.derivedSimulationHash);
  });

  it("preserves upstream hashes", () => {
    const fixture = buildSimulationFixture();
    const simulation = orchestrateSimulation(fixture);

    expect(simulation.result.executionTruthHash).toBe(fixture.executionTruthPackage.executionTruthHash);
    expect(simulation.result.executionCompatibilityHash).toBe(fixture.executionCompatibilityContract.executionCompatibilityHash);
    expect(simulation.result.replaySnapshotHash).toBe(
      fixture.versionedReplayArtifact.replayAuditResult.replaySnapshotHash,
    );
  });

  it("does not mutate shared state across concurrent runs", async () => {
    const fixture = buildSimulationFixture();
    const before = JSON.stringify(fixture);

    const [first, second] = await Promise.all([
      Promise.resolve(orchestrateSimulation(fixture)),
      Promise.resolve(orchestrateSimulation(fixture)),
    ]);

    expect(first.result.derivedSimulationHash).toBe(second.result.derivedSimulationHash);
    expect(JSON.stringify(fixture)).toBe(before);
  });
});
