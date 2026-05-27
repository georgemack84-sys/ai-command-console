import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("bounded orchestration replay", () => {
  it("preserves replay-safe orchestration reconstruction", () => {
    const fixture = buildBoundedOrchestrationFixture();
    expect(fixture.record.replay.replayHash.length).toBeGreaterThan(0);
    expect(fixture.record.replay.routingLineageId).toBe(fixture.routingFixture.result.lineage.lineageId);
  });
});
