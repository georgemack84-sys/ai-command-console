import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("dynamic orchestration generation", () => {
  it("rejects generated workflow targets inherited from routing", () => {
    const fixture = buildBoundedOrchestrationFixture({
      routingResult: buildBoundedOrchestrationFixture().routingFixture.result,
      metadata: { generatedWorkflow: true },
    });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
