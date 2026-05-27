import { describe, expect, it } from "vitest";
import { buildControlledAutonomyReadinessGateFixture } from "@/tests/integration/controlled-autonomy-readiness-gate/helpers";

describe("controlled autonomy readiness gate replay", () => {
  it("freezes on replay ambiguity", () => {
    const fixture = buildControlledAutonomyReadinessGateFixture({
      metadata: Object.freeze({ replayAmbiguity: true }),
    });

    expect(fixture.result.record.certificationState).toBe("FROZEN");
  });
});
