import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate isolation", () => {
  it("invalidates runtime contamination and privilege escalation", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ runtimeContamination: true, privilegeEscalation: true }),
    });

    expect(fixture.result.record.certificationState).toBe("INVALID");
  });
});
