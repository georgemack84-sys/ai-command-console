import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("bounded orchestration isolation", () => {
  it("preserves governance and replay scope isolation", () => {
    const fixture = buildBoundedOrchestrationFixture();
    expect(fixture.record.isolation.isolated).toBe(true);
    expect(fixture.record.isolation.governanceScopeId.length).toBeGreaterThan(0);
  });
});
