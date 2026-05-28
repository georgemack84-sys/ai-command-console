import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate governance", () => {
  it("freezes on governance suppression", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ governanceSuppression: true }),
    });

    expect(fixture.result.record.certificationState).toBe("FROZEN");
  });
});
