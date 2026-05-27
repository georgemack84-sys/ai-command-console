import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("replay repair attempts", () => {
  it("rejects replay repair markers", () => {
    const fixture = buildBoundedOrchestrationFixture({ metadata: { repairReplay: true } });
    expect(fixture.record.validation.failClosed).toBe(true);
  });
});
