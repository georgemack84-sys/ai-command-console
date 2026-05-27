import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("runtime mutation attempts", () => {
  it("rejects runtime mutation markers", () => {
    const fixture = buildBoundedOrchestrationFixture({ metadata: { mutateRuntime: true } });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
