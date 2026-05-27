import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";
import { buildConstitutionalReadinessFixture } from "@/tests/integration/constitutional-readiness/helpers";

describe("controlled autonomy readiness gate fail-closed", () => {
  it("inherits frozen readiness from upstream certification", () => {
    const readiness = buildConstitutionalReadinessFixture({
      metadata: Object.freeze({ governanceSuppression: true }),
    }).result;
    const fixture = buildControlledAutonomyReadinessGateFixture({
      constitutionalReadinessResult: readiness,
    });

    expect(fixture.result.record.failClosed).toBe(true);
    expect(fixture.result.record.certificationState).toBe("FROZEN");
  });
});
