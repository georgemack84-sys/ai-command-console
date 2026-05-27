import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("orchestration continuation attempts", () => {
  it("rejects workflow continuation markers", () => {
    const fixture = buildBoundedOrchestrationFixture({ metadata: { continueWorkflow: true } });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
