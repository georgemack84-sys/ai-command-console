import { describe, expect, it } from "vitest";

import { validateReplayContainment } from "@/services/coordination-containment/replayContainmentValidator";
import { buildMissionGraphFixture } from "@/tests/mission-graph/helpers";

describe("validateReplayContainment", () => {
  it("contains replay mismatch and frozen visibility", () => {
    const fixture = buildMissionGraphFixture();
    const errors = validateReplayContainment({
      coordinationId: fixture.input.coordinationRecord.coordinationId,
      missionGraph: { ...fixture.snapshot, visibilityState: "frozen" },
      escalationRecord: fixture.input.escalationRecord,
      freshnessEvaluation: {
        ...fixture.input.freshnessEvaluation,
        state: { ...fixture.input.freshnessEvaluation.state, replayIntegrity: "mismatch" },
      },
      lifecycle: fixture.input.lifecycle,
      createdAt: fixture.input.createdAt,
    });

    expect(errors).toContain("freshness-replay-integrity");
    expect(errors).toContain("mission-graph-frozen");
  });
});
