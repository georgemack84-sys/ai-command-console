import { describe, expect, it } from "vitest";

import { buildCoordinationBoundaryFixture } from "@/tests/integration/coordination-boundary-enforcement/helpers";

describe("boundary replay", () => {
  it("preserves deterministic replay-safe evidence", () => {
    const fixture = buildCoordinationBoundaryFixture();
    expect(fixture.result.record.replaySafe).toBe(true);
    expect(fixture.result.orchestrationInspection.topologyHash.length).toBeGreaterThan(0);
  });
});
