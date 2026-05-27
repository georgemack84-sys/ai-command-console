import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("authority expansion attempts", () => {
  it("rejects orchestration inheritance markers", () => {
    const fixture = buildBoundedOrchestrationFixture({ metadata: { authorityInheritance: true } });
    expect(fixture.record.errors.some((error) => error.code === "ORCHESTRATION_AUTHORITY_EXPANSION")).toBe(true);
  });
});
