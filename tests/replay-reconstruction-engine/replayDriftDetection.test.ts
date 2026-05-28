import { describe, expect, it } from "vitest";
import { buildReplayFixture, classifyReplayDrift, projectReplayComparison, projectReplayIntegrity, projectReplayLineage } from "./helpers";

describe("replay drift detection", () => {
  it("classifies replay and governance drift deterministically", () => {
    const fixture = buildReplayFixture();
    const lineage = projectReplayLineage(fixture.input);
    const integrity = projectReplayIntegrity({
      treaty: fixture.input.treaty,
      validation: fixture.input.validation,
      lineage,
    });
    const comparison = projectReplayComparison(fixture.input);
    const drift = classifyReplayDrift({
      lineage,
      integrity,
      comparison,
    });

    expect(drift.driftDetected).toBe(true);
    expect(drift.driftTypes.length).toBeGreaterThan(0);
  });
});
