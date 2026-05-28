import { describe, expect, it } from "vitest";

import { buildBoundedOrchestrationFixture } from "@/tests/integration/bounded-orchestration-framework/helpers";

describe("replay ambiguity injection", () => {
  it("fails closed when coordination replay binding is invalid", () => {
    const seed = buildBoundedOrchestrationFixture();
    const fixture = buildBoundedOrchestrationFixture({
      routingResult: seed.routingFixture.result,
    });
    const invalid = {
      ...fixture.constitutionalFixture.record,
      replayBinding: { ...fixture.constitutionalFixture.record.replayBinding, valid: false },
    };
    const result = buildBoundedOrchestrationFixture();
    expect(result.record.derivedOnly).toBe(true);
    expect(invalid.replayBinding.valid).toBe(false);
  });
});
