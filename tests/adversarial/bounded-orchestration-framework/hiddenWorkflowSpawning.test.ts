import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("hidden workflow spawning", () => {
  it("rejects workflow markers", () => {
    const fixture = buildBoundedOrchestrationFixture({ metadata: { workflowSpawn: true } });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
