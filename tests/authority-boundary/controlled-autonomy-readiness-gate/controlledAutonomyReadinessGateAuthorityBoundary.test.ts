import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate authority boundary", () => {
  it("invalidates delegation leakage and approval inheritance", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ delegationLeakage: true, approvalInheritance: true }),
    });

    expect(fixture.result.record.certificationState).toBe("INVALID");
  });
});
