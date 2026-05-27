import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("containment bypass attempts", () => {
  it("does not route around frozen containment inheritance", () => {
    const fixture = buildBoundedOrchestrationFixture({ metadata: { dispatch: true } });
    expect(fixture.record.containment.ceilingLevel).toBe("frozen");
  });
});
