import { describe, expect, it } from "vitest";
import { buildConstitutionalAuthorityBoundaryFixture } from "@/tests/integration/constitutional-authority-boundary/helpers";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("constitutional authority boundary fail-closed", () => {
  it("revokes on frozen upstream certification", () => {
    const gate = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ governanceSuppression: true }),
    }).result;
    const fixture = buildConstitutionalAuthorityBoundaryFixture({
      controlledAutonomyReadinessGateResult: gate,
    });

    expect(fixture.result.record.failClosed).toBe(true);
    expect(["FROZEN", "REVOKED", "INVALID"]).toContain(fixture.result.record.certificationState);
  });
});
