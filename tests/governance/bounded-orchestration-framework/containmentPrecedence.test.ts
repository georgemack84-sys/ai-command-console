import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("bounded orchestration containment precedence", () => {
  it("freezes when inherited containment is frozen", () => {
    const frozenContainment = buildBoundedOrchestrationFixture({
      metadata: { dispatch: true },
    });
    expect(frozenContainment.record.state).toBe("frozen");
  });
});
