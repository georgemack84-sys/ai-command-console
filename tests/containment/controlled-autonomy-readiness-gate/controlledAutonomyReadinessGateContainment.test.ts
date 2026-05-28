import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate containment", () => {
  it("freezes on containment degradation", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ containmentDegradation: true }),
    });

    expect(["FROZEN", "INVALID"]).toContain(fixture.result.record.certificationState);
  });
});
