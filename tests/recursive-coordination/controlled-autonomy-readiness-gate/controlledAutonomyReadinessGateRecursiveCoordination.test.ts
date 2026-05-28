import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate recursive coordination", () => {
  it("invalidates recursive coordination attempts", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ recursiveCoordination: true, recursiveWorkflow: true }),
    });

    expect(fixture.result.record.certificationState).toBe("INVALID");
  });
});
