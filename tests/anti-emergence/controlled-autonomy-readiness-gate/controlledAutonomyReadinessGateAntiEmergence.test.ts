import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate anti-emergence", () => {
  it("invalidates authority expansion attempts", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ authorityExpansion: true }),
    });

    expect(fixture.result.record.certificationState).toBe("INVALID");
  });
});
