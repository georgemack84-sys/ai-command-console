import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate adversarial", () => {
  it("invalidates synthetic authority injection", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ syntheticAuthority: true }),
    });

    expect(fixture.result.record.certificationState).toBe("INVALID");
  });
});
