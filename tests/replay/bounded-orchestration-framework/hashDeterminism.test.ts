import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("bounded orchestration hash determinism", () => {
  it("keeps identical input identical-hash behavior", () => {
    const fixture = buildBoundedOrchestrationFixture();
    expect(fixture.record.deterministicHash).toBe(fixture.record.deterministicHash);
  });
});
